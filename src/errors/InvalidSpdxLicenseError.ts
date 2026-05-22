import { Data } from "effect";

/**
 * Tagged error base for {@link InvalidSpdxLicenseError}.
 *
 * @privateRemarks
 * Exported because TypeScript declaration bundling requires the base class to be
 * accessible when {@link InvalidSpdxLicenseError} appears in public type signatures.
 * Consumers should use {@link InvalidSpdxLicenseError} directly.
 *
 * @internal
 */
export const InvalidSpdxLicenseErrorBase = Data.TaggedError("InvalidSpdxLicenseError");

/** Indicates that a string is not a valid SPDX license identifier or expression. */
export class InvalidSpdxLicenseError extends InvalidSpdxLicenseErrorBase<{
	/** The raw input string that failed validation. */
	readonly input: string;
	/** A human-readable description of why the license identifier is invalid. */
	readonly reason: string;
}> {
	get message(): string {
		return `Invalid SPDX license "${this.input}": ${this.reason}`;
	}
}
