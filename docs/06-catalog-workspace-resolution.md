# Catalog and workspace resolution

Inside a monorepo, a `package.json` often depends on a sibling with `workspace:^` or pulls a shared range from a `catalog:`. Those specifiers are meaningful to the package manager but not to a consumer installing from npm. This library resolves them through two services — `WorkspaceResolver` and `CatalogResolver` — that you provide. The defaults resolve nothing, so the protocols pass through untouched until you wire in real implementations.

## The two services

- `WorkspaceResolver` has one method, `versionOf(packageName)`, returning an `Effect<Option<string>>` — the concrete version of a workspace package, without a range modifier, or `None` when it cannot resolve the name.
- `CatalogResolver` has one method, `rangeOf(packageName, catalog)`, returning an `Effect<Option<string>>` — the range a catalog entry maps to, or `None`. The `catalog` argument is an `Option<string>`: `None` for the default catalog, `Some("name")` for a named catalog like `catalog:react17`.

Both can fail with `DependencyResolutionError` if resolution itself errors.

## The no-op default

`WorkspaceResolverLive` and `CatalogResolverLive` — the implementations inside `PackageJsonLive` — return `Option.none()` for every lookup. `Package.resolve` and the publish-prep step on write therefore leave `workspace:` and `catalog:` specifiers exactly as written.

```typescript
import { Effect, HashMap, Layer, Option, Schema } from "effect";
import { CatalogResolverLive, Package, WorkspaceResolverLive } from "package-json-effect";
import { PackageJsonSchema } from "package-json-effect/schema";

const pkg = Schema.decodeUnknownSync(PackageJsonSchema)({
  name: "p",
  version: "1.0.0",
  dependencies: { lib: "workspace:*" },
});

const resolved = Effect.runSync(
  Package.resolve(pkg).pipe(Effect.provide(Layer.mergeAll(WorkspaceResolverLive, CatalogResolverLive))),
);
console.log(Option.getOrNull(HashMap.get(resolved.dependencies, "lib"))); // "workspace:*" — unchanged
```

The no-op default is deliberate: a library that does not understand your monorepo layout will not rewrite specifiers it cannot verify.

## Providing a real resolver

A resolver is a `Context.Tag` like every other service, so you build one with `Layer.succeed` and supply the lookups. Back it with whatever knows your workspace versions and catalog entries — a sibling library, a parsed lockfile, a config file you load yourself.

```typescript
import { Effect, HashMap, Layer, Option, Schema } from "effect";
import { CatalogResolver, Package, WorkspaceResolver } from "package-json-effect";
import { PackageJsonSchema } from "package-json-effect/schema";

const MyWorkspace = Layer.succeed(
  WorkspaceResolver,
  WorkspaceResolver.of({
    versionOf: (name) => Effect.succeed(name === "lib" ? Option.some("1.2.3") : Option.none()),
  }),
);

const MyCatalog = Layer.succeed(
  CatalogResolver,
  CatalogResolver.of({
    rangeOf: (name, _catalog) => Effect.succeed(name === "effect" ? Option.some("^3.10.0") : Option.none()),
  }),
);

const pkg = Schema.decodeUnknownSync(PackageJsonSchema)({
  name: "p",
  version: "1.0.0",
  dependencies: { lib: "workspace:^", effect: "catalog:", lodash: "^4.0.0" },
});

const resolved = Effect.runSync(
  Package.resolve(pkg).pipe(Effect.provide(Layer.mergeAll(MyWorkspace, MyCatalog))),
);
console.log(Option.getOrNull(HashMap.get(resolved.dependencies, "lib"))); // "^1.2.3"
console.log(Option.getOrNull(HashMap.get(resolved.dependencies, "effect"))); // "^3.10.0"
console.log(Option.getOrNull(HashMap.get(resolved.dependencies, "lodash"))); // "^4.0.0" — left alone
```

A specifier the resolver returns `None` for is left unchanged, so a partial resolver only rewrites what it knows.

## Workspace modifier semantics

A `workspace:` specifier carries a modifier that says what range to produce around the resolved version. `Package.resolve` applies it for you:

| Specifier | Resolved (version `1.2.3`) |
| --------- | -------------------------- |
| `workspace:*` | `1.2.3` (exact) |
| `workspace:` | `1.2.3` (exact) |
| `workspace:^` | `^1.2.3` |
| `workspace:~` | `~1.2.3` |
| `workspace:2.5.0` | `2.5.0` (explicit range passes through) |

The `WorkspaceResolver` returns the bare version; the modifier from the specifier decides the final form. An explicit range like `workspace:^1.0.0` passes through as-is rather than being recombined with the resolved version.

A `catalog:` specifier has no modifier — `CatalogResolver.rangeOf` returns the full range to substitute, and that range is used verbatim.

## Resolution on read versus on write

Reading a file never resolves anything. `PackageJsonReader.read` decodes the specifiers exactly as written, so `workspace:^` stays `workspace:^` in the resulting `Package`. That keeps the in-memory model faithful to the source file.

Resolution happens on the way out. `PackageJsonWriter.write` runs `Package.resolve` as a publish-prep step before encoding, using whichever `CatalogResolver` and `WorkspaceResolver` are in context. With the no-op defaults that step is a pass-through; with real resolvers provided, the file written to disk has concrete ranges in place of the protocols.

You can also call `Package.resolve` yourself at any point — it is a static method returning an `Effect` that requires `WorkspaceResolver` and `CatalogResolver` in context — when you want a resolved `Package` without writing it. To catch unresolved specifiers before publish instead of resolving them, use `noUnresolvedDepsRule` from [Validation](./04-validation.md).
