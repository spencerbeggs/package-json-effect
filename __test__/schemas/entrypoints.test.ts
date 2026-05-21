import { describe, expect, it } from "vitest";

describe("entry points", () => {
	it("exposes domain/services/layers from the root", async () => {
		const root = await import("../../src/index.js");
		expect(root.Package).toBeDefined();
		expect(root.PackageJsonReader).toBeDefined();
		expect(root.PackageJsonLive).toBeDefined();
		expect(root.isUnresolvedDependency).toBeDefined();
	});

	it("exposes raw schemas from /schema", async () => {
		const schema = await import("../../src/schema.js");
		expect(schema.PackageJsonSchema).toBeDefined();
		expect(schema.makePackageJsonSchema).toBeDefined();
		expect(schema.DependencySpecifier).toBeDefined();
		expect(schema.SpdxLicense).toBeDefined();
		expect(schema.PackageName).toBeDefined();
	});
});
