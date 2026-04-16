import { Effect, Layer } from "effect";
import { CatalogResolver } from "../services/CatalogResolver.js";

/**
 * Default CatalogResolver: no-op passthrough.
 * Replace with a real implementation to resolve catalog: protocol specifiers.
 */
export const CatalogResolverLive: Layer.Layer<CatalogResolver> = Layer.succeed(
	CatalogResolver,
	CatalogResolver.of({
		resolve: (raw) => Effect.succeed(raw),
	}),
);
