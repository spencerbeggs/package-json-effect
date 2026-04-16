import { HashMap, Option, Schema } from "effect";
import { describe, expect, it } from "vitest";
import { PackageJsonSchema, makePackageJsonSchema } from "../../src/schemas/package-json.js";

const minimal = { name: "my-pkg", version: "1.0.0" };

const full = {
	name: "my-pkg",
	version: "1.0.0",
	description: "A package",
	private: true,
	type: "module" as const,
	main: "./index.js",
	license: "MIT",
	dependencies: { lodash: "^4.0.0" },
	devDependencies: { vitest: "^1.0.0" },
	peerDependencies: { effect: "^3.0.0" },
	optionalDependencies: {},
	scripts: { test: "vitest run", build: "tsc" },
	bin: "./cli.js",
	engines: { node: ">=18" },
};

describe("PackageJsonSchema", () => {
	it("decodes a minimal package.json", () => {
		const result = Schema.decodeUnknownSync(PackageJsonSchema)(minimal);
		expect(result.name).toBe("my-pkg");
		expect(result.version.major).toBe(1);
		expect(result.version.minor).toBe(0);
		expect(result.version.patch).toBe(0);
		expect(Option.isNone(result.description)).toBe(true);
	});

	it("defaults dependency maps to empty HashMap when absent", () => {
		const result = Schema.decodeUnknownSync(PackageJsonSchema)(minimal);
		expect(HashMap.isHashMap(result.dependencies)).toBe(true);
		expect(HashMap.size(result.dependencies)).toBe(0);
		expect(HashMap.size(result.devDependencies)).toBe(0);
		expect(HashMap.size(result.peerDependencies)).toBe(0);
		expect(HashMap.size(result.optionalDependencies)).toBe(0);
		expect(HashMap.size(result.scripts)).toBe(0);
	});

	it("decodes a full package.json", () => {
		const result = Schema.decodeUnknownSync(PackageJsonSchema)(full);
		expect(result.name).toBe("my-pkg");
		expect(Option.isSome(result.description)).toBe(true);
		expect(Option.isSome(result.private)).toBe(true);
		expect(Option.isSome(result.type)).toBe(true);
		expect(HashMap.size(result.dependencies)).toBe(1);
		expect(HashMap.size(result.scripts)).toBe(2);
	});

	it("preserves unknown fields in round-trip", () => {
		const input = { ...minimal, customField: "preserved", anotherCustom: [1, 2, 3] };
		const decoded = Schema.decodeUnknownSync(PackageJsonSchema)(input);
		const encoded = Schema.encodeSync(PackageJsonSchema)(decoded);
		expect(encoded.customField).toBe("preserved");
		expect(encoded.anotherCustom).toEqual([1, 2, 3]);
	});

	it("encodes back to plain JSON", () => {
		const decoded = Schema.decodeUnknownSync(PackageJsonSchema)(full);
		const encoded = Schema.encodeSync(PackageJsonSchema)(decoded);
		expect(encoded.name).toBe("my-pkg");
		expect(encoded.version).toBe("1.0.0");
		expect(typeof encoded.dependencies).toBe("object");
		expect(encoded.dependencies).toHaveProperty("lodash");
	});

	it("rejects missing name", () => {
		expect(() => Schema.decodeUnknownSync(PackageJsonSchema)({ version: "1.0.0" })).toThrow();
	});

	it("rejects missing version", () => {
		expect(() => Schema.decodeUnknownSync(PackageJsonSchema)({ name: "pkg" })).toThrow();
	});
});

describe("makePackageJsonSchema", () => {
	it("creates a schema with overridden fields", () => {
		const CustomSchema = makePackageJsonSchema({
			description: Schema.String,
		});
		const result = Schema.decodeUnknownSync(CustomSchema)({
			name: "pkg",
			version: "1.0.0",
			description: "required now",
		});
		expect(result.description).toBe("required now");
	});

	it("preserves unknown fields with custom schema", () => {
		const CustomSchema = makePackageJsonSchema({});
		const decoded = Schema.decodeUnknownSync(CustomSchema)({
			name: "pkg",
			version: "1.0.0",
			custom: true,
		});
		const encoded = Schema.encodeSync(CustomSchema)(decoded);
		expect(encoded.custom).toBe(true);
	});
});
