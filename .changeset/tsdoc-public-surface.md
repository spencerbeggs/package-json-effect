---
"package-json-effect": minor
---

## Features

* Exported the `PackageManager` and `DevEngine` schema classes from the package entry point. Both are referenced by the `Package` domain signature (the `packageManager` and `devEngines` fields), so consumers can now import them directly instead of reconstructing the types.

## Documentation

* Added TSDoc release tags and summaries across the entire public API surface. Every exported schema, service, layer, domain type, and error now carries a `@public` tag and a one-line description, so the whole surface renders in the generated API reference.

## Build System

* Adopted the `@savvy-web/bundler` `build()` API, which runs an API Extractor pass over the public surface during the production build. Synthetic Effect `Context.Tag` `_base` classes are excluded via the toolchain-sanctioned `suppressWarnings` option.

## Dependencies

| Dependency                  | Type          | Action  | From    | To                     |
| :-------------------------- | :------------ | :------ | :------ | :--------------------- |
| semver-effect               | dependency    | updated | 0.2.1   | 0.3.0                  |
| @savvy-web/bundler          | devDependency | updated | 1.0.1   | 1.1.0                  |
| @vitest-agent/plugin        | devDependency | updated | 1.0.0   | 1.1.3                  |
| @effect/language-service    | devDependency | removed | 0.86.2  | —                      |
| @types/node                 | devDependency | added   | —       | 26.0.1                 |
| @typescript/native-preview  | devDependency | added   | —       | 7.0.0-dev.20260701.1   |
| typescript                  | devDependency | added   | —       | 5.9.3                  |
| @savvy-web/pnpm-plugin-silk | config        | updated | 0.18.1  | 0.18.2                 |
