import { Data } from "effect";

/**
 * Tagged error base for {@link PackageJsonDecodeError}.
 *
 * @privateRemarks
 * Exported because TypeScript declaration bundling requires the base class to be
 * accessible when {@link PackageJsonDecodeError} appears in public type signatures.
 * Consumers should use {@link PackageJsonDecodeError} directly.
 *
 * @internal
 */
export const PackageJsonDecodeErrorBase = Data.TaggedError("PackageJsonDecodeError");

/**
 * Indicates that a parsed JSON value could not be decoded into a valid PackageJson structure.
 */
export class PackageJsonDecodeError extends PackageJsonDecodeErrorBase<{
	/** The raw value that failed to decode. */
	readonly input: unknown;
	/** A human-readable description of the decode failure. */
	readonly message: string;
}> {}
