import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import { PackageName, ScopedPackageName, UnscopedPackageName, isValidPackageName } from "../../src/schemas/name.js";

describe("isValidPackageName", () => {
	it("accepts simple names", () => {
		expect(isValidPackageName("my-package")).toBe(true);
		expect(isValidPackageName("lodash")).toBe(true);
		expect(isValidPackageName("a")).toBe(true);
	});

	it("accepts scoped names", () => {
		expect(isValidPackageName("@scope/name")).toBe(true);
		expect(isValidPackageName("@my-org/my-pkg")).toBe(true);
	});

	it("rejects names starting with .", () => {
		expect(isValidPackageName(".hidden")).toBe(false);
	});

	it("rejects names starting with _", () => {
		expect(isValidPackageName("_private")).toBe(false);
	});

	it("rejects names with uppercase", () => {
		expect(isValidPackageName("MyPackage")).toBe(false);
	});

	it("rejects names longer than 214 characters", () => {
		expect(isValidPackageName("a".repeat(215))).toBe(false);
	});

	it("rejects empty string", () => {
		expect(isValidPackageName("")).toBe(false);
	});

	it("rejects names with spaces", () => {
		expect(isValidPackageName("my package")).toBe(false);
	});

	it("rejects names with special characters", () => {
		expect(isValidPackageName("my~package")).toBe(false);
		expect(isValidPackageName("my'package")).toBe(false);
		expect(isValidPackageName("my!package")).toBe(false);
		expect(isValidPackageName("my(package)")).toBe(false);
	});

	it("accepts names with dots, hyphens, underscores in middle", () => {
		expect(isValidPackageName("my.package")).toBe(true);
		expect(isValidPackageName("my-package")).toBe(true);
		expect(isValidPackageName("my_package")).toBe(true);
	});
});

describe("PackageName schema", () => {
	it("decodes a valid unscoped name", () => {
		const result = Schema.decodeUnknownSync(PackageName)("lodash");
		expect(result).toBe("lodash");
	});

	it("decodes a valid scoped name", () => {
		const result = Schema.decodeUnknownSync(PackageName)("@scope/pkg");
		expect(result).toBe("@scope/pkg");
	});

	it("fails on invalid name", () => {
		expect(() => Schema.decodeUnknownSync(PackageName)("BAD")).toThrow();
	});
});

describe("ScopedPackageName schema", () => {
	it("decodes scoped names", () => {
		const result = Schema.decodeUnknownSync(ScopedPackageName)("@scope/pkg");
		expect(result).toBe("@scope/pkg");
	});

	it("rejects unscoped names", () => {
		expect(() => Schema.decodeUnknownSync(ScopedPackageName)("lodash")).toThrow();
	});
});

describe("UnscopedPackageName schema", () => {
	it("decodes unscoped names", () => {
		const result = Schema.decodeUnknownSync(UnscopedPackageName)("lodash");
		expect(result).toBe("lodash");
	});

	it("rejects scoped names", () => {
		expect(() => Schema.decodeUnknownSync(UnscopedPackageName)("@scope/pkg")).toThrow();
	});
});
