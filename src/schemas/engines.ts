import { HashMap, Schema } from "effect";

/**
 * Engines field: map of engine names to semver ranges.
 */
export const EnginesSchema: Schema.Schema<
	HashMap.HashMap<string, string>,
	{ readonly [x: string]: string }
> = Schema.transform(
	Schema.Record({ key: Schema.String, value: Schema.String }),
	Schema.typeSchema(Schema.HashMap({ key: Schema.String, value: Schema.String })),
	{
		strict: true,
		decode: (record) => HashMap.fromIterable(Object.entries(record)),
		encode: (map) => Object.fromEntries(HashMap.toEntries(map)),
	},
);
