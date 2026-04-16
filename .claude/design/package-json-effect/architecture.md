---
status: current
module: package-json-effect
category: architecture
created: 2026-04-16
updated: 2026-04-16
last-synced: 2026-04-16
completeness: 88
related:
  - .claude/design/package-json-effect/package-json-spec-reference.md
  - .claude/design/package-json-effect/schema-patterns-reference.md
dependencies: []
---

# Package JSON Effect - Architecture

Effect-TS library providing schemas, services, and layers for reading, writing, parsing, manipulating and transforming package.json data.

## Table of Contents

1. [Overview](#overview)
2. [Current State](#current-state)
3. [Rationale](#rationale)
4. [System Architecture](#system-architecture)
5. [Data Flow](#data-flow)
6. [Integration Points](#integration-points)
7. [Testing Strategy](#testing-strategy)
8. [Future Enhancements](#future-enhancements)
9. [Related Documentation](#related-documentation)

---

## Overview

package-json-effect provides a typed, Effect-native way to work with package.json files. The npm package.json format has many quirks, optional fields with complex semantics, and evolving conventions (exports maps, engines, publishConfig, etc.). This library models the full package.json structure as Effect Schemas with branded types for domain concepts, and exposes services for reading/writing package.json files from the filesystem via @effect/platform IO abstractions.

**Key Design Principles:**

- Schema-first: All package.json structures are modeled as Effect Schema types with proper validation
- Platform-agnostic IO: Users provide their own @effect/platform implementation (Node, Bun, browser)
- Composable: Services and layers follow the standard Effect composition patterns used across the @spencerbeggs ecosystem
- Dual-API mutation: The `Package` domain class exposes static methods with both data-first and data-last (pipeable) calling conventions
- Open record preservation: The top-level `PackageJsonSchema` uses an index signature so round-tripping never loses unknown fields

**When to reference this document:**

- When adding new package.json field schemas
- When modifying the service or layer architecture
- When integrating with sister libraries (workspaces-effect, semver-effect)
- When designing the public API surface

---

## Current State

### Implementation Summary (MVP — feat/implementation)

The MVP is fully implemented across 24 commits. All source lives under `src/` in four subdirectories: `schemas/`, `errors/`, `domain/`, `services/`, and `layers/`. Tests are in `__test__/` with 165 tests (143 unit, 22 integration).

### Schemas (`src/schemas/`)

| File | Export | Description |
| ---- | ------ | ----------- |
| `name.ts` | `PackageName`, `ScopedPackageName`, `UnscopedPackageName` | Branded union; validates npm naming rules |
| `license.ts` | `SpdxLicense` | Branded string; uses `spdx-expression-parse` for validation; also accepts `"UNLICENSED"` and `"SEE LICENSE IN ..."` |
| `dependency-specifier.ts` | `DependencySpecifier` | Branded string for dependency version specifiers |
| `version.ts` | `VersionSchema` | `Schema.transformOrFail` string → `SemVer` (via `semver-effect`) |
| `dependency-map.ts` | `DependencyMapSchema` | `Schema.transform` plain object → `HashMap<string, string>` |
| `scripts.ts` | `ScriptsSchema` | `HashMap<string, string>` transform |
| `bin.ts` | `BinSchema` | Binary field (string or record) |
| `engines.ts` | `EnginesSchema` | Engines constraint record |
| `person.ts` | `Person` (Schema.Class), `PersonSchema` | Parses both string shorthand `"Name <email> (url)"` and object form |
| `package-manager.ts` | `PackageManager` (Schema.Class), `PackageManagerSchema` | Parses `"name@version+integrity"` string |
| `dev-engines.ts` | `DevEngine` (Schema.Class), `DevEnginesSchema` | `DevEngine` with `name`, optional `version` and `onFail`; supports single or array form |
| `publish-config.ts` | `PublishConfigSchema` | Open `Schema.Record` preserving arbitrary publish config keys |
| `exports-field.ts` | `ExportsFieldSchema` | String or object union for the `exports` field |
| `package-json.ts` | `PackageJsonSchema`, `makePackageJsonSchema`, `defaultFields` | Open-record struct with typed known fields; `makePackageJsonSchema` factory for custom field overrides |

### Errors (`src/errors/`)

All errors are `Data.TaggedError` subclasses. The base constant is exported alongside the class to satisfy TypeScript declaration bundling.

| Class | `_tag` | Payload |
| ----- | ------ | ------- |
| `InvalidPackageNameError` | `"InvalidPackageNameError"` | `{ input, reason }` |
| `InvalidDependencySpecifierError` | `"InvalidDependencySpecifierError"` | `{ input, reason }` |
| `PackageJsonParseError` | `"PackageJsonParseError"` | `{ source, cause }` |
| `PackageJsonDecodeError` | `"PackageJsonDecodeError"` | `{ source, cause }` |
| `PackageJsonReadError` | `"PackageJsonReadError"` | `{ source, cause }` |
| `PackageJsonWriteError` | `"PackageJsonWriteError"` | `{ target, cause }` |
| `PackageJsonNotFoundError` | `"PackageJsonNotFoundError"` | `{ source }` |
| `PackageJsonValidationError` | `"PackageJsonValidationError"` | `{ failures: ValidationRuleFailure[] }` |

`PackageJsonValidationError` also carries a computed `message` getter that formats all rule failures.

### Domain (`src/domain/`)

| File | Export | Description |
| ---- | ------ | ----------- |
| `Package.ts` | `Package` | Wraps decoded `PackageJsonSchemaType`; property getters; 7 static dual-API mutation methods; `fromData` factory |
| `PackageName.ts` | `PackageNameUtil` | Utility object: `scope()`, `unscoped()`, `isScoped()` |
| `Dependency.ts` | `Dependency` | `Schema.TaggedClass`; getters `isLocal`, `isGit`, `isRange`, `isTag` |
| `DevDependency.ts` | `DevDependency` | Same shape as `Dependency`, tagged `"DevDependency"` |
| `PeerDependency.ts` | `PeerDependency` | Same shape as `Dependency`, tagged `"PeerDependency"` |
| `OptionalDependency.ts` | `OptionalDependency` | Same shape as `Dependency`, tagged `"OptionalDependency"` |

**`Package` static mutation methods** (all use `effect/Function dual`):

- `setVersion(pkg, version)` — validates via `semver-effect`, returns `Effect<Package, InvalidVersionError>`
- `setName(pkg, name)` — validates npm name rules, returns `Effect<Package, InvalidPackageNameError>`
- `setLicense(pkg, license)` — validates SPDX, returns `Effect<Package, Error>`
- `addDependency(pkg, name, specifier)` — pure, returns `Package`
- `removeDependency(pkg, name)` — pure, returns `Package`
- `setScript(pkg, name, command)` — pure, returns `Package`
- `removeScript(pkg, name)` — pure, returns `Package`

### Services (`src/services/`)

| Class | Tag | Interface |
| ----- | --- | --------- |
| `PackageJsonReader` | `"package-json-effect/PackageJsonReader"` | `read(source: string): Effect<Package, ...>` |
| `PackageJsonWriter` | `"package-json-effect/PackageJsonWriter"` | `write(target: string, pkg: Package): Effect<void, PackageJsonWriteError>` |
| `PackageJsonFormatter` | `"package-json-effect/PackageJsonFormatter"` | `format(raw: Record<string, unknown>): Record<string, unknown>` |
| `PackageJsonValidator` | `"package-json-effect/PackageJsonValidator"` | `validate(pkg: Package): Effect<Package, PackageJsonValidationError>` |
| `CatalogResolver` | `"package-json-effect/CatalogResolver"` | `resolve(raw): Effect<Record<string, unknown>>` |
| `WorkspaceResolver` | `"package-json-effect/WorkspaceResolver"` | `resolve(raw): Effect<Record<string, unknown>>` |
| `PackageJsonTransformer` | `"package-json-effect/PackageJsonTransformer"` | `transform(raw): Effect<Record<string, unknown>>` |

### Layers (`src/layers/`)

| Layer | Requires | Notes |
| ----- | -------- | ----- |
| `PackageJsonReaderLive` | `FileSystem.FileSystem` | Read → JSON.parse → Schema.decode → Package |
| `PackageJsonWriterLive` | `FileSystem`, `Formatter`, `CatalogResolver`, `WorkspaceResolver`, `Transformer` | Full write pipeline |
| `PackageJsonFormatterLive` | — | Sorts keys by opinionated order; sorts deps alphabetically |
| `PackageJsonValidatorLive` | — | Runs `hasLicense` and `hasDescription` rules; `makePackageJsonValidatorLive(config)` for custom rules |
| `PackageJsonTransformerLive` | — | Strips empty dependency maps before serialisation |
| `CatalogResolverLive` | — | No-op passthrough |
| `WorkspaceResolverLive` | — | No-op passthrough |
| `PackageJsonLive` | `FileSystem.FileSystem` | Composite; provides all 7 services |

---

## Rationale

### Architectural Decisions

#### Decision 1: Effect Schema for package.json modeling

**Context:** Need a typed representation of package.json that validates at runtime.

**Options considered:**

1. **Effect Schema (Chosen):**
   - Pros: Integrated with Effect ecosystem, branded types, encode/decode, composable
   - Cons: Learning curve for contributors outside Effect
   - Why chosen: Consistent with all sister libraries; provides validation + type safety in one system

2. **Zod + manual types:**
   - Pros: Wider adoption, simpler API
   - Cons: No Effect integration, separate type/validation layers
   - Why rejected: Inconsistent with ecosystem; would need bridging layer

#### Decision 2: Platform-agnostic IO via @effect/platform

**Context:** Need to read/write package.json files from disk.

**Options considered:**

1. **@effect/platform services (Chosen):**
   - Pros: Users bring their own platform, testable with mock layers, consistent with ecosystem
   - Cons: Additional peer dependency
   - Why chosen: Standard pattern across all @spencerbeggs Effect libraries

2. **Direct Node.js fs:**
   - Pros: Simpler, no extra dependency
   - Cons: Not platform-agnostic, harder to test
   - Why rejected: Breaks Effect abstraction model

#### Decision 3: Dual-API static methods on Package

**Context:** Mutation operations like `setVersion` need to work in both pipeline and direct-call style.

**Options considered:**

1. **`effect/Function dual` (Chosen):**
   - Pros: One definition covers both calling conventions; no code duplication
   - Cons: Slightly more complex type signatures
   - Why chosen: Same pattern as Effect core and semver-effect; ergonomic for both styles

2. **Separate pipeable and non-pipeable variants:**
   - Pros: Simpler types
   - Cons: Duplication; inconsistent with ecosystem patterns
   - Why rejected: Unnecessary overhead

#### Decision 4: Writer pipeline architecture

**Context:** Writing a package.json involves several discrete post-processing steps.

**Decision:** The write path is staged as a pipeline of composable steps:

1. `Schema.encode` → raw JSON object
2. `CatalogResolver.resolve` — resolves `catalog:` protocol specifiers
3. `WorkspaceResolver.resolve` — resolves `workspace:` protocol specifiers
4. `PackageJsonTransformer.transform` — strips empty dependency maps
5. `PackageJsonFormatter.format` — sorts keys + dependency entries
6. `JSON.stringify` + `FileSystem.writeFileString`

Each step is a separate service, replaceable by consumers without touching the others.

### Design Patterns Used

#### Pattern 1: Schema.Class / Schema.TaggedClass

- **Where used:** `Person`, `PackageManager`, `DevEngine`, `Dependency` hierarchy
- **Why used:** Provides both runtime validation and instance methods/getters
- **Implementation:** Follows semver-effect's `SemVer` class pattern

#### Pattern 2: Context.Tag services with Live layers

- **Where used:** All 7 services
- **Why used:** Standard Effect dependency injection; enables testing with mock layers
- **Implementation:** Following jsonc-effect and workspaces-effect patterns

#### Pattern 3: Data.TaggedError base classes

- **Where used:** All 8 error types
- **Why used:** Typed error channel; pattern matching via `_tag`; base constant exported for TS declaration bundling
- **Implementation:** One file per error; exports both the base constant and the class

#### Pattern 4: Open record index signature

- **Where used:** `PackageJsonSchema`, `PublishConfigSchema`
- **Why used:** package.json allows arbitrary tool-specific fields; preserving them ensures round-trip fidelity
- **Implementation:** `Schema.Struct(knownFields, { key: Schema.String, value: Schema.Unknown })`

---

## System Architecture

### Module Structure

```text
src/
  schemas/           # 14 schema files — field-level types
  errors/            # 8 tagged error types
  domain/            # Package class + Dependency hierarchy + PackageNameUtil
  services/          # 7 service Context.Tag definitions
  layers/            # 7 Live implementations + PackageJsonLive composite
  index.ts           # Public re-exports
__test__/
  schemas/           # 12 schema unit test files
  errors/            # 1 error test file
  domain/            # 3 domain test files
  services/          # 3 service test files
  integration/       # 2 integration test files (fixture-based + snapshots)
  utils/             # fixtures.ts, layers.ts test utilities
```

### Layered Architecture

#### Layer 1: Schemas

**Responsibilities:**

- Define typed representations of all package.json fields
- Branded types for domain concepts (`PackageName`, `SpdxLicense`, `DependencySpecifier`)
- Encode/decode between raw JSON and typed representations including `HashMap` transforms and `SemVer` transforms

**Key schemas:**

- `PackageName` — union of `ScopedPackageName` and `UnscopedPackageName` branded types
- `SpdxLicense` — branded; validation delegates to `spdx-expression-parse`
- `VersionSchema` — `transformOrFail` producing `SemVer` instances
- `DependencyMapSchema` — plain object ↔ `HashMap<string, string>`
- `PackageJsonSchema` — open-record struct; `makePackageJsonSchema` factory for overrides

#### Layer 2: Errors

**Responsibilities:**

- Typed error types for parsing failures, validation errors, IO errors
- Each error carries structured payload fields; `PackageJsonValidationError` aggregates multiple rule failures

#### Layer 3: Domain

**Responsibilities:**

- `Package` class wraps decoded data and provides a clean API
- Dependency subclasses carry semantic classification (`isLocal`, `isGit`, etc.)
- `PackageNameUtil` provides pure utility functions for name manipulation

#### Layer 4: Services

**Responsibilities:**

- Define interfaces for reading, writing, formatting, validating, and transforming package.json
- Each service is a `Context.Tag` with a minimal interface

#### Layer 5: Layers

**Responsibilities:**

- Provide live implementations using `@effect/platform` and concrete algorithms
- `PackageJsonLive` is the composite layer consumers provide to their Effect programs

---

## Data Flow

### Reading a package.json

```text
[File Path]
      |
      v
[FileSystem.exists] — PackageJsonNotFoundError if absent
      |
      v
[FileSystem.readFileString] — PackageJsonReadError on IO failure
      |
      v
[JSON.parse] — PackageJsonReadError on parse failure
      |
      v
[Schema.decodeUnknown(PackageJsonSchema)] — PackageJsonReadError on decode failure
      |
      v
[new Package(decoded)] — typed Package instance
```

### Writing a package.json

```text
[Package instance]
      |
      v
[Schema.encode(PackageJsonSchema)] — PackageJsonWriteError on failure
      |
      v
[CatalogResolver.resolve] — resolves catalog: protocol (no-op by default)
      |
      v
[WorkspaceResolver.resolve] — resolves workspace: protocol (no-op by default)
      |
      v
[PackageJsonTransformer.transform] — strips empty dependency maps
      |
      v
[PackageJsonFormatter.format] — sorts keys by opinionated order
      |
      v
[JSON.stringify + "\n"] — 2-space indented with trailing newline
      |
      v
[FileSystem.writeFileString] — PackageJsonWriteError on IO failure
```

### Validator flow

```text
[Package instance]
      |
      v
[Run each ValidationRule in sequence]
      |
      v
[Collect all ValidationRuleFailure objects]
      |
      v
[If any failures → PackageJsonValidationError (aggregate)]
[If none → return Package]
```

---

## Integration Points

### Sister Library Integrations

#### semver-effect

`VersionSchema` delegates to `parseValidSemVer` from `semver-effect`. The decoded `version` field on `Package` is a `SemVer` instance. `Package.setVersion` also uses `parseValidSemVer` for validation before constructing the updated `Package`.

#### workspaces-effect

`WorkspaceResolverLive` is a no-op placeholder. A real implementation provided by `workspaces-effect` can be substituted to resolve `workspace:` protocol specifiers in dependency maps before writing.

#### jsonc-effect

Not directly integrated. Follows the same patterns (Context.Tag, Live layers, Data.TaggedError) but operates on different file formats.

### Consumer Integration

Consumers wire up the library by providing `PackageJsonLive` alongside a platform `FileSystem` layer:

```typescript
import { PackageJsonLive, PackageJsonReader } from "package-json-effect";
import { NodeFileSystem } from "@effect/platform-node";
import { Effect, Layer } from "effect";

const program = Effect.gen(function* () {
  const reader = yield* PackageJsonReader;
  const pkg = yield* reader.read("./package.json");
  console.log(pkg.name, pkg.version.toString());
});

program.pipe(
  Effect.provide(PackageJsonLive),
  Effect.provide(NodeFileSystem.layer),
  Effect.runPromise,
);
```

Custom validation rules replace the default validator:

```typescript
import { makePackageJsonValidatorLive } from "package-json-effect/layers";

const MyValidatorLive = makePackageJsonValidatorLive({
  rules: [myRule1, myRule2],
});
```

---

## Testing Strategy

### Unit Tests

**Location:** `__test__/schemas/`, `__test__/errors/`, `__test__/domain/`, `__test__/services/`

**What is tested:**

- Schema decode/encode roundtrips for all 14 schema files
- Error construction and message formatting
- `Package` getters and all 7 static mutation methods
- `Dependency` semantic classification getters
- `PackageNameUtil` scope/unscoped/isScoped utilities
- Formatter key ordering and dependency sorting
- Transformer empty-map stripping
- Validator rule execution and failure aggregation

### Integration Tests

**Location:** `__test__/integration/`

**What is tested:**

- `reader.int.test.ts` — reading real `package.json` fixtures from disk via the full `PackageJsonReaderLive` + `NodeFileSystem` stack
- `roundtrip.int.test.ts` — read → mutate → write → re-read fixture files, verified against stored snapshots

**Fixture utilities:** `__test__/utils/fixtures.ts` and `__test__/utils/layers.ts` provide shared test helpers.

### Test counts

- 143 unit tests
- 22 integration tests
- 165 total

---

## Future Enhancements

### Phase 2: Extended field coverage

- `repository` field (string shorthand or structured object)
- `bugs` field (string or `{ url, email }` object)
- `funding` field (string, object, or array)
- `workspaces` array field
- `os` and `cpu` constraint arrays

### Phase 3: Protocol resolver implementations

- Real `CatalogResolver` that reads from `pnpm-workspace.yaml` catalogs
- Real `WorkspaceResolver` that reads from workspace package.json files
- These may live in separate packages (`catalog-resolver-effect`, `workspace-resolver-effect`)

### Phase 4: Utilities

- Dependency version range comparison using `semver-effect`
- Package.json merging/diffing utilities
- `Package.addDevDependency`, `addPeerDependency`, `addOptionalDependency` mutation methods

---

## Related Documentation

**Internal references:**

- `.claude/design/package-json-effect/schema-patterns-reference.md` — Effect Schema patterns used in this library
- `.claude/design/package-json-effect/package-json-spec-reference.md` — npm package.json specification notes

**Sister Libraries:**

- semver-effect — Version parsing and comparison (`VersionSchema` depends on this)
- jsonc-effect — JSONC file parsing (same architectural patterns)
- workspaces-effect — Monorepo workspace discovery (consumes `WorkspaceResolver` interface)
- yaml-effect — YAML parsing
- type-registry-effect — TypeScript type registry
