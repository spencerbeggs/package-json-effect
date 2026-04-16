import type { Effect } from "effect";
import { Context } from "effect";
import type { Package } from "../domain/Package.js";
import type { PackageJsonValidationError } from "../errors/PackageJsonValidationError.js";

/**
 * A single validation rule.
 */
export interface ValidationRule {
	readonly name: string;
	readonly validate: (pkg: Package) => Effect.Effect<void, { readonly message: string }>;
}

/**
 * Service for validating a Package against a set of rules.
 */
export class PackageJsonValidator extends Context.Tag("package-json-effect/PackageJsonValidator")<
	PackageJsonValidator,
	{
		readonly validate: (pkg: Package) => Effect.Effect<Package, PackageJsonValidationError>;
	}
>() {}
