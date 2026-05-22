# Testing

Programs written with this library yield service tags and run with layers. To test them, provide a mock layer for the services you want to control and a real one for the rest. This page covers building mock services with `Layer.succeed`, asserting on typed errors and running integration tests against the real filesystem with `@effect/platform-node`.

## Mocking a service with Layer.succeed

Every service is a `Context.Tag`, so a fake is a `Layer.succeed` that supplies the methods. To test code that resolves dependencies without a real monorepo, hand it a `WorkspaceResolver` and `CatalogResolver` you control.

```typescript
import { Effect, HashMap, Layer, Option, Schema } from "effect";
import { CatalogResolver, Package, WorkspaceResolver } from "package-json-effect";
import { PackageJsonSchema } from "package-json-effect/schema";
import { describe, expect, it } from "vitest";

const FakeWorkspace = Layer.succeed(
  WorkspaceResolver,
  WorkspaceResolver.of({
    versionOf: (name) => Effect.succeed(name === "lib" ? Option.some("1.2.3") : Option.none()),
  }),
);
const FakeCatalog = Layer.succeed(
  CatalogResolver,
  CatalogResolver.of({ rangeOf: () => Effect.succeed(Option.none()) }),
);

describe("resolution", () => {
  it("applies the caret modifier to a resolved workspace version", () => {
    const pkg = Schema.decodeUnknownSync(PackageJsonSchema)({
      name: "p",
      version: "1.0.0",
      dependencies: { lib: "workspace:^" },
    });

    const resolved = Effect.runSync(
      Package.resolve(pkg).pipe(Effect.provide(Layer.mergeAll(FakeWorkspace, FakeCatalog))),
    );

    expect(Option.getOrNull(HashMap.get(resolved.dependencies, "lib"))).toBe("^1.2.3");
  });
});
```

The same approach swaps any service. Provide a fake `PackageJsonValidator` to test how your code reacts to a validation failure, or a fake `PackageJsonReader` to feed a program a known `Package` without touching disk.

## Building a Package without a file

Most domain logic does not need the filesystem at all. Decode a plain object straight into a `Package` with `PackageJsonSchema`, then exercise the getters and mutations directly.

```typescript
import { HashMap, Option, Schema } from "effect";
import { Package } from "package-json-effect";
import { PackageJsonSchema } from "package-json-effect/schema";
import { describe, expect, it } from "vitest";

const decode = (json: Record<string, unknown>) => Schema.decodeUnknownSync(PackageJsonSchema)(json);

describe("Package", () => {
  it("adds a dependency immutably", () => {
    const pkg = decode({ name: "p", version: "1.0.0" });
    const next = Package.addDependency(pkg, "effect", "^3.10.0");

    expect(HashMap.has(next.dependencies, "effect")).toBe(true);
    expect(HashMap.has(pkg.dependencies, "effect")).toBe(false); // original unchanged
  });

  it("reports the scoped flag", () => {
    expect(decode({ name: "@scope/p", version: "1.0.0" }).isScoped).toBe(true);
    expect(decode({ name: "p", version: "1.0.0" }).isScoped).toBe(false);
  });
});
```

`Schema.decodeUnknownSync` throws on a malformed input, which is what you want in a test — a bad fixture should fail loudly.

## Asserting on typed errors

Failures travel through Effect's error channel rather than as thrown exceptions. Run the program with `Effect.runSyncExit` (or `Effect.runPromiseExit` for async work) to get an `Exit`, then pull the failures out of the `Cause`.

```typescript
import { Cause, Chunk, Effect } from "effect";
import { Schema } from "effect";
import { InvalidSpdxLicenseError, Package } from "package-json-effect";
import { PackageJsonSchema } from "package-json-effect/schema";
import { describe, expect, it } from "vitest";

describe("setLicense", () => {
  it("fails with InvalidSpdxLicenseError for a bad identifier", () => {
    const pkg = Schema.decodeUnknownSync(PackageJsonSchema)({ name: "p", version: "1.0.0" });

    const exit = Effect.runSyncExit(Package.setLicense(pkg, "NOT-A-LICENSE"));
    expect(exit._tag).toBe("Failure");

    if (exit._tag === "Failure") {
      const first = Chunk.get(Cause.failures(exit.cause), 0);
      expect(first._tag).toBe("Some");
      if (first._tag === "Some") {
        const err = first.value as InvalidSpdxLicenseError;
        expect(err._tag).toBe("InvalidSpdxLicenseError");
        expect(err.input).toBe("NOT-A-LICENSE");
      }
    }
  });
});
```

`Cause.failures` returns a `Chunk` of the expected (typed) failures. `Chunk.get(failures, 0)` returns an `Option`, so check the `_tag` before reading `.value`. Each error carries its `_tag` for discrimination and its own typed fields — `InvalidSpdxLicenseError` has `input` and `reason`, `PackageJsonValidationError` has a `failures` array, and so on. See [Errors and troubleshooting](./08-errors-and-troubleshooting.md) for the full set.

## Integration tests against the real filesystem

When you do want to exercise the real reader and writer, provide `PackageJsonLive` plus a Node platform layer. `NodeFileSystem.layer` is enough for the reader and writer; `NodeContext.layer` provides the wider platform context if your program needs `Path` or other services too. Point the program at a fixture file and run it.

```typescript
import { NodeContext } from "@effect/platform-node";
import { Effect } from "effect";
import { PackageJsonLive, PackageJsonReader } from "package-json-effect";
import { describe, expect, it } from "vitest";

const readFixture = (path: string) =>
  Effect.gen(function* () {
    const reader = yield* PackageJsonReader;
    return yield* reader.read(path);
  }).pipe(Effect.provide(PackageJsonLive), Effect.provide(NodeContext.layer), Effect.runPromise);

describe("reader integration", () => {
  it("reads name and version from a fixture", async () => {
    const pkg = await readFixture("./__test__/fixtures/minimal.json");
    expect(pkg.name).toBe("minimal-pkg"); // matches the fixture's "name" field
    expect(pkg.version.major).toBe(1);
  });
});
```

For a round-trip test, write to a temp path with the writer, read it back and compare. The writer sorts keys, sorts dependency entries alphabetically and drops empty maps, so the bytes will differ from the input even when the meaning is identical. Assert on the decoded `Package` rather than on a byte-for-byte string match, or on a normalized projection of it.
