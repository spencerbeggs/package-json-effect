# Errors and troubleshooting

Every failure in this library is a tagged error on Effect's error channel, not a thrown exception. Each carries a `_tag` for discrimination and its own typed fields. This page lists every error, what raises it and how to handle it, then covers common questions.

## Error reference

| Error | `_tag` | Raised by | Key fields |
| ----- | ------ | --------- | ---------- |
| `PackageJsonReadError` | `PackageJsonReadError` | Reader, when the filesystem read fails | `source`, `cause` |
| `PackageJsonNotFoundError` | `PackageJsonNotFoundError` | Reader, when the file does not exist | `source` |
| `PackageJsonParseError` | `PackageJsonParseError` | Reader, when the content is not valid JSON | `input`, `position` |
| `PackageJsonDecodeError` | `PackageJsonDecodeError` | Reader, when valid JSON does not match the schema | `input`, `message` |
| `PackageJsonWriteError` | `PackageJsonWriteError` | Writer, on any resolution, encode or write failure | `target`, `cause` |
| `PackageJsonValidationError` | `PackageJsonValidationError` | Validator, when one or more rules fail | `failures` |
| `InvalidSpdxLicenseError` | `InvalidSpdxLicenseError` | `Package.setLicense`, on a bad SPDX value | `input`, `reason` |
| `InvalidPackageNameError` | `InvalidPackageNameError` | `Package.setName`, on a bad name | `input`, `reason` |
| `InvalidDependencySpecifierError` | `InvalidDependencySpecifierError` | `decodeSpecifier`, on a string that is not a valid specifier | `input`, `reason` |
| `DependencyResolutionError` | `DependencyResolutionError` | A resolver, when resolution itself errors | `packageName`, `specifier`, `reason` |

`Package.setVersion` fails with `InvalidVersionError`, which comes from `semver-effect` rather than this library.

## Handling errors by tag

`Effect.catchTag` handles one error type and leaves the rest on the channel, so you can recover from a missing file while letting a genuine read failure propagate.

```typescript
import { NodeFileSystem } from "@effect/platform-node";
import { Effect } from "effect";
import { PackageJsonLive, PackageJsonReader } from "package-json-effect";

const program = Effect.gen(function* () {
  const reader = yield* PackageJsonReader;
  return yield* reader.read("./package.json");
}).pipe(
  Effect.catchTag("PackageJsonNotFoundError", (e) =>
    Effect.logWarning(`No package.json at ${e.source}; using defaults`).pipe(Effect.as(null)),
  ),
  Effect.catchTag("PackageJsonParseError", (e) => Effect.logError(`Malformed JSON: ${e.message}`).pipe(Effect.as(null))),
);

Effect.runPromise(program.pipe(Effect.provide(PackageJsonLive), Effect.provide(NodeFileSystem.layer)));
```

The reader's full error channel is `PackageJsonReadError | PackageJsonNotFoundError | PackageJsonParseError | PackageJsonDecodeError`. Handle the ones you can recover from; the rest stay typed all the way to your `Effect.run*` call.

## Reading a validation failure

`PackageJsonValidationError` collects every rule that failed into a `failures` array. Each entry has a `rule`, a `message` and an `Option<string>` path. The error's `message` getter renders them into one block.

```typescript
import { Cause, Chunk, Effect, Option, Schema } from "effect";
import {
  PackageJsonValidationError,
  PackageJsonValidator,
  PackageJsonValidatorLive,
} from "package-json-effect";
import { PackageJsonSchema } from "package-json-effect/schema";

const pkg = Schema.decodeUnknownSync(PackageJsonSchema)({ name: "p", version: "1.0.0" });

const exit = Effect.runSyncExit(
  Effect.gen(function* () {
    const v = yield* PackageJsonValidator;
    return yield* v.validate(pkg);
  }).pipe(Effect.provide(PackageJsonValidatorLive)),
);

if (exit._tag === "Failure") {
  const first = Chunk.get(Cause.failures(exit.cause), 0);
  if (first._tag === "Some") {
    const err = first.value as PackageJsonValidationError;
    for (const f of err.failures) {
      console.log(`[${f.rule}] ${f.message} ${Option.getOrNull(f.path) ?? ""}`);
    }
    // [has-license] Missing license field license
    // [has-description] Missing description field description
  }
}
```

## Common questions

### My program will not type-check: it says FileSystem is still required

`PackageJsonLive` provides every service in the library but not the `FileSystem` underneath the reader and writer. Provide a platform layer alongside it — `NodeFileSystem.layer` or `NodeContext.layer` — and the requirement is satisfied. A program missing the platform layer shows `FileSystem` left in its requirements channel.

### My workspace: and catalog: specifiers are not being resolved

The default resolvers are no-ops, by design. `Package.resolve` and the writer's publish-prep step leave `workspace:` and `catalog:` untouched until you provide a real `WorkspaceResolver` and `CatalogResolver`. See [Catalog and workspace resolution](./06-catalog-workspace-resolution.md) for how to wire them in. To catch unresolved specifiers before publish rather than resolving them, add `noUnresolvedDepsRule` to your validator.

### A field I rely on is gone after writing

The writer strips empty dependency maps and sorts keys, so the output is normalized rather than byte-identical to the input. Fields you did not model are preserved through `pkg.rest` and written back, but their position in the file follows the formatter's ordering. If a field genuinely disappeared, it was likely an empty dependency map (`"devDependencies": {}`), which the transformer removes on purpose. To keep a field at a fixed position or to type it, promote it with [`.extend()`](./05-extending-the-schema.md).

### setVersion, setName and setLicense return an Effect, not a Package

These three validate their input and can fail, so they live on the error channel. `addDependency`, `setScript` and the other non-failing mutations return a `Package` directly. Run the failing ones with `yield*` inside an `Effect.gen`, or with `Effect.runSync`/`Effect.runSyncExit` at the edge — see [The Package model](./03-package-model.md#immutable-mutations).

### My round-trip test fails on a string comparison

Compare decoded `Package` values, not raw file bytes. The writer sorts keys, sorts dependency entries alphabetically and drops empty maps, so a write of unchanged content still produces different bytes from the original. Read the written file back and assert on the resulting `Package`, or on a normalized projection of it.
