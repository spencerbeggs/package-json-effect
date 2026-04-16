import { FileSystem } from "@effect/platform";
import { Effect, Layer, Schema } from "effect";
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
		const catalogResolver = yield* CatalogResolver;
		const workspaceResolver = yield* WorkspaceResolver;
		const transformer = yield* PackageJsonTransformer;

		return PackageJsonWriter.of({
			write: (target, pkg) =>
				Effect.gen(function* () {
					const encoded = yield* Schema.encode(PackageJsonSchema)(pkg._data).pipe(
						Effect.mapError((cause) => new PackageJsonWriteError({ target, cause })),
					);

					let raw = encoded as Record<string, unknown>;
					raw = yield* catalogResolver.resolve(raw);
					raw = yield* workspaceResolver.resolve(raw);
					raw = yield* transformer.transform(raw);
					const formatted = formatter.format(raw);
					const json = `${JSON.stringify(formatted, null, 2)}\n`;

					yield* fs
						.writeFileString(target, json)
						.pipe(Effect.mapError((cause) => new PackageJsonWriteError({ target, cause })));
				}),
		});
	}),
);
