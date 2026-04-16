import { Effect, HashMap, Option, Schema } from "effect";
import { dual } from "effect/Function";
import type { InvalidVersionError, SemVer } from "semver-effect";
import { parseValidSemVer } from "semver-effect";
import { InvalidPackageNameError } from "../errors/InvalidPackageNameError.js";
import { SpdxLicense as SpdxLicenseSchema } from "../schemas/license.js";
import { isValidPackageName } from "../schemas/name.js";
import type { PackageJsonSchemaType } from "../schemas/package-json.js";
import { PackageNameUtil } from "./PackageName.js";

/**
 * Domain model wrapping decoded PackageJson data. Provides getters
 * for property access and helper methods for querying the package.
 */
export class Package {
	readonly _data: PackageJsonSchemaType;

	constructor(data: PackageJsonSchemaType) {
		this._data = data;
	}

	get name(): string {
		return this._data.name;
	}

	get version(): SemVer {
		return this._data.version;
	}

	get description(): Option.Option<string> {
		return this._data.description;
	}

	get isPrivate(): boolean {
		return Option.getOrElse(this._data.private, () => false);
	}

	get isScoped(): boolean {
		return PackageNameUtil.isScoped(this._data.name);
	}

	get isESM(): boolean {
		return Option.match(this._data.type, {
			onNone: () => false,
			onSome: (t) => t === "module",
		});
	}

	get license(): Option.Option<string> {
		return this._data.license;
	}

	get scripts(): HashMap.HashMap<string, string> {
		return this._data.scripts;
	}

	get dependencies(): HashMap.HashMap<string, string> {
		return this._data.dependencies;
	}

	get devDependencies(): HashMap.HashMap<string, string> {
		return this._data.devDependencies;
	}

	get peerDependencies(): HashMap.HashMap<string, string> {
		return this._data.peerDependencies;
	}

	get optionalDependencies(): HashMap.HashMap<string, string> {
		return this._data.optionalDependencies;
	}

	hasDependency(name: string): boolean {
		return (
			HashMap.has(this._data.dependencies, name) ||
			HashMap.has(this._data.devDependencies, name) ||
			HashMap.has(this._data.peerDependencies, name) ||
			HashMap.has(this._data.optionalDependencies, name)
		);
	}

	// ── Static Mutation Methods (Dual API) ────────────────────────

	static setVersion: {
		(version: string): (pkg: Package) => Effect.Effect<Package, InvalidVersionError>;
		(pkg: Package, version: string): Effect.Effect<Package, InvalidVersionError>;
	} = dual(2, (pkg: Package, version: string) =>
		parseValidSemVer(version).pipe(
			Effect.map((semver) => new Package({ ...pkg._data, version: semver } as PackageJsonSchemaType)),
		),
	);

	static setName: {
		(name: string): (pkg: Package) => Effect.Effect<Package, InvalidPackageNameError>;
		(pkg: Package, name: string): Effect.Effect<Package, InvalidPackageNameError>;
	} = dual(2, (pkg: Package, name: string) =>
		isValidPackageName(name)
			? Effect.succeed(new Package({ ...pkg._data, name } as PackageJsonSchemaType))
			: Effect.fail(new InvalidPackageNameError({ input: name, reason: "Does not satisfy npm naming rules" })),
	);

	static addDependency: {
		(name: string, specifier: string): (pkg: Package) => Package;
		(pkg: Package, name: string, specifier: string): Package;
	} = dual(
		3,
		(pkg: Package, name: string, specifier: string) =>
			new Package({
				...pkg._data,
				dependencies: HashMap.set(pkg._data.dependencies, name, specifier),
			} as PackageJsonSchemaType),
	);

	static removeDependency: {
		(name: string): (pkg: Package) => Package;
		(pkg: Package, name: string): Package;
	} = dual(
		2,
		(pkg: Package, name: string) =>
			new Package({
				...pkg._data,
				dependencies: HashMap.remove(pkg._data.dependencies, name),
			} as PackageJsonSchemaType),
	);

	static setScript: {
		(name: string, command: string): (pkg: Package) => Package;
		(pkg: Package, name: string, command: string): Package;
	} = dual(
		3,
		(pkg: Package, name: string, command: string) =>
			new Package({
				...pkg._data,
				scripts: HashMap.set(pkg._data.scripts, name, command),
			} as PackageJsonSchemaType),
	);

	static removeScript: {
		(name: string): (pkg: Package) => Package;
		(pkg: Package, name: string): Package;
	} = dual(
		2,
		(pkg: Package, name: string) =>
			new Package({
				...pkg._data,
				scripts: HashMap.remove(pkg._data.scripts, name),
			} as PackageJsonSchemaType),
	);

	static setLicense: {
		(license: string): (pkg: Package) => Effect.Effect<Package, Error>;
		(pkg: Package, license: string): Effect.Effect<Package, Error>;
	} = dual(2, (pkg: Package, license: string) =>
		Effect.try({
			try: () => {
				Schema.decodeUnknownSync(SpdxLicenseSchema)(license);
				return new Package({ ...pkg._data, license: Option.some(license) } as PackageJsonSchemaType);
			},
			catch: () => new Error(`Invalid SPDX license: "${license}"`),
		}),
	);

	/**
	 * Create a Package from any decoded PackageJson-shaped data.
	 * Use this when working with custom schemas from makePackageJsonSchema.
	 */
	static fromData(data: Record<string, unknown>): Package {
		return new Package(data as PackageJsonSchemaType);
	}
}
