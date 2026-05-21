import { Effect, HashMap, Layer, Option, Schema } from "effect";
import { describe, expect, it } from "vitest";
import { Package } from "../../src/domain/Package.js";
import { CatalogResolverLive } from "../../src/layers/CatalogResolverLive.js";
import { WorkspaceResolverLive } from "../../src/layers/WorkspaceResolverLive.js";
import { PackageJsonSchema } from "../../src/schemas/package-json.js";
import { CatalogResolver } from "../../src/services/CatalogResolver.js";
import { WorkspaceResolver } from "../../src/services/WorkspaceResolver.js";

const FakeWorkspace = Layer.succeed(
	WorkspaceResolver,
	WorkspaceResolver.of({ versionOf: (name) => Effect.succeed(name === "lib" ? Option.some("1.2.3") : Option.none()) }),
);
const FakeCatalog = Layer.succeed(
	CatalogResolver,
	CatalogResolver.of({ rangeOf: (name) => Effect.succeed(name === "effect" ? Option.some("^3.10.0") : Option.none()) }),
);
const FakeWorkspaceAll = Layer.succeed(
	WorkspaceResolver,
	WorkspaceResolver.of({ versionOf: () => Effect.succeed(Option.some("1.2.3")) }),
);
const FakeCatalogNamed = Layer.succeed(
	CatalogResolver,
	CatalogResolver.of({
		rangeOf: (_name, catalog) =>
			Effect.succeed(Option.getOrElse(catalog, () => "") === "react17" ? Option.some("^17.0.0") : Option.none()),
	}),
);

const pkgWith = (deps: Record<string, string>): Package =>
	Schema.decodeUnknownSync(PackageJsonSchema)({ name: "p", version: "1.0.0", dependencies: deps });

describe("Package.resolve", () => {
	it("rewrites workspace: and catalog: via the provided resolvers", () => {
		const pkg = pkgWith({ lib: "workspace:^", effect: "catalog:", lodash: "^4.0.0" });
		const resolved = Effect.runSync(
			Package.resolve(pkg).pipe(Effect.provide(Layer.mergeAll(FakeWorkspace, FakeCatalog))),
		);
		expect(Option.getOrNull(HashMap.get(resolved.dependencies, "lib"))).toBe("^1.2.3");
		expect(Option.getOrNull(HashMap.get(resolved.dependencies, "effect"))).toBe("^3.10.0");
		expect(Option.getOrNull(HashMap.get(resolved.dependencies, "lodash"))).toBe("^4.0.0");
	});

	it("leaves specifiers untouched with the no-op default layers", () => {
		const pkg = pkgWith({ lib: "workspace:*" });
		const resolved = Effect.runSync(
			Package.resolve(pkg).pipe(Effect.provide(Layer.mergeAll(WorkspaceResolverLive, CatalogResolverLive))),
		);
		expect(Option.getOrNull(HashMap.get(resolved.dependencies, "lib"))).toBe("workspace:*");
	});

	it("applies all workspace: modifier forms", () => {
		const pkg = pkgWith({
			star: "workspace:*",
			tilde: "workspace:~",
			caret: "workspace:^",
			explicit: "workspace:2.5.0",
		});
		const resolved = Effect.runSync(
			Package.resolve(pkg).pipe(Effect.provide(Layer.mergeAll(FakeWorkspaceAll, CatalogResolverLive))),
		);
		expect(Option.getOrNull(HashMap.get(resolved.dependencies, "star"))).toBe("1.2.3");
		expect(Option.getOrNull(HashMap.get(resolved.dependencies, "tilde"))).toBe("~1.2.3");
		expect(Option.getOrNull(HashMap.get(resolved.dependencies, "caret"))).toBe("^1.2.3");
		expect(Option.getOrNull(HashMap.get(resolved.dependencies, "explicit"))).toBe("2.5.0");
	});

	it("resolves a named catalog", () => {
		const pkg = pkgWith({ react: "catalog:react17" });
		const resolved = Effect.runSync(
			Package.resolve(pkg).pipe(Effect.provide(Layer.mergeAll(WorkspaceResolverLive, FakeCatalogNamed))),
		);
		expect(Option.getOrNull(HashMap.get(resolved.dependencies, "react"))).toBe("^17.0.0");
	});
});
