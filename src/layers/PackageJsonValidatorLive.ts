import { Effect, Layer, Option } from "effect";
import type { Package } from "../domain/Package.js";
import type { ValidationRuleFailure } from "../errors/PackageJsonValidationError.js";
import { PackageJsonValidationError } from "../errors/PackageJsonValidationError.js";
import type { ValidationRule } from "../services/PackageJsonValidator.js";
import { PackageJsonValidator } from "../services/PackageJsonValidator.js";

const hasLicense: ValidationRule = {
	name: "has-license",
	validate: (pkg) => (Option.isSome(pkg.license) ? Effect.void : Effect.fail({ message: "Missing license field" })),
};

const hasDescription: ValidationRule = {
	name: "has-description",
	validate: (pkg) =>
		Option.isSome(pkg.description) ? Effect.void : Effect.fail({ message: "Missing description field" }),
};

export const defaultRules: ReadonlyArray<ValidationRule> = [hasLicense, hasDescription];

const runRules = (pkg: Package, rules: ReadonlyArray<ValidationRule>) =>
	Effect.gen(function* () {
		const failures: Array<ValidationRuleFailure> = [];

		for (const rule of rules) {
			yield* rule.validate(pkg).pipe(
				Effect.matchEffect({
					onSuccess: () => Effect.void,
					onFailure: (err) => {
						failures.push({
							rule: rule.name,
							message: err.message,
							path: Option.none(),
						});
						return Effect.void;
					},
				}),
			);
		}

		if (failures.length > 0) {
			return yield* Effect.fail(new PackageJsonValidationError({ failures }));
		}

		return pkg;
	});

export const PackageJsonValidatorLive: Layer.Layer<PackageJsonValidator> = Layer.succeed(
	PackageJsonValidator,
	PackageJsonValidator.of({
		validate: (pkg) => runRules(pkg, defaultRules),
	}),
);

export const makePackageJsonValidatorLive = (config: {
	rules: ReadonlyArray<ValidationRule>;
}): Layer.Layer<PackageJsonValidator> =>
	Layer.succeed(
		PackageJsonValidator,
		PackageJsonValidator.of({
			validate: (pkg) => runRules(pkg, config.rules),
		}),
	);
