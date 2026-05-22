# Extending the schema

`Package` models the standard `package.json` fields. Tools often add their own top-level blocks — a config object, a custom manifest field — and by default those land in `pkg.rest` as untyped values. The `package-json-effect/schema` entry point lets you promote a field into a typed member: subclass `Package` with `.extend()`, rebuild the wire schema with `makePackageJsonSchema`, and your field decodes as a real type with its own getters.

## The schema entry point

The advanced schema surface lives behind a separate import so the main entry point stays focused on the everyday API. It exports the schema factory, the wire schema, the sub-schemas for each field and the branded values you can opt into.

```typescript
import { makePackageJsonSchema, PackageJsonSchema, PackageName, SpdxLicense } from "package-json-effect/schema";
```

`PackageJsonSchema` is the default wire schema — the one the reader and writer use, which decodes a plain JSON object to a `Package` and back. `makePackageJsonSchema` is the factory that builds a wire schema for any `Package` subclass.

## Adding a custom field

`Package` is a `Schema.Class`, so it has a `.extend()` method that produces a subclass with extra fields. Declare the new field with a schema, then pass the subclass to `makePackageJsonSchema` to get a wire schema that decodes it.

```typescript
import { Option, Schema } from "effect";
import { Package } from "package-json-effect";
import { makePackageJsonSchema } from "package-json-effect/schema";

// A subclass that types a custom "myTool" config block.
class ToolingPackage extends Package.extend<ToolingPackage>("ToolingPackage")({
  myTool: Schema.optionalWith(Schema.Struct({ enabled: Schema.Boolean }), { as: "Option" }),
}) {
  // Add getters over the new field, just like the built-in ones.
  get toolEnabled(): boolean {
    return Option.match(this.myTool, { onNone: () => false, onSome: (config) => config.enabled });
  }
}

const ToolingSchema = makePackageJsonSchema(ToolingPackage);

const pkg = Schema.decodeUnknownSync(ToolingSchema)({
  name: "p",
  version: "1.0.0",
  myTool: { enabled: true },
});

console.log(pkg.toolEnabled); // true — "myTool" is now a typed field, not an entry in rest
console.log(Option.isSome(pkg.myTool)); // true
```

The first type argument to `.extend<ToolingPackage>(...)` is the subclass itself, and the string is the schema's identifier. Both follow the standard Effect `Schema.Class` extension pattern.

## How rest interacts with extended fields

`makePackageJsonSchema` reads the class's `fields` to decide which top-level keys are known. A field you add with `.extend()` is decoded as a typed member and excluded from `rest`; everything else still flows into `rest` for round-trip fidelity. On write, the `rest` record is flattened back to the top level, so your typed field and the untyped remainder both serialize correctly.

Promoting a field to a typed member changes nothing else. Fields you do not model keep surviving the round trip exactly as they did before.

## Opt-in branded validation

The schema entry point also exports branded schemas for the values that have stricter rules than "any string" — `PackageName`, `SpdxLicense`, `DependencySpecifier` and others. The default `Package` already brands `name` as `PackageName`, but you can use these schemas directly to validate a value in your own code without constructing a whole `Package`.

```typescript
import { Schema } from "effect";
import { PackageName, isValidPackageName, isValidDependencySpecifier } from "package-json-effect/schema";

console.log(Schema.is(PackageName)("my-pkg")); // true
console.log(Schema.is(PackageName)("Not Valid")); // false — spaces are not allowed

// Plain boolean guards for the same checks, no schema needed:
console.log(isValidPackageName("@scope/pkg")); // true
console.log(isValidDependencySpecifier("^1.0.0")); // true
```

These are opt-in. Decoding a `package.json` through `PackageJsonSchema` brands `name` for you; the other branded schemas are there for when you want to validate a value in isolation — a CLI argument, a form field, a value read from elsewhere.

When you want a typed error instead of a boolean, `decodeSpecifier` validates a dependency specifier string and fails with a tagged `InvalidDependencySpecifierError`. It returns an `Effect`, so it composes with the rest of your program and the failure travels on the error channel.

```typescript
import { Cause, Chunk, Effect } from "effect";
import { InvalidDependencySpecifierError } from "package-json-effect";
import { decodeSpecifier } from "package-json-effect/schema";

const ok = Effect.runSync(decodeSpecifier("^1.0.0"));
console.log(ok); // "^1.0.0" — a branded DependencySpecifier

const exit = Effect.runSyncExit(decodeSpecifier("not a specifier"));
if (exit._tag === "Failure") {
  const first = Chunk.get(Cause.failures(exit.cause), 0);
  if (first._tag === "Some" && first.value instanceof InvalidDependencySpecifierError) {
    console.log(first.value.input); // "not a specifier"
    console.log(first.value.reason); // "Not a recognized dependency specifier"
  }
}
```

Available branded and sub-schemas: `PackageName` (with `ScopedPackageName` and `UnscopedPackageName`), `SpdxLicense`, `DependencySpecifier`, `VersionSchema`, `EnginesSchema`, `ScriptsSchema`, `BinSchema`, `ExportsFieldSchema`, `PublishConfigSchema`, `PackageManagerSchema`, `PersonSchema`, `DevEnginesSchema` and `DependencyMapSchema`. The boolean guards `isValidPackageName` and `isValidDependencySpecifier`, and the `decodeSpecifier` decoder, all come from the same `package-json-effect/schema` entry point.
