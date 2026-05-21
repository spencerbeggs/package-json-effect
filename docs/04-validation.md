# Validation

`PackageJsonValidator` runs a list of rules against a `Package` and reports every failure at once. The library ships a default rule set and a few publish-readiness rules, and the `ValidationRule` interface lets you add your own. You assemble the rules you want into a layer with `makePackageJsonValidatorLive`.

## The validator service

`PackageJsonValidator` exposes one method, `validate(pkg)`. It returns the `Package` unchanged on success, or fails with a `PackageJsonValidationError` that collects every rule that did not pass. The default `PackageJsonValidatorLive` layer (included in `PackageJsonLive`) runs the default rule set.

```typescript
import { Effect } from "effect";
import { Schema } from "effect";
import { PackageJsonValidator, PackageJsonValidatorLive } from "package-json-effect";
import { PackageJsonSchema } from "package-json-effect/schema";

const pkg = Schema.decodeUnknownSync(PackageJsonSchema)({
  name: "my-pkg",
  version: "1.0.0",
  description: "A package",
  license: "MIT",
  repository: { type: "git", url: "https://github.com/example/my-pkg" },
});

const program = Effect.gen(function* () {
  const validator = yield* PackageJsonValidator;
  return yield* validator.validate(pkg);
}).pipe(Effect.provide(PackageJsonValidatorLive));

const result = Effect.runSync(program);
console.log(result.name); // "my-pkg" — validation passed, the Package is returned
```

## The default rules

`defaultRules` is an array of four rules covering basic publish hygiene:

| Rule name | Fails when |
| --------- | ---------- |
| `has-license` | `license` field is absent |
| `has-description` | `description` field is absent |
| `has-repository` | `repository` field is absent |
| `not-private` | `private` is `true` |

Every failure carries the rule name, a message and an `Option<string>` path pointing at the offending field. The `PackageJsonValidationError` renders all of them into one message:

```typescript
import { Cause, Chunk, Effect, Option, Schema } from "effect";
import {
  PackageJsonValidationError,
  PackageJsonValidator,
  PackageJsonValidatorLive,
} from "package-json-effect";
import { PackageJsonSchema } from "package-json-effect/schema";

const pkg = Schema.decodeUnknownSync(PackageJsonSchema)({ name: "p", version: "1.0.0", private: true });

const program = Effect.gen(function* () {
  const validator = yield* PackageJsonValidator;
  return yield* validator.validate(pkg);
}).pipe(Effect.provide(PackageJsonValidatorLive));

const exit = Effect.runSyncExit(program);
if (exit._tag === "Failure") {
  const first = Chunk.get(Cause.failures(exit.cause), 0);
  if (first._tag === "Some") {
    const err = first.value as PackageJsonValidationError;
    for (const f of err.failures) {
      console.log(f.rule, "→", Option.getOrNull(f.path));
    }
    // has-license     → license
    // has-description → description
    // has-repository  → repository
    // not-private     → private
  }
}
```

The validator runs the whole list and accumulates failures; it does not stop at the first one. That is why the `repository` and `private` fields are checked against `pkg.rest` and `pkg.isPrivate` even when earlier rules fail.

## Publish-readiness rules

Two extra rules ship for the case where you are about to publish a package and want to catch specifiers that only make sense inside a monorepo. They are not part of `defaultRules` — add them when you need them.

- `noUnresolvedDepsRule` fails when any dependency map contains a `workspace:` or `catalog:` specifier. Those must be resolved to concrete ranges before publish (see [Catalog and workspace resolution](./06-catalog-workspace-resolution.md)).
- `noLocalDepsRule` fails when any dependency map contains a `file:`, `link:` or `portal:` specifier, which point at local paths that will not exist for a consumer.

```typescript
import { Effect, Schema } from "effect";
import {
  PackageJsonValidator,
  defaultRules,
  makePackageJsonValidatorLive,
  noLocalDepsRule,
  noUnresolvedDepsRule,
} from "package-json-effect";
import { PackageJsonSchema } from "package-json-effect/schema";

const PublishValidatorLive = makePackageJsonValidatorLive({
  rules: [...defaultRules, noUnresolvedDepsRule, noLocalDepsRule],
});

const pkg = Schema.decodeUnknownSync(PackageJsonSchema)({
  name: "p",
  version: "1.0.0",
  description: "x",
  license: "MIT",
  repository: { url: "https://example.com" },
  dependencies: { lib: "workspace:*" },
});

const exit = Effect.runSyncExit(
  Effect.gen(function* () {
    const v = yield* PackageJsonValidator;
    return yield* v.validate(pkg);
  }).pipe(Effect.provide(PublishValidatorLive)),
);
console.log(exit._tag); // "Failure" — the workspace: specifier is unresolved
```

## Writing your own rule

A `ValidationRule` is an object with a `name` and a `validate` function. `validate` takes the `Package` and returns an `Effect` that succeeds (with `Effect.void`) when the rule passes or fails with a `RuleFailure` — an object with a `message` and an optional `path`.

```typescript
import { Effect, Option } from "effect";
import type { ValidationRule } from "package-json-effect";

const hasKeywords: ValidationRule = {
  name: "has-keywords",
  validate: (pkg) =>
    Object.hasOwn(pkg.rest, "keywords")
      ? Effect.void
      : Effect.fail({ message: "Missing keywords field", path: Option.some("keywords") }),
};
```

Reach into `pkg.rest` for unmodeled fields like `keywords`, and use the typed getters (`pkg.isPrivate`, `pkg.isScoped`, `pkg.hasDependency(...)`) or the dependency instances for fields the model exposes directly. A rule can also yield an `Effect` with work in it — anything that ends in `Effect.void` or `Effect.fail` is valid.

## Building a validator layer

`makePackageJsonValidatorLive` takes a config with a `rules` array and returns a `Layer`. Compose the default rules, the publish-readiness rules and your own in whatever combination fits, then provide that layer instead of `PackageJsonValidatorLive`.

```typescript
import { Effect, Option, Schema } from "effect";
import type { ValidationRule } from "package-json-effect";
import {
  PackageJsonValidator,
  defaultRules,
  makePackageJsonValidatorLive,
} from "package-json-effect";
import { PackageJsonSchema } from "package-json-effect/schema";

const hasKeywords: ValidationRule = {
  name: "has-keywords",
  validate: (pkg) =>
    Object.hasOwn(pkg.rest, "keywords")
      ? Effect.void
      : Effect.fail({ message: "Missing keywords field", path: Option.some("keywords") }),
};

const MyValidatorLive = makePackageJsonValidatorLive({ rules: [...defaultRules, hasKeywords] });

const pkg = Schema.decodeUnknownSync(PackageJsonSchema)({
  name: "p",
  version: "1.0.0",
  description: "x",
  license: "MIT",
  repository: { url: "https://example.com" },
});

const exit = Effect.runSyncExit(
  Effect.gen(function* () {
    const v = yield* PackageJsonValidator;
    return yield* v.validate(pkg);
  }).pipe(Effect.provide(MyValidatorLive)),
);
console.log(exit._tag); // "Failure" — keywords is missing, every other rule passes
```

`PackageJsonValidator` is a `Context.Tag` like every other service. Any consumer that yields it picks up whichever layer you provide, so swapping the layer at the edge of your program changes the rules everywhere downstream.
