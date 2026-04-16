import { Option, ParseResult, Schema } from "effect";

export class PackageManager extends Schema.Class<PackageManager>("PackageManager")({
	name: Schema.String,
	version: Schema.String,
	integrity: Schema.optionalWith(Schema.String, { as: "Option" }),
}) {
	get hasIntegrity(): boolean {
		return Option.isSome(this.integrity);
	}
}

const PACKAGE_MANAGER_REGEX = /^([a-z]+)@(\d+\.\d+\.\d+(?:-[a-zA-Z0-9._-]+)?)(?:\+(.+))?$/;

/**
 * Parses a packageManager string (e.g. "pnpm\@10.33.0+sha512.abc")
 * into a PackageManager class instance with name, version, and
 * optional integrity fields.
 */
export const PackageManagerSchema: Schema.Schema<PackageManager, string> = Schema.transformOrFail(
	Schema.String,
	Schema.typeSchema(PackageManager),
	{
		strict: true,
		decode: (s, _options, ast) => {
			const match = s.match(PACKAGE_MANAGER_REGEX);
			if (!match) {
				return ParseResult.fail(new ParseResult.Type(ast, s, `Invalid packageManager format: "${s}"`));
			}
			return ParseResult.succeed(
				new PackageManager(
					{
						name: match[1],
						version: match[2],
						integrity: match[3] ? Option.some(match[3]) : Option.none(),
					},
					true,
				),
			);
		},
		encode: (pm) => {
			let result = `${pm.name}@${pm.version}`;
			if (Option.isSome(pm.integrity)) {
				result += `+${pm.integrity.value}`;
			}
			return ParseResult.succeed(result);
		},
	},
);
