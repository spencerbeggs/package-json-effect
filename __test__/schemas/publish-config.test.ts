import { Option, Schema } from "effect";
import { describe, expect, it } from "vitest";
import { PublishConfigSchema } from "../../src/schemas/publish-config.js";

describe("PublishConfigSchema", () => {
	it("decodes a basic publishConfig", () => {
		const input = { access: "public", directory: "dist/npm", registry: "https://registry.npmjs.org/" };
		const result = Schema.decodeUnknownSync(PublishConfigSchema)(input);
		expect(Option.getOrThrow(result.access)).toBe("public");
		expect(Option.getOrThrow(result.directory)).toBe("dist/npm");
		expect(Option.getOrThrow(result.registry)).toBe("https://registry.npmjs.org/");
	});

	it("decodes pnpm linkDirectory", () => {
		const input = { access: "public", linkDirectory: true };
		const result = Schema.decodeUnknownSync(PublishConfigSchema)(input);
		expect(Option.getOrThrow(result.linkDirectory)).toBe(true);
	});

	it("preserves unknown fields (like targets)", () => {
		const input = {
			access: "public",
			targets: [{ protocol: "npm", registry: "https://npm.pkg.github.com/" }],
		};
		const decoded = Schema.decodeUnknownSync(PublishConfigSchema)(input);
		const encoded = Schema.encodeSync(PublishConfigSchema)(decoded);
		expect(encoded.targets).toEqual([{ protocol: "npm", registry: "https://npm.pkg.github.com/" }]);
	});

	it("handles empty publishConfig", () => {
		const result = Schema.decodeUnknownSync(PublishConfigSchema)({});
		expect(Option.isNone(result.access)).toBe(true);
		expect(Option.isNone(result.directory)).toBe(true);
	});

	it("encodes back to plain object", () => {
		const input = { access: "public", directory: "dist/npm" };
		const decoded = Schema.decodeUnknownSync(PublishConfigSchema)(input);
		const encoded = Schema.encodeSync(PublishConfigSchema)(decoded);
		expect(encoded.access).toBe("public");
		expect(encoded.directory).toBe("dist/npm");
	});
});
