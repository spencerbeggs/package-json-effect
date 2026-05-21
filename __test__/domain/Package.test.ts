import { Effect, HashMap, Option, Schema } from "effect";
import { describe, expect, it } from "vitest";
import { Dependency } from "../../src/domain/Dependency.js";
import { DevDependency } from "../../src/domain/DevDependency.js";
import { OptionalDependency } from "../../src/domain/OptionalDependency.js";
import { Package } from "../../src/domain/Package.js";
import { PeerDependency } from "../../src/domain/PeerDependency.js";
import { PackageJsonSchema } from "../../src/schemas/package-json.js";

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
	return Schema.decodeUnknownSync(PackageJsonSchema)(json);
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

	it("fails for invalid SPDX with InvalidSpdxLicenseError", async () => {
		const pkg = decodePackage(minimalJson);
		const exit = await Effect.runPromiseExit(Package.setLicense(pkg, "NOT-A-LICENSE"));
		expect(exit._tag).toBe("Failure");
	});
});

describe("Package.fromData", () => {
	it("round-trips a decoded Package", () => {
		const decoded = Schema.decodeUnknownSync(PackageJsonSchema)({
			name: "custom-pkg",
			version: "1.0.0",
			description: "A package",
		});

		const pkg = Package.fromData(decoded);
		expect(pkg.name).toBe("custom-pkg");
		expect(pkg.version.major).toBe(1);
		expect(Option.getOrNull(pkg.description)).toBe("A package");
	});

	it("preserves unknown fields from rest through fromData", () => {
		const decoded = Schema.decodeUnknownSync(PackageJsonSchema)({
			name: "custom-pkg",
			version: "1.0.0",
			extraField: "hello",
		});

		const pkg = Package.fromData(decoded);
		expect(pkg.name).toBe("custom-pkg");
		// extra fields are captured in rest
		expect((pkg.rest as Record<string, unknown>).extraField).toBe("hello");
	});
});

describe("Package scalar/collection getters", () => {
	const pkg = Schema.decodeUnknownSync(PackageJsonSchema)({
		name: "@scope/pkg",
		version: "2.1.0",
		description: "desc",
		private: true,
		type: "module",
		license: "MIT",
		scripts: { test: "vitest" },
		bin: "./cli.js",
		engines: { node: ">=18" },
	});

	it("exposes typed scalar getters", () => {
		expect(pkg.isPrivate).toBe(true);
		expect(pkg.isScoped).toBe(true);
		expect(pkg.isESM).toBe(true);
		expect(Option.getOrNull(pkg.description)).toBe("desc");
		expect(Option.getOrNull(pkg.license)).toBe("MIT");
	});

	it("exposes bin and engines", () => {
		expect(Option.isSome(pkg.bin)).toBe(true);
		expect(Option.isSome(pkg.engines)).toBe(true);
		const engines = Option.getOrThrow(pkg.engines);
		expect(HashMap.get(engines, "node")._tag).toBe("Some");
	});

	it("exposes scripts as a HashMap", () => {
		expect(HashMap.get(pkg.scripts, "test")._tag).toBe("Some");
	});
});

describe("Package dependency instances", () => {
	const pkg = Schema.decodeUnknownSync(PackageJsonSchema)({
		name: "p",
		version: "1.0.0",
		dependencies: { lodash: "^4.0.0", local: "workspace:*" },
		devDependencies: { vitest: "^1.0.0" },
		peerDependencies: { effect: "^3.0.0" },
		peerDependenciesMeta: { effect: { optional: true } },
		optionalDependencies: { fsevents: "^2.0.0" },
	});

	it("returns Dependency instances from getDependencies()", () => {
		const deps = pkg.getDependencies();
		const lodash = Option.getOrThrow(HashMap.get(deps, "lodash"));
		expect(lodash).toBeInstanceOf(Dependency);
		expect(lodash.specifier).toBe("^4.0.0");
		const local = Option.getOrThrow(HashMap.get(deps, "local"));
		expect(local.isWorkspace).toBe(true);
	});

	it("returns DevDependency instances", () => {
		const dev = Option.getOrThrow(HashMap.get(pkg.getDevDependencies(), "vitest"));
		expect(dev).toBeInstanceOf(DevDependency);
	});

	it("returns PeerDependency with isOptional from meta", () => {
		const peer = Option.getOrThrow(HashMap.get(pkg.getPeerDependencies(), "effect"));
		expect(peer).toBeInstanceOf(PeerDependency);
		expect(peer.isOptional).toBe(true);
	});

	it("returns OptionalDependency instances from getOptionalDependencies()", () => {
		const opt = Option.getOrThrow(HashMap.get(pkg.getOptionalDependencies(), "fsevents"));
		expect(opt).toBeInstanceOf(OptionalDependency);
		expect(opt.specifier).toBe("^2.0.0");
	});
});

describe("Package.pipe", () => {
	const base = Schema.decodeUnknownSync(PackageJsonSchema)({ name: "p", version: "1.0.0" });

	it("pipe form and curried form produce the same result for setVersion", async () => {
		const curried = await Effect.runPromise(Package.setVersion("1.4.0")(base));
		const piped = await Effect.runPromise(base.pipe(Package.setVersion("1.4.0")));
		expect(piped.version.major).toBe(1);
		expect(piped.version.minor).toBe(4);
		expect(piped.version.patch).toBe(0);
		expect(piped.version.major).toBe(curried.version.major);
		expect(piped.version.minor).toBe(curried.version.minor);
		expect(piped.version.patch).toBe(curried.version.patch);
	});

	it("pipe form works for addDependency and returns a Package with the dependency", () => {
		const updated = base.pipe(Package.addDependency("x", "^1.0.0"));
		expect(HashMap.get(updated.dependencies, "x")._tag).toBe("Some");
		expect(updated).toBeInstanceOf(Package);
	});
});

describe("Package mutations", () => {
	const base = Schema.decodeUnknownSync(PackageJsonSchema)({ name: "p", version: "1.0.0" });

	it("adds dev/peer/optional dependencies (curried + data-first)", () => {
		const withDev = Package.addDevDependency("vitest", "^1.0.0")(base);
		expect(HashMap.get(withDev.devDependencies, "vitest")._tag).toBe("Some");
		const withPeer = Package.addPeerDependency(base, "effect", "^3.0.0");
		expect(HashMap.get(withPeer.peerDependencies, "effect")._tag).toBe("Some");
		const withOpt = Package.addOptionalDependency(base, "fsevents", "^2.0.0");
		expect(HashMap.get(withOpt.optionalDependencies, "fsevents")._tag).toBe("Some");
	});

	it("removes dev/peer/optional dependencies", () => {
		const seeded = Package.addDevDependency("vitest", "^1.0.0")(base);
		const removed = Package.removeDevDependency(seeded, "vitest");
		expect(HashMap.get(removed.devDependencies, "vitest")._tag).toBe("None");
	});

	it("setLicense fails with InvalidSpdxLicenseError", () => {
		const exit = Effect.runSyncExit(Package.setLicense(base, "NOT-A-LICENSE"));
		expect(exit._tag).toBe("Failure");
	});

	it("setLicense succeeds for valid SPDX", () => {
		const updated = Effect.runSync(Package.setLicense(base, "MIT"));
		expect(Option.getOrNull(updated.license)).toBe("MIT");
	});
});
