import { HashMap, Schema } from "effect";

const BinMapSchema: Schema.Schema<HashMap.HashMap<string, string>, { readonly [x: string]: string }> = Schema.transform(
	Schema.Record({ key: Schema.String, value: Schema.String }),
	Schema.typeSchema(Schema.HashMap({ key: Schema.String, value: Schema.String })),
	{
		strict: true,
		decode: (record) => HashMap.fromIterable(Object.entries(record)),
		encode: (map) => Object.fromEntries(HashMap.toEntries(map)),
	},
);

/**
 * Bin field: either a single string path or a map of command names to paths.
 */
export const BinSchema: Schema.Schema<
	string | HashMap.HashMap<string, string>,
	string | { readonly [x: string]: string }
> = Schema.Union(Schema.String, BinMapSchema);
