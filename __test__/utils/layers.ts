import { NodeFileSystem } from "@effect/platform-node";
import { Layer } from "effect";
import { CatalogResolverLive } from "../../src/layers/CatalogResolverLive.js";
import { PackageJsonFormatterLive } from "../../src/layers/PackageJsonFormatterLive.js";
import { PackageJsonReaderLive } from "../../src/layers/PackageJsonReaderLive.js";
import { PackageJsonTransformerLive } from "../../src/layers/PackageJsonTransformerLive.js";
import { PackageJsonValidatorLive } from "../../src/layers/PackageJsonValidatorLive.js";
import { PackageJsonWriterLive } from "../../src/layers/PackageJsonWriterLive.js";
import { WorkspaceResolverLive } from "../../src/layers/WorkspaceResolverLive.js";

export const TestLayer = Layer.mergeAll(
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
	NodeFileSystem.layer,
).pipe(Layer.provide(NodeFileSystem.layer));
