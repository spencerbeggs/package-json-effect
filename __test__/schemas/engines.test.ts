import { HashMap, Schema } from "effect";
import { describe, expect, it } from "vitest";
import { EnginesSchema } from "../../src/schemas/engines.js";

describe("EnginesSchema", () => {
	it("decodes an engines object into a HashMap", () => {
		const result = Schema.decodeUnknownSync(EnginesSchema)({ node: ">=18.0.0", npm: ">=9.0.0" });
		expect(HashMap.size(result)).toBe(2);
		expect(HashMap.get(result, "node")._tag).toBe("Some");
	});

	it("encodes back to a plain object", () => {
		const map = HashMap.make(["node", ">=18.0.0"]);
		const result = Schema.encodeSync(EnginesSchema)(map);
		expect(result).toEqual({ node: ">=18.0.0" });
	});
});
