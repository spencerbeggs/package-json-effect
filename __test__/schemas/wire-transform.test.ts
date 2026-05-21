import { Equal, Option, Schema } from "effect";
import { describe, expect, it } from "vitest";
import { Package } from "../../src/domain/Package.js";
import { PackageJsonSchema, makePackageJsonSchema } from "../../src/schemas/package-json.js";

describe("PackageJsonSchema wire transform", () => {
	it("decodes a minimal object to a Package instance", () => {
		const pkg = Schema.decodeUnknownSync(PackageJsonSchema)({ name: "my-pkg", version: "1.0.0" });
		expect(pkg).toBeInstanceOf(Package);
		expect(pkg.name).toBe("my-pkg");
		expect(pkg.version.toString()).toBe("1.0.0");
	});

	it("preserves unknown top-level fields through round-trip", () => {
		const input = { name: "my-pkg", version: "1.0.0", customField: "kept", arr: [1, 2, 3] };
		const decoded = Schema.decodeUnknownSync(PackageJsonSchema)(input);
		const encoded = Schema.encodeSync(PackageJsonSchema)(decoded);
		expect(encoded.customField).toBe("kept");
		expect(encoded.arr).toEqual([1, 2, 3]);
	});

	it("never serializes a literal `rest` key", () => {
		const decoded = Schema.decodeUnknownSync(PackageJsonSchema)({ name: "p", version: "1.0.0", x: 1 });
		const encoded = Schema.encodeSync(PackageJsonSchema)(decoded) as Record<string, unknown>;
		expect(encoded).not.toHaveProperty("rest");
		expect(encoded.x).toBe(1);
	});

	it("gives structural equality to two independently decoded instances", () => {
		const a = Schema.decodeUnknownSync(PackageJsonSchema)({ name: "p", version: "1.0.0" });
		const b = Schema.decodeUnknownSync(PackageJsonSchema)({ name: "p", version: "1.0.0" });
		expect(Equal.equals(a, b)).toBe(true);
	});

	it("supports .extend() with a typed custom field excluded from rest", () => {
		class ToolPackage extends Package.extend<ToolPackage>("ToolPackage")({
			myTool: Schema.optionalWith(Schema.String, { as: "Option" }),
		}) {}
		const Wire = makePackageJsonSchema(ToolPackage);
		const decoded = Schema.decodeUnknownSync(Wire)({ name: "p", version: "1.0.0", myTool: "configured", other: 1 });
		expect(Option.getOrNull(decoded.myTool)).toBe("configured");
		const encoded = Schema.encodeSync(Wire)(decoded) as Record<string, unknown>;
		expect(encoded.myTool).toBe("configured");
		expect(encoded.other).toBe(1);
	});
});
