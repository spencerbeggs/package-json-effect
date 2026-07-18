# package-json-effect

> [!CAUTION]
> **This package is deprecated and no longer maintained.**
> All functionality has been migrated to [`@effected/package-json`](https://www.npmjs.com/package/@effected/package-json)
> Source code live in the [Effected monorepo](https://github.com/spencerbeggs/effected).
> No further releases, fixes or security patches will be published here.

[![npm](https://img.shields.io/npm/v/package-json-effect?label=npm&color=cb3837)](https://www.npmjs.com/package/package-json-effect)
[![License: MIT](https://img.shields.io/badge/License-MIT-4caf50.svg)](https://opensource.org/licenses/MIT)

An [Effect](https://effect.website) library for reading, writing, parsing, validating and normalizing `package.json` files. It decodes a file into a typed `Package` model — `version` becomes a `SemVer`, optional fields become `Option`, dependency maps become `HashMap` — and writes it back with consistent key ordering. Reading, formatting, validation and dependency resolution are each a swappable `Layer`, so you keep the parts you want and replace the rest.

## Features

- Typed `Package` model decoded from a `package.json` file: `version` is a `SemVer`, optional fields are `Option`, dependency and script maps are `HashMap`
- Computed getters (`isScoped`, `isESM`, `isPrivate`, `hasDependency`) and a dual-API for immutable mutations (data-first `Package.setVersion(pkg, v)`, curried `Package.setVersion(v)(pkg)` and pipeable `pkg.pipe(Package.setVersion(v))`)
- `Dependency`, `DevDependency`, `PeerDependency` and `OptionalDependency` instances with a protocol taxonomy (`isRange`, `isTag`, `isGit`, `isLocal`, `isWorkspace`, `isCatalog`) that classifies any specifier
- A reader and writer backed by `@effect/platform` FileSystem, with `sort-package-json`-style key ordering and alphabetical dependency sorting applied on write
- Unknown top-level fields preserved through a read/write round-trip, so you never lose tooling config you do not model
- A validator with publish-readiness rules and a `ValidationRule` interface for writing your own
- A `package-json-effect/schema` entry point: extend the model with `.extend()` and rebuild the wire schema with `makePackageJsonSchema` to type custom fields
- `catalog:` and `workspace:` resolution through swappable `CatalogResolver` and `WorkspaceResolver` services

## Install

`effect` and `@effect/platform` are peer dependencies. Install them alongside a platform adapter for your runtime — `@effect/platform-node` for Node.js.

```bash
npm install package-json-effect effect @effect/platform @effect/platform-node
# or
pnpm add package-json-effect effect @effect/platform @effect/platform-node
```

## Quick start

Read a file, inspect it through the typed getters, make an immutable edit and write it back. The program yields the `PackageJsonReader` and `PackageJsonWriter` services and runs with the composite `PackageJsonLive` layer plus a FileSystem layer.

```typescript
import { NodeFileSystem } from "@effect/platform-node";
import { Effect } from "effect";
import { Package, PackageJsonLive, PackageJsonReader, PackageJsonWriter } from "package-json-effect";

const program = Effect.gen(function* () {
  const reader = yield* PackageJsonReader;
  const writer = yield* PackageJsonWriter;

  const pkg = yield* reader.read("./package.json");
  console.log(pkg.name); // the "name" field, a string
  console.log(pkg.version.toString()); // the "version" field as a SemVer, e.g. "1.3.0"
  console.log(pkg.isESM); // true when "type": "module"

  // Mutations return a new Package; the original is untouched.
  const bumped = yield* Package.setVersion(pkg, "1.4.0");
  const withDep = Package.addDependency(bumped, "effect", "^3.10.0");

  yield* writer.write("./package.json", withDep);
});

Effect.runPromise(program.pipe(Effect.provide(PackageJsonLive), Effect.provide(NodeFileSystem.layer)));
```

`PackageJsonLive` provides every service in the library and requires `FileSystem` from `@effect/platform`, which `NodeFileSystem.layer` (or `NodeContext.layer`) supplies.

## Documentation

- [Getting started](./docs/01-getting-started.md) — install, the Effect mental model (Option, HashMap, Layer) and providing PackageJsonLive with a FileSystem layer
- [Reading and writing](./docs/02-reading-and-writing.md) — the reader and writer, formatter key ordering, the transformer and round-trip fidelity for unmodeled fields
- [The Package model](./docs/03-package-model.md) — computed getters, the Dependency instances and protocol taxonomy, and the dual-API for immutable mutations
- [Validation](./docs/04-validation.md) — the default rules, publish-readiness rules, writing a ValidationRule and building a validator layer
- [Extending the schema](./docs/05-extending-the-schema.md) — adding custom fields with .extend() and makePackageJsonSchema via the package-json-effect/schema entry point
- [Catalog and workspace resolution](./docs/06-catalog-workspace-resolution.md) — the no-op default, providing a real resolver, modifier semantics and resolution on read versus write
- [Testing](./docs/07-testing.md) — mock layers with Layer.succeed, asserting on typed errors and integration tests against the real filesystem
- [Errors and troubleshooting](./docs/08-errors-and-troubleshooting.md) — every error type, what triggers it and how to handle it

## License

[MIT](LICENSE)
