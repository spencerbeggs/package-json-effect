import { Effect, HashMap, Option, Schema } from "effect";
import { describe, expect, it } from "vitest";
import { Package } from "../../src/domain/Package.js";
import { PackageJsonSchema, makePackageJsonSchema } from "../../src/schemas/package-json.js";

const minimalJson = { name: "my-pkg", version: "1.0.0" };
const fullJson = {
	name: "@scope/my-pkg",
	version: "2.1.0",
	description: "A package",
	private: true,
	type: "module" as const,
	main: "./index.js",
	license: "MIT",
	dependencies: { lodash: "^4.0.0" },
	devDependencies: { vitest: "^1.0.0" },
	peerDependencies: { effect: "^3.0.0" },
	scripts: { test: "vitest run" },
};

const decodePackage = (json: unknown) => {
	const schema = Schema.decodeUnknownSync(PackageJsonSchema)(json);
	return new Package(schema);
};

describe("Package getters", () => {
	it("exposes name", () => {
		const pkg = decodePackage(minimalJson);
		expect(pkg.name).toBe("my-pkg");
	});

	it("exposes version as SemVer", () => {
		const pkg = decodePackage(minimalJson);
		expect(pkg.version.major).toBe(1);
		expect(pkg.version.minor).toBe(0);
		expect(pkg.version.patch).toBe(0);
	});

	it("detects scoped packages", () => {
		const pkg = decodePackage(fullJson);
		expect(pkg.isScoped).toBe(true);
	});

	it("detects unscoped packages", () => {
		const pkg = decodePackage(minimalJson);
		expect(pkg.isScoped).toBe(false);
	});

	it("detects ESM packages", () => {
		const pkg = decodePackage(fullJson);
		expect(pkg.isESM).toBe(true);
	});

	it("defaults isESM to false", () => {
		const pkg = decodePackage(minimalJson);
		expect(pkg.isESM).toBe(false);
	});

	it("exposes description as Option", () => {
		const full = decodePackage(fullJson);
		expect(Option.isSome(full.description)).toBe(true);

		const minimal = decodePackage(minimalJson);
		expect(Option.isNone(minimal.description)).toBe(true);
	});

	it("exposes isPrivate", () => {
		const pkg = decodePackage(fullJson);
		expect(pkg.isPrivate).toBe(true);

		const pub = decodePackage(minimalJson);
		expect(pub.isPrivate).toBe(false);
	});
});

describe("Package.hasDependency", () => {
	it("finds a dependency", () => {
		const pkg = decodePackage(fullJson);
		expect(pkg.hasDependency("lodash")).toBe(true);
	});

	it("finds across dependency types", () => {
		const pkg = decodePackage(fullJson);
		expect(pkg.hasDependency("vitest")).toBe(true);
		expect(pkg.hasDependency("effect")).toBe(true);
	});

	it("returns false for missing dependency", () => {
		const pkg = decodePackage(fullJson);
		expect(pkg.hasDependency("nonexistent")).toBe(false);
	});
});

describe("Package.setVersion", () => {
	it("returns a new Package with the updated version", async () => {
		const pkg = decodePackage(minimalJson);
		const updated = await Effect.runPromise(Package.setVersion(pkg, "2.0.0"));
		expect(updated.version.major).toBe(2);
		expect(updated.version.minor).toBe(0);
		expect(pkg.version.major).toBe(1); // original unchanged
	});

	it("works as dual API (data-last)", async () => {
		const pkg = decodePackage(minimalJson);
		const updated = await Effect.runPromise(Package.setVersion("3.0.0")(pkg));
		expect(updated.version.major).toBe(3);
	});

	it("fails for invalid semver", async () => {
		const pkg = decodePackage(minimalJson);
		const exit = await Effect.runPromiseExit(Package.setVersion(pkg, "not-valid"));
		expect(exit._tag).toBe("Failure");
	});
});

describe("Package.setName", () => {
	it("returns a new Package with the updated name", async () => {
		const pkg = decodePackage(minimalJson);
		const updated = await Effect.runPromise(Package.setName(pkg, "new-name"));
		expect(updated.name).toBe("new-name");
		expect(pkg.name).toBe("my-pkg"); // original unchanged
	});

	it("fails for invalid name", async () => {
		const pkg = decodePackage(minimalJson);
		const exit = await Effect.runPromiseExit(Package.setName(pkg, "INVALID"));
		expect(exit._tag).toBe("Failure");
	});
});

describe("Package.addDependency", () => {
	it("adds a dependency", () => {
		const pkg = decodePackage(minimalJson);
		const updated = Package.addDependency(pkg, "lodash", "^4.0.0");
		expect(updated.hasDependency("lodash")).toBe(true);
		expect(pkg.hasDependency("lodash")).toBe(false); // original unchanged
	});

	it("works as dual API", () => {
		const pkg = decodePackage(minimalJson);
		const updated = Package.addDependency("lodash", "^4.0.0")(pkg);
		expect(updated.hasDependency("lodash")).toBe(true);
	});
});

describe("Package.removeDependency", () => {
	it("removes a dependency", () => {
		const pkg = decodePackage(fullJson);
		const updated = Package.removeDependency(pkg, "lodash");
		expect(updated.hasDependency("lodash")).toBe(false);
	});
});

describe("Package.setScript", () => {
	it("adds or updates a script", () => {
		const pkg = decodePackage(minimalJson);
		const updated = Package.setScript(pkg, "build", "tsc");
		expect(HashMap.get(updated.scripts, "build")._tag).toBe("Some");
	});
});

describe("Package.removeScript", () => {
	it("removes a script", () => {
		const pkg = decodePackage(fullJson);
		const updated = Package.removeScript(pkg, "test");
		expect(HashMap.get(updated.scripts, "test")._tag).toBe("None");
	});
});

describe("Package.setLicense", () => {
	it("sets the license", async () => {
		const pkg = decodePackage(minimalJson);
		const updated = await Effect.runPromise(Package.setLicense(pkg, "MIT"));
		expect(Option.getOrThrow(updated.license)).toBe("MIT");
	});

	it("fails for invalid SPDX", async () => {
		const pkg = decodePackage(minimalJson);
		const exit = await Effect.runPromiseExit(Package.setLicense(pkg, "NOT-A-LICENSE"));
		expect(exit._tag).toBe("Failure");
	});
});

describe("Package.fromData", () => {
	it("creates a Package from custom schema data", () => {
		const CustomSchema = makePackageJsonSchema({
			description: Schema.String, // now required
		});

		const decoded = Schema.decodeUnknownSync(CustomSchema)({
			name: "custom-pkg",
			version: "1.0.0",
			description: "Required description",
		});

		const pkg = Package.fromData(decoded);
		expect(pkg.name).toBe("custom-pkg");
	});

	it("preserves custom fields through the Package", () => {
		const CustomSchema = makePackageJsonSchema({
			customField: Schema.String,
		});

		const decoded = Schema.decodeUnknownSync(CustomSchema)({
			name: "custom-pkg",
			version: "1.0.0",
			customField: "hello",
		});

		const pkg = Package.fromData(decoded);
		expect(pkg.name).toBe("custom-pkg");
		expect((pkg._data as Record<string, unknown>).customField).toBe("hello");
	});
});
