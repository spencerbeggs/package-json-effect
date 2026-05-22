import { Data } from "effect";

/**
 * Tagged error base for {@link DependencyResolutionError}.
 *
 * @privateRemarks
 * Exported because TypeScript declaration bundling requires the base class to be
 * accessible when {@link DependencyResolutionError} appears in public type signatures.
 * Consumers should use {@link DependencyResolutionError} directly.
 *
 * @internal
 */
export const DependencyResolutionErrorBase = Data.TaggedError("DependencyResolutionError");

/** Indicates that a catalog: or workspace: specifier could not be resolved. */
export class DependencyResolutionError extends DependencyResolutionErrorBase<{
	/** The name of the package whose specifier could not be resolved. */
	readonly packageName: string;
	/** The specifier string (e.g. `catalog:` or `workspace:*`) that failed resolution. */
	readonly specifier: string;
	/** A human-readable description of why resolution failed. */
	readonly reason: string;
}> {
	get message(): string {
		return `Failed to resolve "${this.specifier}" for "${this.packageName}": ${this.reason}`;
	}
}
