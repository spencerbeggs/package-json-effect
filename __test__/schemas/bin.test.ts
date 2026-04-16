import { HashMap, Schema } from "effect";
import { describe, expect, it } from "vitest";
import { BinSchema } from "../../src/schemas/bin.js";

describe("BinSchema", () => {
	it("decodes a string", () => {
		const result = Schema.decodeUnknownSync(BinSchema)("./cli.js");
		expect(result).toBe("./cli.js");
	});

	it("decodes an object into a HashMap", () => {
		const result = Schema.decodeUnknownSync(BinSchema)({ myapp: "./cli.js", helper: "./helper.js" });
		expect(HashMap.isHashMap(result)).toBe(true);
		expect(HashMap.size(result as HashMap.HashMap<string, string>)).toBe(2);
	});

	it("encodes a string back", () => {
		const result = Schema.encodeSync(BinSchema)("./cli.js");
		expect(result).toBe("./cli.js");
	});

	it("encodes a HashMap back to an object", () => {
		const map = HashMap.make(["myapp", "./cli.js"]);
		const result = Schema.encodeSync(BinSchema)(map);
		expect(result).toEqual({ myapp: "./cli.js" });
	});
});
