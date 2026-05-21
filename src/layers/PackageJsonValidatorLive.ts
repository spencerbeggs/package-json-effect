import { Effect, HashMap, Layer, Option } from "effect";
import type { Package } from "../domain/Package.js";
import type { ValidationRuleFailure } from "../errors/PackageJsonValidationError.js";
import { PackageJsonValidationError } from "../errors/PackageJsonValidationError.js";
import type { ValidationRule } from "../services/PackageJsonValidator.js";
import { PackageJsonValidator } from "../services/PackageJsonValidator.js";

const hasLicense: ValidationRule = {
	name: "has-license",
	validate: (pkg) =>
		Option.isSome(pkg.license)
			? Effect.void
			: Effect.fail({ message: "Missing license field", path: Option.some("license") }),
};

const hasDescription: ValidationRule = {
	name: "has-description",
	validate: (pkg) =>
		Option.isSome(pkg.description)
			? Effect.void
			: Effect.fail({ message: "Missing description field", path: Option.some("description") }),
};

const hasRepository: ValidationRule = {
	name: "has-repository",
	validate: (pkg) =>
		Object.hasOwn(pkg.rest, "repository")
			? Effect.void
			: Effect.fail({ message: "Missing repository field", path: Option.some("repository") }),
};

const notPrivate: ValidationRule = {
	name: "not-private",
	validate: (pkg) =>
		pkg.isPrivate ? Effect.fail({ message: "Package is private", path: Option.some("private") }) : Effect.void,
};

const anyDepMatches = (pkg: Package, pred: (specifier: string) => boolean): boolean => {
	const maps = [pkg.dependencies, pkg.devDependencies, pkg.peerDependencies, pkg.optionalDependencies];
	return maps.some((m) => Array.from(HashMap.values(m)).some(pred));
};

export const noUnresolvedDepsRule: ValidationRule = {
	name: "no-unresolved-deps",
	validate: (pkg) =>
		anyDepMatches(pkg, (s) => s.startsWith("workspace:") || s.startsWith("catalog:"))
			? Effect.fail({ message: "Unresolved workspace:/catalog: dependency", path: Option.none() })
			: Effect.void,
};

export const noLocalDepsRule: ValidationRule = {
	name: "no-local-deps",
	validate: (pkg) =>
		anyDepMatches(pkg, (s) => s.startsWith("file:") || s.startsWith("link:") || s.startsWith("portal:"))
			? Effect.fail({ message: "Local file:/link:/portal: dependency", path: Option.none() })
			: Effect.void,
};

export const defaultRules: ReadonlyArray<ValidationRule> = [hasLicense, hasDescription, hasRepository, notPrivate];

const runRules = (pkg: Package, rules: ReadonlyArray<ValidationRule>) =>
	Effect.gen(function* () {
		const failures: Array<ValidationRuleFailure> = [];

		for (const rule of rules) {
			yield* rule.validate(pkg).pipe(
				Effect.matchEffect({
					onSuccess: () => Effect.void,
					onFailure: (err) => {
						failures.push({ rule: rule.name, message: err.message, path: err.path ?? Option.none() });
						return Effect.void;
					},
				}),
			);
		}

		if (failures.length > 0) return yield* new PackageJsonValidationError({ failures });
		return pkg;
	});

export const PackageJsonValidatorLive: Layer.Layer<PackageJsonValidator> = Layer.succeed(
	PackageJsonValidator,
	PackageJsonValidator.of({ validate: (pkg) => runRules(pkg, defaultRules) }),
);

export const makePackageJsonValidatorLive = (config: {
	rules: ReadonlyArray<ValidationRule>;
}): Layer.Layer<PackageJsonValidator> =>
	Layer.succeed(PackageJsonValidator, PackageJsonValidator.of({ validate: (pkg) => runRules(pkg, config.rules) }));
