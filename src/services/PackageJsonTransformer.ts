import type { Effect } from "effect";
import { Context } from "effect";

/**
 * Service for transforming the encoded package.json object before formatting.
 * Default implementation removes empty dependency map fields.
 */
export class PackageJsonTransformer extends Context.Tag("package-json-effect/PackageJsonTransformer")<
	PackageJsonTransformer,
	{
		readonly transform: (raw: Record<string, unknown>) => Effect.Effect<Record<string, unknown>>;
	}
>() {}
