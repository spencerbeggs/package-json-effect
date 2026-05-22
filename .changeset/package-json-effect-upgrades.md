---
"package-json-effect": minor
---

## Features

- Migrate the domain layer to Schema.Class with round-trip-safe unknown-field preservation.
- Package dependency accessors now return Dependency instances with a full protocol taxonomy
  (incl. `link:` / `portal:`) and a semver-effect range accessor.
- Add opt-in `catalog:` / `workspace:` resolution contracts with no-op defaults and a pipeable
  `Package.resolve`.
- Complete the validator default rules and add publish-readiness rules.
- Add the `package-json-effect/schema` entry point.
- `Package` is pipeable and exposes `getDependencies()`, `getDevDependencies()`, `getPeerDependencies()`
  and `getOptionalDependencies()` accessors that return typed `Dependency` instances; mutations work
  data-first, curried and pipeable (`pkg.pipe(Package.setVersion(v))`).
- Add `decodeSpecifier`, an opt-in dependency-specifier validator that fails with
  `InvalidDependencySpecifierError`.

## Breaking Changes

- Raw schema values now import from `package-json-effect/schema`.
- Package dependency accessors return `Dependency` instances instead of plain strings.
- `Package.setLicense` fails with `InvalidSpdxLicenseError` for invalid SPDX expressions.
