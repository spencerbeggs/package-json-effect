import { ParseResult, Schema } from "effect";
import { Package } from "../domain/Package.js";

const RawJson = Schema.Record({ key: Schema.String, value: Schema.Unknown });

/**
 * Build the wire schema (open JSON object ↔ Package class) for the given
 * Package class or any `.extend()`ed subclass. Reads `Class.fields` so extended
 * fields are decoded as typed members and excluded from `rest`.
 *
 * The transform sits between an open JSON record (`RawJson`) and the class. On
 * decode it partitions raw keys into known fields and a `rest` record, handing
 * Effect the class's encoded shape so the class decodes itself. On encode it
 * receives the class's encoded shape and flattens the literal `rest` key back
 * into top-level fields, so the on-disk shape never contains a `rest` key.
 *
 * @public
 */
export const makePackageJsonSchema = <Self extends Package>(
	// biome-ignore lint/suspicious/noExplicitAny: invariant Schema Encoded slot — a generic I infers to unknown and is rejected by tsc
	Class: Schema.Schema<Self, any, never> & { readonly fields: Schema.Struct.Fields },
): Schema.Schema<Self, { readonly [k: string]: unknown }, never> => {
	const knownKeys = new Set(Object.keys(Class.fields).filter((k) => k !== "rest"));
	const wire = Schema.transformOrFail(RawJson, Class as Schema.Schema.AnyNoContext, {
		strict: false,
		decode: (raw) => {
			const known: Record<string, unknown> = {};
			const rest: Record<string, unknown> = {};
			for (const [k, v] of Object.entries(raw)) {
				if (knownKeys.has(k)) known[k] = v;
				else rest[k] = v;
			}
			return ParseResult.succeed({ ...known, rest });
		},
		encode: (encoded) => {
			const record = encoded as Record<string, unknown> & { rest?: Record<string, unknown> };
			const { rest, ...known } = record;
			return ParseResult.succeed({ ...known, ...(rest ?? {}) });
		},
	});
	return wire as unknown as Schema.Schema<Self, { readonly [k: string]: unknown }, never>;
};

/**
 * The default wire schema: decodes JSON to a Package instance and back.
 *
 * @public
 */
export const PackageJsonSchema = makePackageJsonSchema(Package);

/**
 * Decoded type for PackageJsonSchema.
 *
 * @public
 */
export type PackageJsonSchemaType = Package;

/**
 * Encoded (plain JSON) type for PackageJsonSchema.
 *
 * @public
 */
export interface PackageJsonSchemaEncoded {
	readonly [k: string]: unknown;
}
