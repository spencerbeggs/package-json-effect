import { Data, Option } from "effect";

/**
 * Describes a single rule failure during package.json validation.
 */
export interface ValidationRuleFailure {
	/** The identifier of the validation rule that failed. */
	readonly rule: string;
	/** A human-readable description of the failure. */
	readonly message: string;
	/** The JSON path within the package.json where the failure occurred, if applicable. */
	readonly path: Option.Option<string>;
}

/**
 * Tagged error base for {@link PackageJsonValidationError}.
 *
 * @privateRemarks
 * Exported because TypeScript declaration bundling requires the base class to be
 * accessible when {@link PackageJsonValidationError} appears in public type signatures.
 * Consumers should use {@link PackageJsonValidationError} directly.
 *
 * @internal
 */
export const PackageJsonValidationErrorBase = Data.TaggedError("PackageJsonValidationError");

/**
 * Indicates that a package.json file failed one or more validation rules.
 */
export class PackageJsonValidationError extends PackageJsonValidationErrorBase<{
	/** The list of rule failures encountered during validation. */
	readonly failures: ReadonlyArray<ValidationRuleFailure>;
}> {
	get message(): string {
		const lines = this.failures.map((f) => {
			const pathPart = Option.match(f.path, {
				onNone: () => "",
				onSome: (p) => ` (at ${p})`,
			});
			return `  - [${f.rule}]${pathPart}: ${f.message}`;
		});
		return `package.json validation failed:\n${lines.join("\n")}`;
	}
}
