import { HashMap, Schema } from "effect";

const StringRecord = Schema.Record({ key: Schema.String, value: Schema.String });

/**
 * A dependency map: plain JSON object decoded to/from HashMap.
 */
export const DependencyMapSchema: Schema.Schema<
	HashMap.HashMap<string, string>,
	{ readonly [x: string]: string }
> = Schema.transform(StringRecord, Schema.typeSchema(Schema.HashMap({ key: Schema.String, value: Schema.String })), {
	strict: true,
	decode: (record) => HashMap.fromIterable(Object.entries(record)),
	encode: (map) => Object.fromEntries(HashMap.toEntries(map)),
});
