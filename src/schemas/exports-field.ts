import { Schema } from "effect";

const ExportsObject = Schema.Record({
	key: Schema.String,
	value: Schema.Unknown,
});

/**
 * Exports field: either a single string entry point or an object
 * mapping subpaths to file paths (or null to block).
 *
 * The object form accepts any value shape to support conditional
 * exports with nested objects (e.g. `{ "import": "./esm.js", "require": "./cjs.js" }`).
 */
export const ExportsFieldSchema = Schema.Union(Schema.String, ExportsObject);

export type ExportsField = Schema.Schema.Type<typeof ExportsFieldSchema>;
