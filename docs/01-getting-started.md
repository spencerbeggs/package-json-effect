# Getting started

`package-json-effect` reads a `package.json` file into a typed `Package`, lets you inspect and edit it, and writes it back with stable key ordering. This page covers installation, the Effect concepts the library uses and how to wire up the layers you need to run a program.

## Install

`effect` and `@effect/platform` are peer dependencies. The platform adapter for your runtime — `@effect/platform-node` for Node.js — supplies the FileSystem the reader and writer need.

```bash
npm install package-json-effect effect @effect/platform @effect/platform-node
# or
pnpm add package-json-effect effect @effect/platform @effect/platform-node
```

## Effect concepts you will meet

The library returns values in three Effect containers rather than plain JavaScript shapes. If you have not used Effect before, here are the three to recognize.

- **`Option<A>`** represents a field that may be absent. `description`, `license`, `bin` and `engines` are all `Option`, so a missing field is `Option.none()` rather than `undefined`. Read them with `Option.getOrElse`, `Option.getOrNull` or `Option.match`.
- **`HashMap<string, V>`** holds the dependency maps and the script map. Iterate with `HashMap.entries`, look up with `HashMap.get` (which returns an `Option`) and check membership with `HashMap.has`.
- **`Layer`** is how services are provided. Each capability — reading, writing, validating, resolving — is a service behind a `Context.Tag`, and a `Layer` builds the implementation. `PackageJsonLive` is a composite layer that builds all of them at once.

The `version` field is also typed: it decodes to a `SemVer` from [`semver-effect`](https://www.npmjs.com/package/semver-effect), so `pkg.version.major` and `pkg.version.toString()` work without parsing strings yourself.

## Your first program

A program yields the service tags it needs from context, then runs with the layers that provide them. Here the program reads a file and logs a few fields.

```typescript
import { NodeFileSystem } from "@effect/platform-node";
import { Effect, Option } from "effect";
import { PackageJsonLive, PackageJsonReader } from "package-json-effect";

const program = Effect.gen(function* () {
  const reader = yield* PackageJsonReader;
  const pkg = yield* reader.read("./package.json");

  console.log(pkg.name); // a string, e.g. "package-json-effect"
  console.log(pkg.version.toString()); // a SemVer rendered as a string, e.g. "0.1.0"
  console.log(Option.getOrElse(pkg.description, () => "(no description)"));
  // the "description" field, or the fallback when the field is absent

  return pkg;
});

Effect.runPromise(program.pipe(Effect.provide(PackageJsonLive), Effect.provide(NodeFileSystem.layer)));
```

## Providing layers

`PackageJsonReader` and `PackageJsonWriter` both depend on a `FileSystem`. You provide that through a platform adapter, so the library never imports `node:fs` directly and works under any `@effect/platform` runtime.

`PackageJsonLive` wires together every service in the library. The one thing it does not provide is the `FileSystem`, so a runnable program always provides two layers — `PackageJsonLive` and a platform layer.

```typescript
import { NodeFileSystem } from "@effect/platform-node";
import { Effect } from "effect";
import { PackageJsonLive } from "package-json-effect";

declare const program: Effect.Effect<unknown, unknown, never>;

Effect.runPromise(program.pipe(Effect.provide(PackageJsonLive), Effect.provide(NodeFileSystem.layer)));
```

`NodeFileSystem.layer` provides only the FileSystem. `NodeContext.layer` provides the FileSystem plus the rest of the Node platform context (`Path`, `CommandExecutor` and more); use it when other parts of your program need them.

## Where to go next

- [The Package model](./03-package-model.md) walks through the getters, dependency instances and mutation methods you use once a file is loaded.
- [Reading and writing](./02-reading-and-writing.md) covers writing a file back, the key ordering applied on write and how unmodeled fields survive a round trip.
