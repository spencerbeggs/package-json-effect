import { Data } from "effect";

/**
 * Tagged error base for {@link PackageJsonReadError}.
 *
 * @privateRemarks
 * Exported because TypeScript declaration bundling requires the base class to be
 * accessible when {@link PackageJsonReadError} appears in public type signatures.
 * Consumers should use {@link PackageJsonReadError} directly.
 *
 * @internal
 */
export const PackageJsonReadErrorBase = Data.TaggedError("PackageJsonReadError");

/**
 * Indicates that a package.json file could not be read from the filesystem.
 */
export class PackageJsonReadError extends PackageJsonReadErrorBase<{
	/** The file path or source location that could not be read. */
	readonly source: string;
	/** The underlying error or reason for the failure. */
	readonly cause: unknown;
}> {
	get message(): string {
		return `Failed to read package.json from "${this.source}"`;
	}
}
