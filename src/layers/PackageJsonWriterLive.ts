import { FileSystem } from "@effect/platform";
import { Effect, Layer, Schema } from "effect";
import { Package } from "../domain/Package.js";
import { PackageJsonWriteError } from "../errors/PackageJsonWriteError.js";
import { PackageJsonSchema } from "../schemas/package-json.js";
import { CatalogResolver } from "../services/CatalogResolver.js";
import { PackageJsonFormatter } from "../services/PackageJsonFormatter.js";
import { PackageJsonTransformer } from "../services/PackageJsonTransformer.js";
import { PackageJsonWriter } from "../services/PackageJsonWriter.js";
import { WorkspaceResolver } from "../services/WorkspaceResolver.js";

export const PackageJsonWriterLive: Layer.Layer<
	PackageJsonWriter,
	never,
	FileSystem.FileSystem | PackageJsonFormatter | CatalogResolver | WorkspaceResolver | PackageJsonTransformer
> = Layer.effect(
	PackageJsonWriter,
	Effect.gen(function* () {
		const fs = yield* FileSystem.FileSystem;
		const formatter = yield* PackageJsonFormatter;
		const transformer = yield* PackageJsonTransformer;
		const catalog = yield* CatalogResolver;
		const workspace = yield* WorkspaceResolver;

		return PackageJsonWriter.of({
			write: (target, pkg) =>
				Effect.gen(function* () {
					// Publish-prep: resolve catalog:/workspace: protocols (no-op by default).
					const resolved = yield* Package.resolve(pkg).pipe(
						Effect.provideService(CatalogResolver, catalog),
						Effect.provideService(WorkspaceResolver, workspace),
						Effect.mapError((cause) => new PackageJsonWriteError({ target, cause })),
					);

					const encoded = yield* Schema.encode(PackageJsonSchema)(resolved).pipe(
						Effect.mapError((cause) => new PackageJsonWriteError({ target, cause })),
					);

					const raw = yield* transformer.transform(encoded as Record<string, unknown>);
					const formatted = formatter.format(raw);
					const json = `${JSON.stringify(formatted, null, 2)}\n`;

					yield* fs
						.writeFileString(target, json)
						.pipe(Effect.mapError((cause) => new PackageJsonWriteError({ target, cause })));
				}),
		});
	}),
);
