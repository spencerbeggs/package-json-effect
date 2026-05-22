import { Data, Effect, HashMap, Option, Pipeable, Schema } from "effect";
import { dual } from "effect/Function";
import type { InvalidVersionError, SemVer } from "semver-effect";
import { parseValidSemVer } from "semver-effect";
import type { DependencyResolutionError } from "../errors/DependencyResolutionError.js";
import { InvalidPackageNameError } from "../errors/InvalidPackageNameError.js";
import { InvalidSpdxLicenseError } from "../errors/InvalidSpdxLicenseError.js";
import { BinSchema } from "../schemas/bin.js";
import { DependencyMapSchema } from "../schemas/dependency-map.js";
import { DevEnginesSchema } from "../schemas/dev-engines.js";
import { EnginesSchema } from "../schemas/engines.js";
import { ExportsFieldSchema } from "../schemas/exports-field.js";
import { SpdxLicense as SpdxLicenseSchema } from "../schemas/license.js";
import { PackageName, isValidPackageName } from "../schemas/name.js";
import { PackageManagerSchema } from "../schemas/package-manager.js";
import { PublishConfigSchema } from "../schemas/publish-config.js";
import { ScriptsSchema } from "../schemas/scripts.js";
import { VersionSchema } from "../schemas/version.js";
import { CatalogResolver } from "../services/CatalogResolver.js";
import { WorkspaceResolver } from "../services/WorkspaceResolver.js";
import { Dependency } from "./Dependency.js";
import { DevDependency } from "./DevDependency.js";
import { OptionalDependency } from "./OptionalDependency.js";
import { PackageNameUtil } from "./PackageName.js";
import { PeerDependency } from "./PeerDependency.js";

// Apply a workspace: modifier to a bare version: "*"/""->exact, "^"->caret, "~"->tilde,
// an explicit range passes through.
const applyWorkspaceModifier = (specifier: string, version: string): string => {
	const mod = specifier.slice("workspace:".length);
	if (mod === "*" || mod === "") return version;
	if (mod === "^") return `^${version}`;
	if (mod === "~") return `~${version}`;
	return mod; // explicit range like workspace:1.2.3 or workspace:^1.0.0
};

const catalogName = (specifier: string): Option.Option<string> => {
	const name = specifier.slice("catalog:".length);
	return name.length === 0 ? Option.none() : Option.some(name);
};

/**
 * Domain model for a package.json document. A Schema.Class carrying typed
 * known fields plus a `rest` catch-all that preserves any unmodeled top-level
 * fields for round-trip fidelity. The literal `rest` key is flattened away by
 * the wire transform in src/schemas/package-json.ts.
 */
