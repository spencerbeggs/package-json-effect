import { Data, Option } from "effect";

/**
 * Tagged error base for {@link PackageJsonParseError}.
 *
 * @privateRemarks
 * Exported because TypeScript declaration bundling requires the base class to be
 * accessible when {@link PackageJsonParseError} appears in public type signatures.
 * Consumers should use {@link PackageJsonParseError} directly.
 *
 * @internal
 */
export const PackageJsonParseErrorBase = Data.TaggedError("PackageJsonParseError");

/**
 * Indicates that a string could not be parsed as valid JSON for a package.json file.
 */
export class PackageJsonParseError extends PackageJsonParseErrorBase<{
	/** The raw input string that failed to parse. */
	readonly input: string;
	/** The character position where parsing failed, if available. */
	readonly position: Option.Option<number>;
}> {
	get message(): string {
		const base = "Failed to parse package.json";
		return Option.match(this.position, {
			onNone: () => base,
			onSome: (pos) => `${base} at position ${pos}`,
		});
	}
}
