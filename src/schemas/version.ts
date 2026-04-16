import { Effect, ParseResult, Schema } from "effect";
import { SemVer, parseValidSemVer } from "semver-effect";

/**
 * Schema that decodes a version string into a SemVer instance
 * and encodes it back to a string. Uses semver-effect for parsing.
 */
export const VersionSchema: Schema.Schema<SemVer, string> = Schema.transformOrFail(
	Schema.String,
	Schema.typeSchema(SemVer),
	{
		strict: true,
		decode: (input, _options, ast) =>
			parseValidSemVer(input).pipe(
				Effect.mapError(() => new ParseResult.Type(ast, input, `Invalid semver version: "${input}"`)),
			),
		encode: (semver) => ParseResult.succeed(semver.toString()),
	},
);
