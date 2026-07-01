import { Effect, Layer, Option } from "effect";
import { CatalogResolver } from "../services/CatalogResolver.js";

/**
 * Default CatalogResolver: resolves nothing. Provide a real implementation
 * (e.g. backed by workspaces-effect) to resolve catalog: specifiers.
 *
 * @public
 */
export const CatalogResolverLive: Layer.Layer<CatalogResolver> = Layer.succeed(
	CatalogResolver,
	CatalogResolver.of({ rangeOf: () => Effect.succeed(Option.none()) }),
);
