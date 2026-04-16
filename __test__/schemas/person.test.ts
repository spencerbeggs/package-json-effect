import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import { PersonSchema } from "../../src/schemas/person.js";

describe("PersonSchema", () => {
	it("decodes a full object", () => {
		const result = Schema.decodeUnknownSync(PersonSchema)({
			name: "John Doe",
			email: "john@example.com",
			url: "https://example.com",
		});
		expect(result).toEqual({ name: "John Doe", email: "john@example.com", url: "https://example.com" });
	});

	it("decodes a name-only object", () => {
		const result = Schema.decodeUnknownSync(PersonSchema)({ name: "John Doe" });
		expect(result).toEqual({ name: "John Doe" });
	});

	it("decodes a string with all parts", () => {
		const result = Schema.decodeUnknownSync(PersonSchema)("John Doe <john@example.com> (https://example.com)");
		expect(result).toEqual({ name: "John Doe", email: "john@example.com", url: "https://example.com" });
	});

	it("decodes a name-only string", () => {
		const result = Schema.decodeUnknownSync(PersonSchema)("John Doe");
		expect(result).toEqual({ name: "John Doe" });
	});

	it("decodes a string with only email", () => {
		const result = Schema.decodeUnknownSync(PersonSchema)("John Doe <john@example.com>");
		expect(result).toEqual({ name: "John Doe", email: "john@example.com" });
	});

	it("encodes an object back to an object", () => {
		const result = Schema.encodeSync(PersonSchema)({ name: "John Doe", email: "john@example.com" });
		expect(result).toEqual({ name: "John Doe", email: "john@example.com" });
	});
});
