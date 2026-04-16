import { Data } from "effect";

/**
 * Tagged error base for {@link InvalidPackageNameError}.
 *
 * @privateRemarks
 * Exported because TypeScript declaration bundling requires the base class to be
 * accessible when {@link InvalidPackageNameError} appears in public type signatures.
 * Consumers should use {@link InvalidPackageNameError} directly.
 *
 * @internal
 */
export const InvalidPackageNameErrorBase = Data.TaggedError("InvalidPackageNameError");

/**
 * Indicates that a string could not be used as a valid npm package name.
 */
export class InvalidPackageNameError extends InvalidPackageNameErrorBase<{
	/** The raw input string that failed validation. */
	readonly input: string;
	/** A human-readable description of why the name is invalid. */
	readonly reason: string;
}> {
	get message(): string {
		return `Invalid package name "${this.input}": ${this.reason}`;
	}
}
