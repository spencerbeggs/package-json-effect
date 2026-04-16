import { HashMap, Schema } from "effect";
import { describe, expect, it } from "vitest";
import { DependencyMapSchema } from "../../src/schemas/dependency-map.js";

describe("DependencyMapSchema", () => {
	it("decodes an object into a HashMap", () => {
		const input = { lodash: "^4.0.0", effect: "^3.0.0" };
		const result = Schema.decodeUnknownSync(DependencyMapSchema)(input);
		expect(HashMap.size(result)).toBe(2);
		expect(HashMap.get(result, "lodash")._tag).toBe("Some");
	});

	it("decodes an empty object", () => {
		const result = Schema.decodeUnknownSync(DependencyMapSchema)({});
		expect(HashMap.size(result)).toBe(0);
	});

	it("encodes back to a plain object", () => {
		const map = HashMap.make(["lodash", "^4.0.0"], ["effect", "^3.0.0"]);
		const result = Schema.encodeSync(DependencyMapSchema)(map);
		expect(result).toEqual({ lodash: "^4.0.0", effect: "^3.0.0" });
	});
});
