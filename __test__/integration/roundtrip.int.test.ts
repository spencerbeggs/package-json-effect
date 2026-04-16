import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Effect } from "effect";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PackageJsonReader } from "../../src/services/PackageJsonReader.js";
import { PackageJsonWriter } from "../../src/services/PackageJsonWriter.js";
import { fixturePath } from "../utils/fixtures.js";
import { TestLayer } from "../utils/layers.js";

let tempDir: string;

beforeEach(() => {
	tempDir = mkdtempSync(join(tmpdir(), "pkg-json-roundtrip-"));
});

afterEach(() => {
	rmSync(tempDir, { recursive: true, force: true });
});

const roundtrip = (fixture: string) =>
	Effect.gen(function* () {
		const reader = yield* PackageJsonReader;
		const writer = yield* PackageJsonWriter;

		const pkg = yield* reader.read(fixturePath(fixture));
		const outPath = join(tempDir, "package.json");
		yield* writer.write(outPath, pkg);

		const written = JSON.parse(readFileSync(outPath, "utf-8"));
		return written;
	}).pipe(Effect.provide(TestLayer), Effect.runPromise);

describe("Round-trip integration", () => {
	it("minimal: preserves name and version", async () => {
		const result = await roundtrip("minimal");
		expect(result.name).toBe("minimal-pkg");
		expect(result.version).toBe("1.0.0");
	});

	it("full: preserves all typed fields", async () => {
		const result = await roundtrip("full");
		expect(result.name).toBe("@scope/full-pkg");
		expect(result.version).toBe("2.1.0");
		expect(result.description).toBe("A full package with all typed fields");
		expect(result.dependencies).toEqual({ effect: "^3.0.0", lodash: "^4.0.0" });
		expect(result.scripts.build).toBe("tsc");
	});

	it("full: output snapshot", async () => {
		const result = await roundtrip("full");
		expect(result).toMatchSnapshot();
	});

	it("with-custom-fields: preserves unknown fields", async () => {
		const result = await roundtrip("with-custom-fields");
		expect(result.customString).toBe("preserved");
		expect(result.customArray).toEqual([1, 2, 3]);
		expect(result.customObject).toEqual({ nested: true, deep: { value: "kept" } });
		expect(result["x-custom-namespace"]).toBe("also preserved");
	});

	it("with-custom-fields: output snapshot", async () => {
		const result = await roundtrip("with-custom-fields");
		expect(result).toMatchSnapshot();
	});

	it("boilerplate: preserves known and unknown fields", async () => {
		const result = await roundtrip("boilerplate");
		expect(result.name).toBe("@savvy-web/pnpm-module-template");
		expect(result.publishConfig.targets).toBeDefined();
		expect(result.publishConfig.targets).toHaveLength(2);
		expect(result.repository).toEqual({
			type: "git",
			url: "https://github.com/spencerbeggs/pnpm-module-template.git",
		});
	});

	it("boilerplate: full output snapshot", async () => {
		const result = await roundtrip("boilerplate");
		expect(result).toMatchSnapshot();
	});

	it("scoped: output snapshot", async () => {
		const result = await roundtrip("scoped");
		expect(result).toMatchSnapshot();
	});

	it("transformer strips empty deps from minimal", async () => {
		const result = await roundtrip("minimal");
		expect(result.dependencies).toBeUndefined();
		expect(result.devDependencies).toBeUndefined();
		expect(result.peerDependencies).toBeUndefined();
		expect(result.optionalDependencies).toBeUndefined();
	});

	it("keys are sorted in output", async () => {
		const result = await roundtrip("full");
		const keys = Object.keys(result);
		expect(keys.indexOf("name")).toBeLessThan(keys.indexOf("version"));
		expect(keys.indexOf("version")).toBeLessThan(keys.indexOf("description"));
		expect(keys.indexOf("license")).toBeLessThan(keys.indexOf("exports"));
		expect(keys.indexOf("scripts")).toBeLessThan(keys.indexOf("dependencies"));
	});
});
