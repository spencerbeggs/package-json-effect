# package-json-effect

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
