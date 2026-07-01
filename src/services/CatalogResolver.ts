import type { Effect, Option } from "effect";
import { Context } from "effect";
import type { DependencyResolutionError } from "../errors/DependencyResolutionError.js";

/**
 * Resolves catalog: protocol specifiers. Given a package name and an optional
 * catalog name (None = default catalog), returns the configured range, or None
 * if it cannot be resolved (default no-op behavior).
 *
 * @public
 */
export class CatalogResolver extends Context.Tag("package-json-effect/CatalogResolver")<
	CatalogResolver,
	{
		readonly rangeOf: (
			packageName: string,
			catalog: Option.Option<string>,
		) => Effect.Effect<Option.Option<string>, DependencyResolutionError>;
	}
>() {}
