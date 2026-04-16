import type { Effect } from "effect";
import { Context } from "effect";

/**
 * Service for resolving catalog: protocol references in dependency maps.
 * Operates on the encoded JSON object before formatting.
 * Default implementation is a no-op passthrough.
 */
export class CatalogResolver extends Context.Tag("package-json-effect/CatalogResolver")<
	CatalogResolver,
	{
		readonly resolve: (raw: Record<string, unknown>) => Effect.Effect<Record<string, unknown>>;
	}
>() {}
