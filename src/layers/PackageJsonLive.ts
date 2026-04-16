import { Layer } from "effect";
import { CatalogResolverLive } from "./CatalogResolverLive.js";
import { PackageJsonFormatterLive } from "./PackageJsonFormatterLive.js";
import { PackageJsonReaderLive } from "./PackageJsonReaderLive.js";
import { PackageJsonTransformerLive } from "./PackageJsonTransformerLive.js";
import { PackageJsonValidatorLive } from "./PackageJsonValidatorLive.js";
import { PackageJsonWriterLive } from "./PackageJsonWriterLive.js";
import { WorkspaceResolverLive } from "./WorkspaceResolverLive.js";

/**
 * Composite layer providing all package-json-effect services.
 * Requires \@effect/platform FileSystem to be provided by the consumer.
 */
export const PackageJsonLive = Layer.mergeAll(
	PackageJsonReaderLive,
	PackageJsonWriterLive.pipe(
		Layer.provide(PackageJsonFormatterLive),
		Layer.provide(CatalogResolverLive),
		Layer.provide(WorkspaceResolverLive),
		Layer.provide(PackageJsonTransformerLive),
	),
	PackageJsonFormatterLive,
	CatalogResolverLive,
	WorkspaceResolverLive,
	PackageJsonTransformerLive,
	PackageJsonValidatorLive,
);
