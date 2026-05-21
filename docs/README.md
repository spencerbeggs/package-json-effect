# package-json-effect documentation

`package-json-effect` is an [Effect](https://effect.website) library for reading, writing, parsing, validating and normalizing `package.json` files. It decodes a file into a typed `Package` model and writes it back with stable key ordering, with reading, formatting, validation and dependency resolution each behind a swappable `Layer`.

## Install

`effect` and `@effect/platform` are peer dependencies. Install them alongside a platform adapter for your runtime — `@effect/platform-node` for Node.js.

```bash
npm install package-json-effect effect @effect/platform @effect/platform-node
# or
pnpm add package-json-effect effect @effect/platform @effect/platform-node
```

## Guides

The pages below work in sequence, from a first program to advanced usage.

- [Getting started](./01-getting-started.md) — install, the Effect mental model (Option, HashMap, Layer) and providing PackageJsonLive with a FileSystem layer.
- [Reading and writing](./02-reading-and-writing.md) — the reader and writer, the formatter's key ordering, the transformer and round-trip fidelity for unmodeled fields.
- [The Package model](./03-package-model.md) — fields and getters, the Dependency instances and protocol taxonomy, and the dual-API for immutable mutations.
- [Validation](./04-validation.md) — the default rules, publish-readiness rules, writing a ValidationRule and building a validator layer.
- [Extending the schema](./05-extending-the-schema.md) — adding custom fields with .extend() and makePackageJsonSchema via the package-json-effect/schema entry point.
- [Catalog and workspace resolution](./06-catalog-workspace-resolution.md) — the no-op default, providing a real resolver, modifier semantics and resolution on read versus write.
- [Testing](./07-testing.md) — mock layers with Layer.succeed, asserting on typed errors and integration tests against the real filesystem.
- [Errors and troubleshooting](./08-errors-and-troubleshooting.md) — every error type, what raises it, how to handle it and common questions.

## License

[MIT](../LICENSE)
