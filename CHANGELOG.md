# package-json-effect

## 0.3.0

### Features

* [`c019002`](https://github.com/spencerbeggs/package-json-effect/commit/c019002a7941d9e233925d52593a46f350dad251) Exported the `PackageManager` and `DevEngine` schema classes from the package entry point. Both are referenced by the `Package` domain signature (the `packageManager` and `devEngines` fields), so consumers can now import them directly instead of reconstructing the types.

### Documentation

* [`c019002`](https://github.com/spencerbeggs/package-json-effect/commit/c019002a7941d9e233925d52593a46f350dad251) Added TSDoc release tags and summaries across the entire public API surface. Every exported schema, service, layer, domain type, and error now carries a `@public` tag and a one-line description, so the whole surface renders in the generated API reference.

### Build System

* [`c019002`](https://github.com/spencerbeggs/package-json-effect/commit/c019002a7941d9e233925d52593a46f350dad251) Adopted the `@savvy-web/bundler` `build()` API, which runs an API Extractor pass over the public surface during the production build. Synthetic Effect `Context.Tag` `_base` classes are excluded via the toolchain-sanctioned `suppressWarnings` option.

### Dependencies

* [`c019002`](https://github.com/spencerbeggs/package-json-effect/commit/c019002a7941d9e233925d52593a46f350dad251) | Dependency | Type | Action | From | To |
  \| :-------------------------- | :------------ | :------ | :----- | :------------------- |
  \| semver-effect | dependency | updated | 0.2.1 | 0.3.0 |
  \| @savvy-web/bundler | devDependency | updated | 1.0.1 | 1.1.0 |
  \| @vitest-agent/plugin | devDependency | updated | 1.0.0 | 1.1.3 |
  \| @effect/language-service | devDependency | removed | 0.86.2 | — |
  \| @types/node | devDependency | added | — | 26.0.1 |
  \| @typescript/native-preview | devDependency | added | — | 7.0.0-dev.20260701.1 |
  \| typescript | devDependency | added | — | 5.9.3 |
  \| @savvy-web/pnpm-plugin-silk | config | updated | 0.18.1 | 0.18.2 |

## 0.2.0

### Breaking Changes

* [`259734e`](https://github.com/spencerbeggs/package-json-effect/commit/259734eac090921d1bfe0dd50ac38f587549a1fc) Raw schema values now import from `package-json-effect/schema`.
* Package dependency accessors return `Dependency` instances instead of plain strings.
* `Package.setLicense` fails with `InvalidSpdxLicenseError` for invalid SPDX expressions.

### Features

* [`259734e`](https://github.com/spencerbeggs/package-json-effect/commit/259734eac090921d1bfe0dd50ac38f587549a1fc) Migrate the domain layer to Schema.Class with round-trip-safe unknown-field preservation.
* Package dependency accessors now return Dependency instances with a full protocol taxonomy
  (incl. `link:` / `portal:`) and a semver-effect range accessor.
* Add opt-in `catalog:` / `workspace:` resolution contracts with no-op defaults and a pipeable
  `Package.resolve`.
* Complete the validator default rules and add publish-readiness rules.
* Add the `package-json-effect/schema` entry point.
* `Package` is pipeable and exposes `getDependencies()`, `getDevDependencies()`, `getPeerDependencies()`
  and `getOptionalDependencies()` accessors that return typed `Dependency` instances; mutations work
  data-first, curried and pipeable (`pkg.pipe(Package.setVersion(v))`).
* Add `decodeSpecifier`, an opt-in dependency-specifier validator that fails with
  `InvalidDependencySpecifierError`.

## 0.1.0

### Features

* [`5ed9390`](https://github.com/spencerbeggs/package-json-effect/commit/5ed939006ada44f76baab9506cd20429f8af79fa) ### Schemas

- Added `PackageName`, `ScopedPackageName`, and `UnscopedPackageName` branded schema types with full npm naming rule validation, plus `isValidPackageName` guard
- Added `SpdxLicense` schema for validated SPDX license expression strings
- Added `DependencySpecifier` type and `isValidDependencySpecifier` guard covering semver ranges, tags, URLs, git references, and workspace protocols
- Added `VersionSchema` backed by `semver-effect` for parsed `SemVer` values
- Added `DependencyMapSchema`, `ScriptsSchema`, `BinSchema`, `EnginesSchema`, `PersonSchema`, `PackageManagerSchema`, `DevEnginesSchema`, `PublishConfigSchema`, and `ExportsFieldSchema`
- Added `PackageJsonSchema` — the core Effect Schema for `package.json` with typed known fields, `Option`-wrapped optional fields, `HashMap`-backed dependency and scripts maps, and an open index signature that preserves unknown fields
- Added `makePackageJsonSchema(overrides)` factory for creating project-specific schemas with custom field types while retaining all default fields and unknown-field passthrough

### Dependencies

| Dependency            | Type           | Action | From | To                |
| :-------------------- | :------------- | :----- | :--- | :---------------- |
| effect                | peerDependency | added  | —    | catalog:silkPeers |
| @effect/platform      | peerDependency | added  | —    | catalog:silkPeers |
| semver-effect         | dependency     | added  | —    | ^0.2.1            |
| spdx-expression-parse | dependency     | added  | —    | ^4.0.0            |

### Domain

* Added `Package` class wrapping decoded `PackageJsonSchema` data with property getters (`name`, `version`, `description`, `license`, `isPrivate`, `isScoped`, `isESM`, `scripts`, `dependencies`, `devDependencies`, `peerDependencies`, `optionalDependencies`) and `hasDependency(name)` query
* Added seven dual-API static mutation methods on `Package` supporting both data-first and data-last (pipeable) call styles: `setVersion`, `setName`, `setLicense`, `addDependency`, `removeDependency`, `setScript`, `removeScript`
* Added `Package.fromData(data)` constructor for interop with custom schemas from `makePackageJsonSchema`
* Added `Dependency`, `DevDependency`, `PeerDependency`, and `OptionalDependency` value types representing entries from their respective dependency maps
* Added `PackageNameUtil` with `isScoped(name)` and related helpers

### Services

* Added `PackageJsonReader` service — reads a `package.json` from a file path and returns a decoded `Package`; errors: `PackageJsonNotFoundError`, `PackageJsonReadError`
* Added `PackageJsonWriter` service — writes a `Package` back to a file path through the full encode → catalog-resolve → workspace-resolve → transform → format → serialize pipeline; errors: `PackageJsonWriteError`
* Added `PackageJsonFormatter` service — controls key ordering and whitespace in the serialized output
* Added `PackageJsonValidator` service — runs a `ReadonlyArray<ValidationRule>` against a `Package` and collects all failures into a single `PackageJsonValidationError`
* Added `CatalogResolver` service — rewrites `catalog:` specifiers back to pinned versions on write
* Added `WorkspaceResolver` service — rewrites `workspace:` specifiers to resolved ranges on write
* Added `PackageJsonTransformer` service — applies arbitrary transformations to the raw encoded object before serialization

### Layers

* Added `PackageJsonReaderLive`, `PackageJsonWriterLive`, `PackageJsonFormatterLive`, `PackageJsonValidatorLive`, `CatalogResolverLive`, `WorkspaceResolverLive`, and `PackageJsonTransformerLive` live Layer implementations
* Added `PackageJsonLive` composite layer that merges all seven services; consumers only need to provide `@effect/platform` `FileSystem`
* Added `makePackageJsonValidatorLive({ rules })` factory for supplying a custom rule set, and exported `defaultRules` (`has-license`, `has-description`) for extension

### Errors

* Added typed error classes for every failure mode: `InvalidPackageNameError`, `InvalidDependencySpecifierError`, `PackageJsonDecodeError`, `PackageJsonNotFoundError`, `PackageJsonParseError`, `PackageJsonReadError`, `PackageJsonValidationError`, and `PackageJsonWriteError`
* Each error class ships both a concrete class and a `*ErrorBase` base class for subclassing
