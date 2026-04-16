import { Data } from "effect";

/**
 * Tagged error base for {@link InvalidDependencySpecifierError}.
 *
 * @privateRemarks
 * Exported because TypeScript declaration bundling requires the base class to be
 * accessible when {@link InvalidDependencySpecifierError} appears in public type signatures.
 * Consumers should use {@link InvalidDependencySpecifierError} directly.
 *
 * @internal
 */
export const InvalidDependencySpecifierErrorBase = Data.TaggedError("InvalidDependencySpecifierError");

/**
 * Indicates that a string could not be parsed as a valid dependency specifier.
 */
export class InvalidDependencySpecifierError extends InvalidDependencySpecifierErrorBase<{
	/** The raw input string that failed validation. */
	readonly input: string;
	/** A human-readable description of why the specifier is invalid. */
	readonly reason: string;
}> {
	get message(): string {
		return `Invalid dependency specifier "${this.input}": ${this.reason}`;
	}
}
