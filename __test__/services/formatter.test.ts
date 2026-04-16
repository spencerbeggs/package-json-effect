import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { PackageJsonFormatterLive } from "../../src/layers/PackageJsonFormatterLive.js";
import { PackageJsonFormatter } from "../../src/services/PackageJsonFormatter.js";

const runFormatter = (raw: Record<string, unknown>) =>
	Effect.gen(function* () {
		const formatter = yield* PackageJsonFormatter;
		return formatter.format(raw);
	}).pipe(Effect.provide(PackageJsonFormatterLive), Effect.runSync);

describe("PackageJsonFormatterLive", () => {
	it("sorts top-level keys in conventional order", () => {
		const input = { version: "1.0.0", name: "pkg", description: "desc", license: "MIT" };
		const result = runFormatter(input);
		const keys = Object.keys(result);
		expect(keys.indexOf("name")).toBeLessThan(keys.indexOf("version"));
		expect(keys.indexOf("version")).toBeLessThan(keys.indexOf("description"));
		expect(keys.indexOf("description")).toBeLessThan(keys.indexOf("license"));
	});

	it("puts unknown keys at the end alphabetically", () => {
		const input = { name: "pkg", version: "1.0.0", zebra: true, alpha: true };
		const result = runFormatter(input);
		const keys = Object.keys(result);
		expect(keys.indexOf("alpha")).toBeLessThan(keys.indexOf("zebra"));
		expect(keys.indexOf("version")).toBeLessThan(keys.indexOf("alpha"));
	});

	it("sorts dependency maps alphabetically", () => {
		const input = {
			name: "pkg",
			version: "1.0.0",
			dependencies: { zlib: "1.0.0", axios: "1.0.0", lodash: "1.0.0" },
		};
		const result = runFormatter(input);
		const depKeys = Object.keys(result.dependencies as Record<string, unknown>);
		expect(depKeys).toEqual(["axios", "lodash", "zlib"]);
	});

	it("preserves all values", () => {
		const input = { name: "pkg", version: "1.0.0", custom: [1, 2, 3] };
		const result = runFormatter(input);
		expect(result.name).toBe("pkg");
		expect(result.custom).toEqual([1, 2, 3]);
	});
});
