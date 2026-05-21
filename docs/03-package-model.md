# The Package model

`Package` is the domain model the reader produces and the writer consumes. It is a `Schema.Class`, so it carries typed fields, computed getters and a set of static methods for producing edited copies. This page covers the fields and getters, the `Dependency` instances and their protocol taxonomy, and the dual-API for immutable mutations.

## Fields and getters

The typed fields decode from the file. Scalars that may be absent are `Option`; the dependency and script maps are `HashMap`; `version` is a `SemVer`.

| Field | Type | Notes |
| ----- | ---- | ----- |
| `name` | `string` | Branded `PackageName` on the wire |
| `version` | `SemVer` | From `semver-effect` |
| `description` | `Option<string>` | |
| `private` | `Option<boolean>` | Prefer the `isPrivate` getter |
| `type` | `Option<"module" \| "commonjs">` | Prefer the `isESM` getter |
| `license` | `Option<string>` | |
| `dependencies` | `HashMap<string, string>` | Defaults to empty |
| `devDependencies` | `HashMap<string, string>` | Defaults to empty |
| `peerDependencies` | `HashMap<string, string>` | Defaults to empty |
| `optionalDependencies` | `HashMap<string, string>` | Defaults to empty |
| `scripts` | `HashMap<string, string>` | Defaults to empty |
| `bin` | `Option<...>` | String or map form |
| `engines` | `Option<HashMap<string, string>>` | e.g. `node`, `npm` |
| `rest` | `Record<string, unknown>` | Unmodeled top-level fields |

Computed getters answer the common questions without reaching into the fields directly:

```typescript
import { Effect, HashMap, Option } from "effect";
import { NodeFileSystem } from "@effect/platform-node";
import { PackageJsonLive, PackageJsonReader } from "package-json-effect";

const program = Effect.gen(function* () {
  const reader = yield* PackageJsonReader;
  const pkg = yield* reader.read("./package.json");

  console.log(pkg.isScoped); // true when name starts with "@"
  console.log(pkg.isESM); // true when "type": "module"
  console.log(pkg.isPrivate); // the "private" field, defaulting to false
  console.log(pkg.hasDependency("effect")); // checks all four dependency maps

  // Reading an Option field
  console.log(Option.getOrNull(pkg.license)); // the license, or null

  // Iterating a HashMap field
  for (const [scriptName, command] of HashMap.entries(pkg.scripts)) {
    console.log(`${scriptName}: ${command}`);
  }
});

Effect.runPromise(program.pipe(Effect.provide(PackageJsonLive), Effect.provide(NodeFileSystem.layer)));
```

## Dependency instances

The raw `dependencies` field is a `HashMap<string, string>` of name to specifier. The accessor methods return richer instances — `getDependencies()`, `getDevDependencies()`, `getPeerDependencies()` and `getOptionalDependencies()` each return a `HashMap` whose values are `Dependency`, `DevDependency`, `PeerDependency` or `OptionalDependency` objects.

```typescript
import { Effect, HashMap, Option } from "effect";
import { NodeFileSystem } from "@effect/platform-node";
import { PackageJsonLive, PackageJsonReader } from "package-json-effect";

const program = Effect.gen(function* () {
  const reader = yield* PackageJsonReader;
  const pkg = yield* reader.read("./package.json");

  const deps = pkg.getDependencies();
  for (const [name, dep] of HashMap.entries(deps)) {
    console.log(name, dep.specifier, Option.getOrNull(dep.protocol));
    // e.g. "effect" "^3.10.0" "range"
  }
});

Effect.runPromise(program.pipe(Effect.provide(PackageJsonLive), Effect.provide(NodeFileSystem.layer)));
```

A `PeerDependency` additionally carries `isOptional`, populated from the `peerDependenciesMeta` block, so you can tell a required peer from an optional one.

## Protocol taxonomy

Every dependency instance classifies its specifier. The `protocol` getter returns an `Option<DependencyProtocol>` — `None` for an empty specifier, otherwise one of `"range"`, `"tag"`, `"git"`, `"url"`, `"npm"`, `"file"`, `"link"`, `"portal"`, `"catalog"` or `"workspace"`. Boolean getters answer specific questions:

| Getter | True when the specifier is |
| ------ | -------------------------- |
| `isRange` | A parseable semver range like `^4.0.0` |
| `isTag` | A dist-tag like `latest` or `next` |
| `isGit` | A git URL (`git+...`, `git://`, `github:...`) |
| `isLocal` | A `file:`, `link:` or `portal:` path |
| `isLink` | A `link:` path specifically |
| `isPortal` | A `portal:` path specifically |
| `isCatalog` | A `catalog:` reference |
| `isWorkspace` | A `workspace:` reference |
| `isUnresolved` | `catalog:` or `workspace:` (either) |

