# package-json-effect

Effect-TS library for reading, writing, parsing, and manipulating package.json files.

## Features

- Typed schemas for all standard package.json fields, with branded types for package names, versions, and SPDX licenses
- `Package` domain class with property getters and dual-API mutation methods (data-first and pipeable)
- Swappable services for reading, writing, formatting, transforming, and validating — swap any step without touching the others
- `sort-package-json`-style key ordering and alphabetical dependency sorting on write
- `makePackageJsonSchema` factory for adding custom field schemas while preserving all standard fields
- SemVer integration via `semver-effect` — the `version` field decodes to a typed `SemVer` instance

## Installation

```bash
npm install package-json-effect
```

Peer dependencies required:

```bash
npm install effect @effect/platform
```

## Quick Start

```typescript
import { PackageJsonLive, PackageJsonReader, PackageJsonWriter, Package } from "package-json-effect";
import { NodeFileSystem } from "@effect/platform-node";
import { Effect } from "effect";

const program = Effect.gen(function* () {
 const reader = yield* PackageJsonReader;
 const writer = yield* PackageJsonWriter;

 const pkg = yield* reader.read("./package.json");
 console.log(pkg.name, pkg.version.toString(), pkg.isESM);

 const updated = yield* pkg.pipe(Package.setVersion("1.2.0"));
 yield* writer.write("./package.json", updated);
});

Effect.runPromise(
 program.pipe(
  Effect.provide(PackageJsonLive),
  Effect.provide(NodeFileSystem.layer),
 ),
);
```

## Package class

Property getters:

```typescript
pkg.name          // string
pkg.version       // SemVer (from semver-effect)
pkg.isScoped      // boolean — true if name starts with @
pkg.isESM         // boolean — true if "type": "module"
pkg.isPrivate     // boolean
pkg.hasDependency("effect")  // boolean — checks all four dep maps
```

Mutation methods (data-first and pipeable):

```typescript
// Data-first
const v1 = yield* Package.setVersion(pkg, "2.0.0");
const v2 = Package.addDependency(pkg, "zod", "^3.0.0");

// Pipeable
const v3 = yield* pkg.pipe(Package.setVersion("2.0.0"));
const v4 = pkg.pipe(Package.addDependency("zod", "^3.0.0"));
```

Available mutation methods: `setVersion`, `setName`, `setLicense`, `addDependency`, `removeDependency`, `setScript`, `removeScript`.

## Schema extensibility

Add custom fields while keeping all standard package.json types:

```typescript
import { makePackageJsonSchema } from "package-json-effect";
import { Schema } from "effect";

const MySchema = makePackageJsonSchema({
 myToolConfig: Schema.optionalWith(Schema.String, { as: "Option" }),
});
```

## Services

| Service | Description |
| ------- | ----------- |
| `PackageJsonReader` | Read and decode a package.json file into a `Package` |
| `PackageJsonWriter` | Encode and write a `Package` back to disk |
| `PackageJsonFormatter` | Sort keys and dependency entries before serialization |
| `PackageJsonTransformer` | Strip empty dependency maps before formatting |
| `PackageJsonValidator` | Run validation rules against a `Package` |
| `CatalogResolver` | Resolve `catalog:` protocol specifiers (no-op by default) |
| `WorkspaceResolver` | Resolve `workspace:` protocol specifiers (no-op by default) |

`PackageJsonLive` is a composite layer that provides all seven services. It requires `FileSystem` from `@effect/platform`.

Custom validation rules:

```typescript
import { makePackageJsonValidatorLive } from "package-json-effect";

const MyValidatorLive = makePackageJsonValidatorLive({
 rules: [
  {
   name: "has-keywords",
   validate: (pkg) =>
    pkg._data.keywords ? Effect.void : Effect.fail({ message: "Missing keywords" }),
  },
 ],
});
```

## License

[MIT](./LICENSE)
