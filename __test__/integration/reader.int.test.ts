import { Effect, HashMap, Option } from "effect";
import { describe, expect, it } from "vitest";
import { PackageJsonReader } from "../../src/services/PackageJsonReader.js";
import { fixturePath } from "../utils/fixtures.js";
import { TestLayer } from "../utils/layers.js";

const read = (fixture: string) =>
	Effect.gen(function* () {
		const reader = yield* PackageJsonReader;
		return yield* reader.read(fixturePath(fixture));
	}).pipe(Effect.provide(TestLayer), Effect.runPromise);

describe("PackageJsonReader integration", () => {
	describe("minimal fixture", () => {
		it("reads name and version", async () => {
			const pkg = await read("minimal");
			expect(pkg.name).toBe("minimal-pkg");
			expect(pkg.version.major).toBe(1);
			expect(pkg.version.minor).toBe(0);
			expect(pkg.version.patch).toBe(0);
		});

		it("has empty dependencies", async () => {
			const pkg = await read("minimal");
			expect(HashMap.size(pkg.dependencies)).toBe(0);
		});

		it("has no description", async () => {
			const pkg = await read("minimal");
			expect(Option.isNone(pkg.description)).toBe(true);
		});
	});

	describe("full fixture", () => {
		it("reads all typed fields", async () => {
			const pkg = await read("full");
			expect(pkg.name).toBe("@scope/full-pkg");
			expect(pkg.isScoped).toBe(true);
			expect(pkg.isESM).toBe(true);
			expect(pkg.isPrivate).toBe(true);
			expect(Option.getOrThrow(pkg.description)).toBe("A full package with all typed fields");
			expect(Option.getOrThrow(pkg.license)).toBe("MIT");
		});

		it("reads dependency maps", async () => {
			const pkg = await read("full");
			expect(HashMap.size(pkg.dependencies)).toBe(2);
			expect(HashMap.has(pkg.dependencies, "lodash")).toBe(true);
			expect(HashMap.size(pkg.devDependencies)).toBe(2);
			expect(HashMap.size(pkg.peerDependencies)).toBe(1);
			expect(HashMap.size(pkg.optionalDependencies)).toBe(1);
		});

		it("reads scripts", async () => {
			const pkg = await read("full");
			expect(HashMap.size(pkg.scripts)).toBe(3);
			expect(HashMap.get(pkg.scripts, "test")).toEqual(Option.some("vitest run"));
		});

		it("snapshot of decoded package", async () => {
			const pkg = await read("full");
			expect({
				name: pkg.name,
				version: pkg.version.toString(),
				isScoped: pkg.isScoped,
				isESM: pkg.isESM,
				isPrivate: pkg.isPrivate,
				description: Option.getOrNull(pkg.description),
				license: Option.getOrNull(pkg.license),
				dependencyCount: HashMap.size(pkg.dependencies),
				devDependencyCount: HashMap.size(pkg.devDependencies),
				peerDependencyCount: HashMap.size(pkg.peerDependencies),
				scriptCount: HashMap.size(pkg.scripts),
			}).toMatchSnapshot();
		});
	});

	describe("boilerplate fixture", () => {
		it("reads the real boilerplate template", async () => {
			const pkg = await read("boilerplate");
			expect(pkg.name).toBe("@savvy-web/pnpm-module-template");
			expect(pkg.isScoped).toBe(true);
			expect(pkg.isPrivate).toBe(true);
			expect(pkg.isESM).toBe(true);
		});

		it("reads scripts from boilerplate", async () => {
			const pkg = await read("boilerplate");
			expect(HashMap.has(pkg.scripts, "build")).toBe(true);
			expect(HashMap.has(pkg.scripts, "test")).toBe(true);
			expect(HashMap.has(pkg.scripts, "typecheck")).toBe(true);
		});

		it("snapshot of boilerplate metadata", async () => {
			const pkg = await read("boilerplate");
			expect({
				name: pkg.name,
				version: pkg.version.toString(),
				isScoped: pkg.isScoped,
				isESM: pkg.isESM,
				isPrivate: pkg.isPrivate,
				license: Option.getOrNull(pkg.license),
				scriptNames: [...HashMap.keys(pkg.scripts)].sort(),
				devDependencyNames: [...HashMap.keys(pkg.devDependencies)].sort(),
			}).toMatchSnapshot();
		});
	});

	describe("scoped fixture", () => {
		it("reads scoped package", async () => {
			const pkg = await read("scoped");
			expect(pkg.isScoped).toBe(true);
			expect(pkg.name).toBe("@myorg/scoped-pkg");
		});
	});

	describe("not found", () => {
		it("fails for non-existent file", async () => {
			const exit = await Effect.gen(function* () {
				const reader = yield* PackageJsonReader;
				return yield* reader.read("/nonexistent/package.json");
			}).pipe(Effect.provide(TestLayer), Effect.runPromiseExit);

			expect(exit._tag).toBe("Failure");
		});
	});
});