```typescript
import { Effect, HashMap, Option } from "effect";
import { NodeFileSystem } from "@effect/platform-node";
import { PackageJsonLive, PackageJsonReader, isUnresolvedDependency } from "package-json-effect";

const program = Effect.gen(function* () {
  const reader = yield* PackageJsonReader;
  const pkg = yield* reader.read("./package.json");

  for (const [, dep] of HashMap.entries(pkg.getDependencies())) {
    if (isUnresolvedDependency(dep)) {
      // Narrows to a dependency whose specifier is catalog: or workspace:
      console.log("needs resolution before publish:", dep.name);
    }
    if (dep.isRange) {
      console.log(dep.name, "→", Option.getOrNull(dep.range)); // a parsed Range, or null
    }
  }
});

Effect.runPromise(program.pipe(Effect.provide(PackageJsonLive), Effect.provide(NodeFileSystem.layer)));
```

`isUnresolvedDependency` is a type guard: it narrows any value with an `isUnresolved` field to the unresolved variant while keeping the concrete type, so you can use it across the four dependency families.

For one-off classification without a `Dependency` instance, the library also exports the underlying helpers — `protocolOf(specifier)` returns the protocol directly, and `parseRangeOption(specifier)` returns an `Option<Range>`.

```typescript
import { Option } from "effect";
import { parseRangeOption, protocolOf } from "package-json-effect";

console.log(protocolOf("^1.0.0")); // "range"
console.log(protocolOf("latest")); // "tag"
console.log(protocolOf("workspace:*")); // "workspace"
console.log(Option.isSome(parseRangeOption("^1.0.0"))); // true
console.log(Option.isSome(parseRangeOption("latest"))); // false
```

## Immutable mutations

Edits never change the input. Each mutation method returns a new `Package`; the original is untouched. The methods come in a dual-API, callable three ways:

- **Data-first:** pass the `Package` first — `Package.addDependency(pkg, "effect", "^3.10.0")`.
- **Curried (data-last):** omit the `Package` to get a function you apply later — `Package.addDependency("effect", "^3.10.0")(pkg)`. This form composes with array operations and `Array.map`.
- **Pipeable:** `Package` is `Pipeable`, so `pkg.pipe(Package.addDependency("effect", "^3.10.0"))` works too. It is equivalent to the curried form, just read left-to-right.

```typescript
import { Effect, HashMap } from "effect";
import { NodeFileSystem } from "@effect/platform-node";
import { Package, PackageJsonLive, PackageJsonReader } from "package-json-effect";

const program = Effect.gen(function* () {
  const reader = yield* PackageJsonReader;
  const pkg = yield* reader.read("./package.json");

  // Data-first
  const withDep = Package.addDependency(pkg, "effect", "^3.10.0");
  console.log(HashMap.has(withDep.dependencies, "effect")); // true
  console.log(HashMap.has(pkg.dependencies, "effect")); // false — original unchanged

  // Curried
  const withScript = Package.setScript("build", "tsc")(pkg);
  console.log(HashMap.has(withScript.scripts, "build")); // true

  // Pipeable — equivalent to the curried form
  const piped = pkg.pipe(Package.addDependency("vitest", "^1.0.0"));
  console.log(HashMap.has(piped.dependencies, "vitest")); // true
});

Effect.runPromise(program.pipe(Effect.provide(PackageJsonLive), Effect.provide(NodeFileSystem.layer)));
```

Some mutations validate their input and return an `Effect` rather than a plain `Package`, because they can fail:

- `setVersion(version)` fails with `InvalidVersionError` when the string is not valid semver.
- `setName(name)` fails with `InvalidPackageNameError` when the name breaks npm naming rules.
- `setLicense(license)` fails with `InvalidSpdxLicenseError` when the string is not a recognized SPDX identifier or expression.

```typescript
import { Effect, Option } from "effect";
import { Package } from "package-json-effect";
import { Schema } from "effect";
import { PackageJsonSchema } from "package-json-effect/schema";

const base = Schema.decodeUnknownSync(PackageJsonSchema)({ name: "p", version: "1.0.0" });

const licensed = Effect.runSync(Package.setLicense(base, "MIT"));
console.log(Option.getOrNull(licensed.license)); // "MIT"

// Pipeable works for the failing mutations too — pkg.pipe(...) returns the Effect.
const bumped = Effect.runSync(base.pipe(Package.setVersion("2.0.0")));
console.log(bumped.version.toString()); // "2.0.0"

const exit = Effect.runSyncExit(Package.setLicense(base, "NOT-A-LICENSE"));
console.log(exit._tag); // "Failure" — the input is not a valid SPDX identifier
```

The non-failing mutations return a `Package` directly: `addDependency`, `removeDependency`, the `dev`/`peer`/`optional` variants, `setScript` and `removeScript`. All of them accept all three call styles.

The full mutation set: `setVersion`, `setName`, `setLicense`, `addDependency`, `removeDependency`, `addDevDependency`, `removeDevDependency`, `addPeerDependency`, `removePeerDependency`, `addOptionalDependency`, `removeOptionalDependency`, `setScript`, `removeScript`. Two lower-level helpers round out the set: `copyWith(patch)` replaces fields directly, and `fromData(data)` constructs a `Package` from an already-decoded record without re-validating.
