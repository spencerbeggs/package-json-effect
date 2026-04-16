import { FileSystem } from "@effect/platform";
import { Effect, Layer, Option, Schema } from "effect";
import { Package } from "../domain/Package.js";
import { PackageJsonDecodeError } from "../errors/PackageJsonDecodeError.js";
import { PackageJsonNotFoundError } from "../errors/PackageJsonNotFoundError.js";
import { PackageJsonParseError } from "../errors/PackageJsonParseError.js";
import { PackageJsonReadError } from "../errors/PackageJsonReadError.js";
import { PackageJsonSchema } from "../schemas/package-json.js";
import { PackageJsonReader } from "../services/PackageJsonReader.js";

export const PackageJsonReaderLive: Layer.Layer<PackageJsonReader, never, FileSystem.FileSystem> = Layer.effect(
	PackageJsonReader,
	Effect.gen(function* () {
		const fs = yield* FileSystem.FileSystem;

		return PackageJsonReader.of({
			read: (source) =>
				Effect.gen(function* () {
					const exists = yield* fs
						.exists(source)
						.pipe(Effect.mapError((cause) => new PackageJsonReadError({ source, cause })));
					if (!exists) {
						return yield* new PackageJsonNotFoundError({ source });
					}

					const content = yield* fs
						.readFileString(source)
						.pipe(Effect.mapError((cause) => new PackageJsonReadError({ source, cause })));

					const json = yield* Effect.try({
						try: () => JSON.parse(content) as unknown,
						catch: (err) => {
							const position =
								err instanceof SyntaxError && typeof (err as SyntaxError & { position?: number }).position === "number"
									? Option.some((err as SyntaxError & { position: number }).position)
									: Option.none();
							return new PackageJsonParseError({ input: content, position });
						},
					});

					const decoded = yield* Schema.decodeUnknown(PackageJsonSchema)(json).pipe(
						Effect.mapError(
							(cause) =>
								new PackageJsonDecodeError({
									input: json,
									message: cause.message ?? "Failed to decode package.json",
								}),
						),
					);

					return new Package(decoded);
				}),
		});
	}),
);
