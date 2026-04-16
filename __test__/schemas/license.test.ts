import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import { SpdxLicense } from "../../src/schemas/license.js";

describe("SpdxLicense schema", () => {
	it("accepts common SPDX identifiers", () => {
		expect(Schema.decodeUnknownSync(SpdxLicense)("MIT")).toBe("MIT");
		expect(Schema.decodeUnknownSync(SpdxLicense)("Apache-2.0")).toBe("Apache-2.0");
		expect(Schema.decodeUnknownSync(SpdxLicense)("ISC")).toBe("ISC");
		expect(Schema.decodeUnknownSync(SpdxLicense)("BSD-3-Clause")).toBe("BSD-3-Clause");
		expect(Schema.decodeUnknownSync(SpdxLicense)("GPL-3.0-only")).toBe("GPL-3.0-only");
	});

	it("accepts SPDX expressions", () => {
		expect(Schema.decodeUnknownSync(SpdxLicense)("(MIT OR Apache-2.0)")).toBe("(MIT OR Apache-2.0)");
		expect(Schema.decodeUnknownSync(SpdxLicense)("(ISC AND MIT)")).toBe("(ISC AND MIT)");
	});

	it('accepts "UNLICENSED"', () => {
		expect(Schema.decodeUnknownSync(SpdxLicense)("UNLICENSED")).toBe("UNLICENSED");
	});

	it('accepts "SEE LICENSE IN <filename>"', () => {
		expect(Schema.decodeUnknownSync(SpdxLicense)("SEE LICENSE IN LICENSE.md")).toBe("SEE LICENSE IN LICENSE.md");
	});

	it("rejects invalid license strings", () => {
		expect(() => Schema.decodeUnknownSync(SpdxLicense)("")).toThrow();
		expect(() => Schema.decodeUnknownSync(SpdxLicense)("NOT-A-LICENSE")).toThrow();
	});
});
