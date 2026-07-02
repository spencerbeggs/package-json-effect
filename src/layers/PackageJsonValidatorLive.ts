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
	// `repository` is currently unmodeled and lives in `rest`; check both the typed
	// fields and `rest` so the rule still works if it later becomes a modeled field.
	validate: (pkg) =>
		Object.hasOwn(pkg, "repository") || Object.hasOwn(pkg.rest, "repository")
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

/**
 * Validation rule that fails when any dependency uses an unresolved
 * workspace: or catalog: specifier.
 *
 * @public
 */
export const noUnresolvedDepsRule: ValidationRule = {
	name: "no-unresolved-deps",
	validate: (pkg) =>
		anyDepMatches(pkg, (s) => s.startsWith("workspace:") || s.startsWith("catalog:"))
			? Effect.fail({ message: "Unresolved workspace:/catalog: dependency", path: Option.none() })
			: Effect.void,
};

/**
 * Validation rule that fails when any dependency uses a local
 * file:, link:, or portal: specifier.
 *
 * @public
 */
export const noLocalDepsRule: ValidationRule = {
	name: "no-local-deps",
	validate: (pkg) =>
		anyDepMatches(pkg, (s) => s.startsWith("file:") || s.startsWith("link:") || s.startsWith("portal:"))
			? Effect.fail({ message: "Local file:/link:/portal: dependency", path: Option.none() })
			: Effect.void,
};

/**
 * Default set of validation rules: license, description, repository, and
 * not-private checks.
 *
 * @public
 */
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

/**
 * Live Layer providing the PackageJsonValidator service backed by the
 * default rule set.
 *
 * @public
 */
export const PackageJsonValidatorLive: Layer.Layer<PackageJsonValidator> = Layer.succeed(
	PackageJsonValidator,
	PackageJsonValidator.of({ validate: (pkg) => runRules(pkg, defaultRules) }),
);

/**
 * Builds a PackageJsonValidator Layer from a custom set of validation rules.
 *
 * @public
 */
export const makePackageJsonValidatorLive = (config: {
	rules: ReadonlyArray<ValidationRule>;
}): Layer.Layer<PackageJsonValidator> =>
	Layer.succeed(PackageJsonValidator, PackageJsonValidator.of({ validate: (pkg) => runRules(pkg, config.rules) }));
