import { Data } from "effect";

/**
 * Tagged error base for {@link PackageJsonNotFoundError}.
 *
 * @privateRemarks
 * Exported because TypeScript declaration bundling requires the base class to be
 * accessible when {@link PackageJsonNotFoundError} appears in public type signatures.
 * Consumers should use {@link PackageJsonNotFoundError} directly.
 *
 * @internal
 */
export const PackageJsonNotFoundErrorBase = Data.TaggedError("PackageJsonNotFoundError");

/**
 * Indicates that a package.json file was not found at the expected location.
 */
export class PackageJsonNotFoundError extends PackageJsonNotFoundErrorBase<{
	/** The file path or location where package.json was expected but not found. */
	readonly source: string;
}> {
	get message(): string {
		return `package.json not found at "${this.source}"`;
	}
}
