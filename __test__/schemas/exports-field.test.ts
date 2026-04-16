import { Schema } from "effect";
import { describe, expect, it } from "vitest";
import { ExportsFieldSchema } from "../../src/schemas/exports-field.js";

describe("ExportsFieldSchema", () => {
	it("decodes a string export", () => {
		const result = Schema.decodeUnknownSync(ExportsFieldSchema)("./src/index.ts");
		expect(result).toBe("./src/index.ts");
	});

	it("decodes an object with subpath exports", () => {
		const input = { ".": "./src/index.ts", "./schema": "./src/schema.ts" };
		const result = Schema.decodeUnknownSync(ExportsFieldSchema)(input);
		expect(result).toEqual(input);
	});

	it("decodes null values (blocked subpaths)", () => {
		const input = { ".": "./src/index.ts", "./internal/*": null };
		const result = Schema.decodeUnknownSync(ExportsFieldSchema)(input);
		expect(result).toEqual(input);
	});

	it("encodes string back", () => {
		const encoded = Schema.encodeSync(ExportsFieldSchema)("./index.js");
		expect(encoded).toBe("./index.js");
	});

	it("encodes object back", () => {
		const input = { ".": "./index.js", "./feature": "./feature.js" };
		const encoded = Schema.encodeSync(ExportsFieldSchema)(input);
		expect(encoded).toEqual(input);
	});
});
