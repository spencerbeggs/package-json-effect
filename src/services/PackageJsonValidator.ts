import type { Effect, Option } from "effect";
import { Context } from "effect";
import type { Package } from "../domain/Package.js";
import type { PackageJsonValidationError } from "../errors/PackageJsonValidationError.js";

/**
 * A single validation rule failure.
 *
 * @public
 */
export interface RuleFailure {
	readonly message: string;
	readonly path?: Option.Option<string>;
}

/**
 * A single validation rule.
 *
 * @public
 */
export interface ValidationRule {
	readonly name: string;
	readonly validate: (pkg: Package) => Effect.Effect<void, RuleFailure>;
}

/**
 * Service for validating a Package against a set of rules.
 *
 * @public
 */
export class PackageJsonValidator extends Context.Tag("package-json-effect/PackageJsonValidator")<
	PackageJsonValidator,
	{
		readonly validate: (pkg: Package) => Effect.Effect<Package, PackageJsonValidationError>;
	}
>() {}
