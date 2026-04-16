import { Option, Schema } from "effect";
import { describe, expect, it } from "vitest";
import { DevEnginesSchema } from "../../src/schemas/dev-engines.js";

describe("DevEnginesSchema", () => {
	it("decodes a full devEngines object", () => {
		const input = {
			packageManager: { name: "pnpm", version: "10.33.0", onFail: "ignore" },
			runtime: [{ name: "node", version: "24.11.0", onFail: "ignore" }],
		};
		const result = Schema.decodeUnknownSync(DevEnginesSchema)(input);
		expect(Option.isSome(result.packageManager)).toBe(true);
		expect(Option.isSome(result.runtime)).toBe(true);
	});

	it("decodes single object for runtime", () => {
		const input = { runtime: { name: "node", version: "20.0.0" } };
		const result = Schema.decodeUnknownSync(DevEnginesSchema)(input);
		expect(Option.isSome(result.runtime)).toBe(true);
	});

	it("handles missing fields as None", () => {
		const result = Schema.decodeUnknownSync(DevEnginesSchema)({});
		expect(Option.isNone(result.packageManager)).toBe(true);
		expect(Option.isNone(result.runtime)).toBe(true);
		expect(Option.isNone(result.os)).toBe(true);
	});

	it("encodes back to plain object", () => {
		const input = {
			packageManager: { name: "pnpm", version: "10.33.0", onFail: "ignore" },
		};
		const decoded = Schema.decodeUnknownSync(DevEnginesSchema)(input);
		const encoded = Schema.encodeSync(DevEnginesSchema)(decoded);
		expect(encoded.packageManager).toEqual({ name: "pnpm", version: "10.33.0", onFail: "ignore" });
	});
});
