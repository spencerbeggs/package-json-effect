import { Data } from "effect";

/**
 * Tagged error base for {@link PackageJsonWriteError}.
 *
 * @privateRemarks
 * Exported because TypeScript declaration bundling requires the base class to be
 * accessible when {@link PackageJsonWriteError} appears in public type signatures.
 * Consumers should use {@link PackageJsonWriteError} directly.
 *
 * @internal
 */
export const PackageJsonWriteErrorBase = Data.TaggedError("PackageJsonWriteError");

/**
 * Indicates that a package.json file could not be written to the filesystem.
 */
export class PackageJsonWriteError extends PackageJsonWriteErrorBase<{
	/** The file path or target location that could not be written. */
	readonly target: string;
	/** The underlying error or reason for the failure. */
	readonly cause: unknown;
}> {
	get message(): string {
		return `Failed to write package.json to "${this.target}"`;
	}
}
