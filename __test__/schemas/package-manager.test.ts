import { Option, Schema } from "effect";
import { describe, expect, it } from "vitest";
import { PackageManagerSchema } from "../../src/schemas/package-manager.js";

describe("PackageManagerSchema", () => {
	it("decodes a packageManager with integrity", () => {
		const input = "pnpm@10.33.0+sha512.abc123";
		const result = Schema.decodeUnknownSync(PackageManagerSchema)(input);
		expect(result.name).toBe("pnpm");
		expect(result.version).toBe("10.33.0");
		expect(Option.isSome(result.integrity)).toBe(true);
		expect(Option.getOrThrow(result.integrity)).toBe("sha512.abc123");
	});

	it("decodes a packageManager without integrity", () => {
		const input = "npm@10.0.0";
		const result = Schema.decodeUnknownSync(PackageManagerSchema)(input);
		expect(result.name).toBe("npm");
		expect(result.version).toBe("10.0.0");
		expect(Option.isNone(result.integrity)).toBe(true);
	});

	it("decodes yarn", () => {
		const result = Schema.decodeUnknownSync(PackageManagerSchema)("yarn@4.1.0");
		expect(result.name).toBe("yarn");
	});

	it("encodes back to string with integrity", () => {
		const input = "pnpm@10.33.0+sha512.abc123";
		const decoded = Schema.decodeUnknownSync(PackageManagerSchema)(input);
		const encoded = Schema.encodeSync(PackageManagerSchema)(decoded);
		expect(encoded).toBe(input);
	});

	it("encodes back to string without integrity", () => {
		const input = "npm@10.0.0";
		const decoded = Schema.decodeUnknownSync(PackageManagerSchema)(input);
		const encoded = Schema.encodeSync(PackageManagerSchema)(decoded);
		expect(encoded).toBe(input);
	});

	it("has hasIntegrity getter", () => {
		const withHash = Schema.decodeUnknownSync(PackageManagerSchema)("pnpm@10.0.0+sha512.xyz");
		expect(withHash.hasIntegrity).toBe(true);

		const withoutHash = Schema.decodeUnknownSync(PackageManagerSchema)("npm@10.0.0");
		expect(withoutHash.hasIntegrity).toBe(false);
	});

	it("rejects invalid format", () => {
		expect(() => Schema.decodeUnknownSync(PackageManagerSchema)("not-valid")).toThrow();
	});
});
