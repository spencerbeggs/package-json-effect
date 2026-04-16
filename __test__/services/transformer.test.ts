import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { CatalogResolverLive } from "../../src/layers/CatalogResolverLive.js";
import { PackageJsonTransformerLive } from "../../src/layers/PackageJsonTransformerLive.js";
import { WorkspaceResolverLive } from "../../src/layers/WorkspaceResolverLive.js";
import { CatalogResolver } from "../../src/services/CatalogResolver.js";
import { PackageJsonTransformer } from "../../src/services/PackageJsonTransformer.js";
import { WorkspaceResolver } from "../../src/services/WorkspaceResolver.js";

describe("CatalogResolverLive", () => {
	it("passes through unchanged (no-op)", async () => {
		const input = { name: "pkg", dependencies: { foo: "catalog:silk" } };
		const result = await Effect.runPromise(
			Effect.gen(function* () {
				const resolver = yield* CatalogResolver;
				return yield* resolver.resolve(input);
			}).pipe(Effect.provide(CatalogResolverLive)),
		);
		expect(result).toEqual(input);
	});
});

describe("WorkspaceResolverLive", () => {
	it("passes through unchanged (no-op)", async () => {
		const input = { name: "pkg", dependencies: { bar: "workspace:*" } };
		const result = await Effect.runPromise(
			Effect.gen(function* () {
				const resolver = yield* WorkspaceResolver;
				return yield* resolver.resolve(input);
			}).pipe(Effect.provide(WorkspaceResolverLive)),
		);
		expect(result).toEqual(input);
	});
});

describe("PackageJsonTransformerLive", () => {
	it("removes empty dependencies", async () => {
		const input = {
			name: "pkg",
			version: "1.0.0",
			dependencies: {},
			devDependencies: { vitest: "^1.0.0" },
			peerDependencies: {},
			optionalDependencies: {},
		};
		const result = await Effect.runPromise(
			Effect.gen(function* () {
				const transformer = yield* PackageJsonTransformer;
				return yield* transformer.transform(input);
			}).pipe(Effect.provide(PackageJsonTransformerLive)),
		);
		expect(result.dependencies).toBeUndefined();
		expect(result.devDependencies).toEqual({ vitest: "^1.0.0" });
		expect(result.peerDependencies).toBeUndefined();
		expect(result.optionalDependencies).toBeUndefined();
	});

	it("preserves non-empty dependencies", async () => {
		const input = {
			name: "pkg",
			dependencies: { lodash: "^4.0.0" },
		};
		const result = await Effect.runPromise(
			Effect.gen(function* () {
				const transformer = yield* PackageJsonTransformer;
				return yield* transformer.transform(input);
			}).pipe(Effect.provide(PackageJsonTransformerLive)),
		);
		expect(result.dependencies).toEqual({ lodash: "^4.0.0" });
	});

	it("handles no dependency fields", async () => {
		const input = { name: "pkg", version: "1.0.0" };
		const result = await Effect.runPromise(
			Effect.gen(function* () {
				const transformer = yield* PackageJsonTransformer;
				return yield* transformer.transform(input);
			}).pipe(Effect.provide(PackageJsonTransformerLive)),
		);
		expect(result).toEqual(input);
	});
});
