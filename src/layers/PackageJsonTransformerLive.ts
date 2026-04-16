import { Effect, Layer } from "effect";
import { PackageJsonTransformer } from "../services/PackageJsonTransformer.js";

const DEPENDENCY_MAP_KEYS = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"] as const;

const stripEmptyDependencyMaps = (raw: Record<string, unknown>): Record<string, unknown> => {
	const result = { ...raw };
	for (const key of DEPENDENCY_MAP_KEYS) {
		const value = result[key];
		if (value !== undefined && typeof value === "object" && value !== null && Object.keys(value).length === 0) {
			delete result[key];
		}
	}
	return result;
};

/**
 * Default PackageJsonTransformer: removes empty dependency map fields.
 * Replace or compose with custom transformers for additional processing.
 */
export const PackageJsonTransformerLive: Layer.Layer<PackageJsonTransformer> = Layer.succeed(
	PackageJsonTransformer,
	PackageJsonTransformer.of({
		transform: (raw) => Effect.succeed(stripEmptyDependencyMaps(raw)),
	}),
);