export class Package extends Schema.Class<Package>("Package")({
	name: PackageName,
	version: VersionSchema,
	description: Schema.optionalWith(Schema.String, { as: "Option" }),
	private: Schema.optionalWith(Schema.Boolean, { as: "Option" }),
	type: Schema.optionalWith(Schema.Literal("module", "commonjs"), { as: "Option" }),
	main: Schema.optionalWith(Schema.String, { as: "Option" }),
	license: Schema.optionalWith(Schema.String, { as: "Option" }),
	dependencies: Schema.optionalWith(DependencyMapSchema, { default: () => HashMap.empty<string, string>() }),
	devDependencies: Schema.optionalWith(DependencyMapSchema, { default: () => HashMap.empty<string, string>() }),
	peerDependencies: Schema.optionalWith(DependencyMapSchema, { default: () => HashMap.empty<string, string>() }),
	optionalDependencies: Schema.optionalWith(DependencyMapSchema, { default: () => HashMap.empty<string, string>() }),
	peerDependenciesMeta: Schema.optionalWith(
		Schema.Record({ key: Schema.String, value: Schema.Struct({ optional: Schema.optional(Schema.Boolean) }) }),
		{ as: "Option" },
	),
	scripts: Schema.optionalWith(ScriptsSchema, { default: () => HashMap.empty<string, string>() }),
	bin: Schema.optionalWith(BinSchema, { as: "Option" }),
	engines: Schema.optionalWith(EnginesSchema, { as: "Option" }),
	exports: Schema.optionalWith(ExportsFieldSchema, { as: "Option" }),
	publishConfig: Schema.optionalWith(PublishConfigSchema, { as: "Option" }),
	packageManager: Schema.optionalWith(PackageManagerSchema, { as: "Option" }),
	devEngines: Schema.optionalWith(DevEnginesSchema, { as: "Option" }),
	rest: Schema.optionalWith(Schema.Data(Schema.Record({ key: Schema.String, value: Schema.Unknown })), {
		default: () => Data.struct({}) as Record<string, unknown>,
	}),
}) {
	get isPrivate(): boolean {
		return Option.getOrElse(this.private, () => false);
	}

	get isScoped(): boolean {
		return PackageNameUtil.isScoped(this.name);
	}

	get isESM(): boolean {
		return Option.match(this.type, { onNone: () => false, onSome: (t) => t === "module" });
	}

	pipe<A>(this: A): A;
	pipe<A, B>(this: A, ab: (_: A) => B): B;
	pipe<A, B, C>(this: A, ab: (_: A) => B, bc: (_: B) => C): C;
	pipe<A, B, C, D>(this: A, ab: (_: A) => B, bc: (_: B) => C, cd: (_: C) => D): D;
	pipe<A, B, C, D, E>(this: A, ab: (_: A) => B, bc: (_: B) => C, cd: (_: C) => D, de: (_: D) => E): E;
	pipe() {
		// biome-ignore lint/complexity/noArguments: Pipeable.pipeArguments requires the arguments object
		return Pipeable.pipeArguments(this, arguments);
	}

	hasDependency(name: string): boolean {
		return (
			HashMap.has(this.dependencies, name) ||
			HashMap.has(this.devDependencies, name) ||
			HashMap.has(this.peerDependencies, name) ||
			HashMap.has(this.optionalDependencies, name)
		);
	}

	getDependencies(): HashMap.HashMap<string, Dependency> {
		return HashMap.map(this.dependencies, (specifier, name) => new Dependency({ name, specifier }));
	}

	getDevDependencies(): HashMap.HashMap<string, DevDependency> {
		return HashMap.map(this.devDependencies, (specifier, name) => new DevDependency({ name, specifier }));
	}

	getPeerDependencies(): HashMap.HashMap<string, PeerDependency> {
		const meta = Option.getOrElse(this.peerDependenciesMeta, () => ({}) as Record<string, { optional?: boolean }>);
		return HashMap.map(
			this.peerDependencies,
			(specifier, name) => new PeerDependency({ name, specifier, isOptional: meta[name]?.optional ?? false }),
		);
	}

	getOptionalDependencies(): HashMap.HashMap<string, OptionalDependency> {
		return HashMap.map(this.optionalDependencies, (specifier, name) => new OptionalDependency({ name, specifier }));
	}

	/** Return a new Package with the given fields replaced. */
	copyWith(
		patch: Partial<{
			name: string;
			version: SemVer;
			license: Option.Option<string>;
			dependencies: HashMap.HashMap<string, string>;
			devDependencies: HashMap.HashMap<string, string>;
			peerDependencies: HashMap.HashMap<string, string>;
			optionalDependencies: HashMap.HashMap<string, string>;
			scripts: HashMap.HashMap<string, string>;
		}>,
	): Package {
		return new Package({ ...this, ...patch }, { disableValidation: true });
	}

	/** Construct a Package from an already-decoded data record. */
	static fromData(data: ConstructorParameters<typeof Package>[0]): Package {
		return new Package(data, { disableValidation: true });
	}

	static setVersion: {
		(version: string): (pkg: Package) => Effect.Effect<Package, InvalidVersionError>;
		(pkg: Package, version: string): Effect.Effect<Package, InvalidVersionError>;
	} = dual(2, (pkg: Package, version: string) =>
		parseValidSemVer(version).pipe(Effect.map((semver) => pkg.copyWith({ version: semver }))),
	);

	static setName: {
		(name: string): (pkg: Package) => Effect.Effect<Package, InvalidPackageNameError>;
		(pkg: Package, name: string): Effect.Effect<Package, InvalidPackageNameError>;
	} = dual(2, (pkg: Package, name: string) =>
		isValidPackageName(name)
			? Effect.succeed(pkg.copyWith({ name }))
			: Effect.fail(new InvalidPackageNameError({ input: name, reason: "Does not satisfy npm naming rules" })),
	);

	static addDependency: {
		(name: string, specifier: string): (pkg: Package) => Package;
		(pkg: Package, name: string, specifier: string): Package;
	} = dual(3, (pkg: Package, name: string, specifier: string) =>
		pkg.copyWith({ dependencies: HashMap.set(pkg.dependencies, name, specifier) }),
	);

	static removeDependency: {
		(name: string): (pkg: Package) => Package;
		(pkg: Package, name: string): Package;
	} = dual(2, (pkg: Package, name: string) => pkg.copyWith({ dependencies: HashMap.remove(pkg.dependencies, name) }));

	static addDevDependency: {
		(name: string, specifier: string): (pkg: Package) => Package;
		(pkg: Package, name: string, specifier: string): Package;
	} = dual(3, (pkg: Package, name: string, specifier: string) =>
		pkg.copyWith({ devDependencies: HashMap.set(pkg.devDependencies, name, specifier) }),
	);

	static removeDevDependency: {
		(name: string): (pkg: Package) => Package;
		(pkg: Package, name: string): Package;
	} = dual(2, (pkg: Package, name: string) =>
		pkg.copyWith({ devDependencies: HashMap.remove(pkg.devDependencies, name) }),
	);

	static addPeerDependency: {
		(name: string, specifier: string): (pkg: Package) => Package;
		(pkg: Package, name: string, specifier: string): Package;
	} = dual(3, (pkg: Package, name: string, specifier: string) =>
		pkg.copyWith({ peerDependencies: HashMap.set(pkg.peerDependencies, name, specifier) }),
	);

	static removePeerDependency: {
		(name: string): (pkg: Package) => Package;
		(pkg: Package, name: string): Package;
	} = dual(2, (pkg: Package, name: string) =>
		pkg.copyWith({ peerDependencies: HashMap.remove(pkg.peerDependencies, name) }),
	);

	static addOptionalDependency: {
		(name: string, specifier: string): (pkg: Package) => Package;
		(pkg: Package, name: string, specifier: string): Package;
	} = dual(3, (pkg: Package, name: string, specifier: string) =>
		pkg.copyWith({ optionalDependencies: HashMap.set(pkg.optionalDependencies, name, specifier) }),
	);

	static removeOptionalDependency: {
		(name: string): (pkg: Package) => Package;
		(pkg: Package, name: string): Package;
	} = dual(2, (pkg: Package, name: string) =>
		pkg.copyWith({ optionalDependencies: HashMap.remove(pkg.optionalDependencies, name) }),
	);

	static setScript: {
		(name: string, command: string): (pkg: Package) => Package;
		(pkg: Package, name: string, command: string): Package;
	} = dual(3, (pkg: Package, name: string, command: string) =>
		pkg.copyWith({ scripts: HashMap.set(pkg.scripts, name, command) }),
	);

	static removeScript: {
		(name: string): (pkg: Package) => Package;
		(pkg: Package, name: string): Package;
	} = dual(2, (pkg: Package, name: string) => pkg.copyWith({ scripts: HashMap.remove(pkg.scripts, name) }));

	static setLicense: {
		(license: string): (pkg: Package) => Effect.Effect<Package, InvalidSpdxLicenseError>;
		(pkg: Package, license: string): Effect.Effect<Package, InvalidSpdxLicenseError>;
	} = dual(2, (pkg: Package, license: string) =>
		Schema.decodeUnknown(SpdxLicenseSchema)(license).pipe(
			Effect.mapError(
				() => new InvalidSpdxLicenseError({ input: license, reason: "Not a recognized SPDX identifier or expression" }),
			),
			Effect.map(() => pkg.copyWith({ license: Option.some(license) })),
		),
	);

	/**
	 * Resolve catalog: and workspace: specifiers across all four dependency maps
	 * using the CatalogResolver and WorkspaceResolver from context. Returns a new
	 * Package. Specifiers the resolvers return None for are left unchanged.
	 */
	static resolve(pkg: Package): Effect.Effect<Package, DependencyResolutionError, WorkspaceResolver | CatalogResolver> {
		return Effect.gen(function* () {
			const ws = yield* WorkspaceResolver;
			const cat = yield* CatalogResolver;

			const resolveMap = (map: HashMap.HashMap<string, string>) =>
				Effect.gen(function* () {
					let next = map;
					for (const [name, specifier] of HashMap.entries(map)) {
						if (specifier.startsWith("workspace:")) {
							const version = yield* ws.versionOf(name);
							if (Option.isSome(version)) {
								next = HashMap.set(next, name, applyWorkspaceModifier(specifier, version.value));
							}
						} else if (specifier.startsWith("catalog:")) {
							const range = yield* cat.rangeOf(name, catalogName(specifier));
							if (Option.isSome(range)) {
								next = HashMap.set(next, name, range.value);
							}
						}
					}
					return next;
				});

			return pkg.copyWith({
				dependencies: yield* resolveMap(pkg.dependencies),
				devDependencies: yield* resolveMap(pkg.devDependencies),
				peerDependencies: yield* resolveMap(pkg.peerDependencies),
				optionalDependencies: yield* resolveMap(pkg.optionalDependencies),
			});
		});
	}
}
