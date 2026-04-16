import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import { VersionSchema } from "../../src/schemas/version.js";

describe("VersionSchema", () => {
	it("decodes a version string into a SemVer instance", () => {
		const result = Schema.decodeUnknownSync(VersionSchema)("1.2.3");
		expect(result.major).toBe(1);
		expect(result.minor).toBe(2);
		expect(result.patch).toBe(3);
	});

	it("decodes a prerelease version", () => {
		const result = Schema.decodeUnknownSync(VersionSchema)("1.0.0-alpha.1");
		expect(result.major).toBe(1);
		expect(result.prerelease.length).toBeGreaterThan(0);
	});

	it("encodes a SemVer back to a string", () => {
		const semver = Schema.decodeUnknownSync(VersionSchema)("2.1.0");
		const encoded = Schema.encodeSync(VersionSchema)(semver);
		expect(encoded).toBe("2.1.0");
	});

	it("rejects an invalid version string", () => {
		expect(() => Schema.decodeUnknownSync(VersionSchema)("not-semver")).toThrow();
	});

	it("roundtrips prerelease+build versions", () => {
		const input = "1.0.0-beta.2+build.123";
		const decoded = Schema.decodeUnknownSync(VersionSchema)(input);
		const encoded = Schema.encodeSync(VersionSchema)(decoded);
		expect(encoded).toBe(input);
	});
});
