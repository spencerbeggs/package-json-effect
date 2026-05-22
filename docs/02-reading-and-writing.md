# Reading and writing

`PackageJsonReader` turns a file on disk into a typed `Package`. `PackageJsonWriter` turns a `Package` back into a file. The library decodes JSON against a schema, applies key ordering and dependency sorting, and preserves any top-level fields it does not model.

## Reading a file

`PackageJsonReader` exposes a single method, `read(source)`, where `source` is a path. It checks the file exists, reads it, parses the JSON and decodes the result into a `Package`. Each step has its own typed error so you can tell a missing file from a parse failure from a schema mismatch.

```typescript
import { NodeFileSystem } from "@effect/platform-node";
import { Effect, HashMap, Option } from "effect";
import { PackageJsonLive, PackageJsonReader } from "package-json-effect";

const program = Effect.gen(function* () {
  const reader = yield* PackageJsonReader;
  const pkg = yield* reader.read("./package.json");

  console.log(pkg.name); // the "name" field
  console.log(HashMap.size(pkg.dependencies)); // count of runtime dependencies
  console.log(Option.getOrNull(pkg.license)); // the "license" field, or null when absent

  return pkg;
});

Effect.runPromise(program.pipe(Effect.provide(PackageJsonLive), Effect.provide(NodeFileSystem.layer)));
```

The reader's error channel is `PackageJsonReadError | PackageJsonNotFoundError | PackageJsonParseError | PackageJsonDecodeError`. See [Errors and troubleshooting](./08-errors-and-troubleshooting.md) for what each one means and how to handle it.

## Writing a file

`PackageJsonWriter` exposes `write(target, pkg)`. It resolves `catalog:` and `workspace:` specifiers (a no-op unless you provide a real resolver — see [Catalog and workspace resolution](./06-catalog-workspace-resolution.md)), encodes the `Package` back to a plain object, runs the transformer, sorts the keys and writes the file with a trailing newline.

```typescript
import { NodeFileSystem } from "@effect/platform-node";
import { Effect } from "effect";
import { Package, PackageJsonLive, PackageJsonReader, PackageJsonWriter } from "package-json-effect";

const program = Effect.gen(function* () {
  const reader = yield* PackageJsonReader;
  const writer = yield* PackageJsonWriter;

  const pkg = yield* reader.read("./package.json");
  const next = Package.setScript(pkg, "build", "tsc");

  yield* writer.write("./package.json", next);
});

Effect.runPromise(program.pipe(Effect.provide(PackageJsonLive), Effect.provide(NodeFileSystem.layer)));
```

The writer's only error is `PackageJsonWriteError`, which wraps any failure during resolution, encoding or the filesystem write.

## Key ordering

`PackageJsonFormatter` sorts keys before serialization. Known fields follow a fixed list that matches the conventional `package.json` layout — `name`, `version`, `private`, `description`, `keywords`, then metadata, entry points, scripts, the four dependency maps, `engines`, `publishConfig` and so on. Fields not in the list are appended afterwards in alphabetical order, so unfamiliar tooling keys land in a predictable place rather than wherever they happened to be.

Inside each dependency map (`dependencies`, `devDependencies`, `peerDependencies`, `optionalDependencies`, `bundleDependencies`) the entries are sorted alphabetically by package name. The output matches what tools like `sort-package-json` produce, so a write does not churn the diff for unrelated reasons.

## The transformer

Before formatting, `PackageJsonTransformer` runs over the encoded object. The default implementation removes empty dependency maps — if you remove the last entry from `devDependencies`, the field is dropped from the file rather than written as `{}`.

The transformer is its own service, so you can replace it to add steps of your own (stripping a private field before publish, normalizing a custom block) without touching the reader, writer or formatter. Provide your own `PackageJsonTransformer` layer instead of the default.

## Round-trip fidelity

`Package` models the standard fields it knows about. Anything else — a `keywords` array, a `funding` URL, a tool's config block like `prettier` or `release` — is captured in a `rest` record and carried through unchanged. On write, those fields are flattened back to the top level, so a read followed by a write preserves the file's full content.

```typescript
import { Effect, HashMap } from "effect";
import { NodeFileSystem } from "@effect/platform-node";
import { Package, PackageJsonLive, PackageJsonReader, PackageJsonWriter } from "package-json-effect";

const program = Effect.gen(function* () {
  const reader = yield* PackageJsonReader;
  const writer = yield* PackageJsonWriter;

  const pkg = yield* reader.read("./package.json");

  // "keywords", "homepage" and any unmodeled tooling config live in pkg.rest
  // and are written back untouched. Edits only change what you change:
  const next = Package.addDependency(pkg, "effect", "^3.10.0");
  console.log(HashMap.has(next.dependencies, "effect")); // true

  yield* writer.write("./package.json", next);
});

Effect.runPromise(program.pipe(Effect.provide(PackageJsonLive), Effect.provide(NodeFileSystem.layer)));
```

You can read `pkg.rest` directly to access an unmodeled field. It is a `Record<string, unknown>`, so narrow the value before using it. To add a typed getter for a field you care about, see [Extending the schema](./05-extending-the-schema.md).
