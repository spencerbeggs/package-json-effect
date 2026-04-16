---
status: current
module: package-json-effect
category: architecture
created: 2026-04-16
updated: 2026-04-16
last-synced: 2026-04-16
completeness: 90
related:
  - .claude/design/package-json-effect/architecture.md
  - .claude/design/package-json-effect/package-json-spec-reference.md
dependencies: []
---

# Effect Schema Patterns Reference

Key Schema patterns and techniques relevant to package-json-effect, distilled
from the Effect docs. This is a design-time reference, not a tutorial.

## Schema.Class Pattern

The primary pattern for rich domain types. Gives us validation, equality,
hashing, and instance methods in one definition.

```typescript
class PackageJson extends Schema.Class<PackageJson>("PackageJson")({
  name: PackageName,
  version: Schema.String,
}) {
  get isScoped(): boolean {
    return this.name.startsWith("@");
  }
}
```

Key behaviors:

- Constructor validates automatically (`new PackageJson({...})` throws on
  invalid input)
- `make` factory equivalent to `new`
- Bypass validation with `new PackageJson({...}, true)`
- Acts as transformation schema: decode raw objects into class instances
- Implements `Equal` trait (structural equality)
- Use `Schema.Data(Schema.Array(...))` for deep equality on arrays
- Three annotation slots: "to" (class), "transformation", "from" (struct)

## Branded Types

For nominal type safety without runtime overhead. Critical for distinguishing
`PackageName` from plain `string`.

```typescript
const PackageName = Schema.String.pipe(
  Schema.filter((s) => isValidPackageName(s) || "Invalid package name"),
  Schema.brand("PackageName")
);
type PackageName = Schema.Schema.Type<typeof PackageName>;
```

- `PackageName.make("foo")` creates a branded value
- Branded types compose with filters for validation
- Use symbol brands for cross-module uniqueness

## Filters

Add validation constraints without changing the type.

```typescript
const PackageName = Schema.String.pipe(
  Schema.maxLength(214),
  Schema.lowercased(),
  Schema.filter((s) => !s.startsWith(".") || "Cannot start with ."),
  Schema.brand("PackageName")
);
```

Built-in string filters: `maxLength`, `minLength`, `pattern`, `startsWith`,
`endsWith`, `includes`, `trimmed`, `lowercased`, `nonEmptyString`.

Filter predicates return: `true` (pass), `false` (fail, no message),
`string` (fail with message), `FilterIssue` (fail with path), or array of
issues.

## Union Types (critical for package.json)

Many package.json fields accept multiple shapes.

```typescript
// bugs: string | { url?: string, email?: string }
const Bugs = Schema.Union(
  Schema.String,
  Schema.Struct({
    url: Schema.optional(Schema.String),
    email: Schema.optional(Schema.String),
  })
);
```

Union members evaluated in order - put more specific schemas first.

## Optional Fields with Defaults

```typescript
const PackageJson = Schema.Struct({
  name: PackageName,
  version: Schema.String,
  // Optional, absent from output if not provided
  description: Schema.optional(Schema.String),
  // Optional with default value
  private: Schema.optional(Schema.Boolean).pipe(
    Schema.withDefault(() => false)
  ),
});
```

- `Schema.optional(S)` makes field optional in both type and encoded
- `Schema.withConstructorDefault` adds default for construction only
- Defaults are lazy (function), recomputed each call

## Transformations

For converting between external formats and internal representations.

```typescript
// Person string "Name <email> (url)" to structured object
const PersonFromString = Schema.transform(
  Schema.String,
  PersonStruct,
  {
    strict: true,
    decode: (s) => parsePersonString(s),
    encode: (p) => formatPerson(p),
  }
);

// Failable transformation
const SafeTransform = Schema.transformOrFail(
  Schema.String,
  TargetSchema,
  {
    strict: true,
    decode: (input, options, ast) => {
      const result = tryParse(input);
      if (!result) {
        return ParseResult.fail(new ParseResult.Type(ast, input));
      }
      return ParseResult.succeed(result);
    },
    encode: (value) => ParseResult.succeed(serialize(value)),
  }
);
```

## Extending / Composing Structs

```typescript
const BasePackageJson = Schema.Struct({
  name: PackageName,
  version: Schema.String,
});

const ExtendedPackageJson = Schema.Struct({
  ...BasePackageJson.fields,
  description: Schema.optional(Schema.String),
  keywords: Schema.optional(Schema.Array(Schema.String)),
});
```

Or with `Schema.extend`:

```typescript
const Extended = Schema.extend(BasePackageJson)(
  Schema.Struct({ description: Schema.optional(Schema.String) })
);
```

## Recursive Types

For deeply nested structures like `exports` conditional maps.

```typescript
interface ExportConditions {
  [key: string]: string | null | ExportConditions;
}

const ExportConditions: Schema.Schema<ExportConditions> = Schema.suspend(
  () => Schema.Record({
    key: Schema.String,
    value: Schema.Union(
      Schema.String,
      Schema.Null,
      ExportConditions
    ),
  })
);
```

## Index Signatures (open-ended records)

For package.json which has known fields plus arbitrary extensions.

```typescript
const PackageJson = Schema.Struct(
  {
    name: PackageName,
    version: Schema.String,
  },
  // Index signature for unknown fields
  { key: Schema.String, value: Schema.Unknown }
);
```

This allows known fields to be typed while preserving unknown fields.

## Key Design Decisions for package-json-effect

### Schema.Class vs Schema.Struct

- Use `Schema.Class` for the top-level `PackageJson` type (instance
  methods, equality, identity)
- Use `Schema.Struct` for sub-structures that don't need instance behavior
  (e.g., `Bugs`, `Repository` shapes)
- Use branded types for validated scalars (`PackageName`, `SemVerString`)

### Narrowing via Union discrimination

```typescript
const ScopedName = Schema.String.pipe(
  Schema.filter((s) => s.startsWith("@")),
  Schema.brand("ScopedPackageName")
);

const UnscopedName = Schema.String.pipe(
  Schema.filter((s) => !s.startsWith("@")),
  Schema.brand("UnscopedPackageName")
);

const PackageName = Schema.Union(ScopedName, UnscopedName);
```

Users can narrow by using the specific schema directly.

### Open record pattern

Package.json allows arbitrary keys. We model known fields explicitly and
preserve unknown fields via index signature, so round-tripping doesn't
lose data.
