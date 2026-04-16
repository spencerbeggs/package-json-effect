---
status: current
module: package-json-effect
category: architecture
created: 2026-04-16
updated: 2026-04-16
last-synced: 2026-04-16
completeness: 95
related:
  - .claude/design/package-json-effect/architecture.md
dependencies: []
---

# package.json Specification Reference

Comprehensive field reference derived from the npm CLI v11 docs and Node.js
v25 packages documentation. This document drives schema design decisions for
package-json-effect.

## Table of Contents

1. [Required Fields](#required-fields)
2. [Metadata Fields](#metadata-fields)
3. [Person Format](#person-format)
4. [File and Entry Point Fields](#file-and-entry-point-fields)
5. [Exports Field](#exports-field)
6. [Imports Field](#imports-field)
7. [Dependency Fields](#dependency-fields)
8. [Overrides Field](#overrides-field)
9. [Scripts and Config](#scripts-and-config)
10. [Engine and Platform Fields](#engine-and-platform-fields)
11. [Publishing Fields](#publishing-fields)
12. [Workspace Fields](#workspace-fields)
13. [Default Behaviors](#default-behaviors)
14. [Schema Design Notes](#schema-design-notes)

---

## Required Fields

### name

- **Type:** `string`
- **Required:** Yes (for published packages)
- **Constraints:**
  - Max 214 characters (including scope)
  - Must be lowercase
  - URL-safe characters only
  - Cannot start with `.` or `_` (unless scoped)
  - No `js` or `node` suffixes recommended
  - Scoped format: `@scope/name`

### version

- **Type:** `string` (semver)
- **Required:** Yes (for published packages)
- **Constraints:**
  - Must be parseable by node-semver
  - Combined with name forms a unique identifier
  - Changes to package should accompany version bump

---

## Metadata Fields

### description

- **Type:** `string`
- **Optional**
- **Purpose:** Helps discovery via `npm search`

### keywords

- **Type:** `string[]`
- **Optional**
- **Purpose:** Improves discoverability

### homepage

- **Type:** `string` (URL)
- **Optional**

### bugs

- **Type:** `string | { url?: string, email?: string }`
- **Optional**
- **Forms:**
  - String: URL to issue tracker
  - Object: `url` and/or `email` fields

### license

- **Type:** `string`
- **Optional**
- **Forms:**
  - SPDX identifier: `"MIT"`, `"BSD-3-Clause"`
  - SPDX expression: `"(ISC OR GPL-3.0)"`
  - Custom reference: `"SEE LICENSE IN <filename>"`
  - Unlicensed: `"UNLICENSED"`

### funding

- **Type:** `string | { type: string, url: string } | Array<string | { type: string, url: string }>`
- **Optional**
- **Forms:**
  - String URL
  - Object with `type` and `url`
  - Array of mixed string URLs and objects

### repository

- **Type:** `string | { type: string, url: string, directory?: string }`
- **Optional**
- **Forms:**
  - Full object: `{ "type": "git", "url": "https://..." }`
  - GitHub shorthand: `"github:user/repo"` or `"user/repo"`
  - Bitbucket shorthand: `"bitbucket:user/repo"`
  - GitLab shorthand: `"gitlab:user/repo"`
  - Gist shorthand: `"gist:id"`
  - Monorepo: includes `directory` field

---

## Person Format

Used by `author` and `contributors` fields.

### author

- **Type:** `Person | string`
- **Optional**
- **One person**

### contributors

- **Type:** `Array<Person | string>`
- **Optional**

### Person object

```text
{
  "name": string (required),
  "email"?: string,
  "url"?: string
}
```

### Person string shorthand

```text
"Name <email> (url)"
```

All parts except name are optional:

- `"Barney Rubble"`
- `"Barney Rubble <b@rubble.com>"`
- `"Barney Rubble <b@rubble.com> (http://barnyrubble.tumblr.com/)"`

---

## File and Entry Point Fields

### files

- **Type:** `string[]`
- **Optional** (defaults to `["*"]`)
- **Syntax:** Follows .gitignore-like patterns (but inclusive)
- **Always included (cannot exclude):**
  - `package.json`
  - `README` (any case/extension)
  - `LICENSE` / `LICENCE` (any case/extension)
  - Files referenced by `main` field
  - Files referenced by `bin` field
- **Always excluded (cannot include):**
  - `.git`
  - `.npmrc`
  - `node_modules`
  - Package lock files
- **Note:** Can also use `.npmignore` (inverse logic, like `.gitignore`)

### main

- **Type:** `string`
- **Optional** (defaults to `index.js`)
- **Purpose:** Primary entry point module ID
- **Note:** Superseded by `exports` when both present

### browser

- **Type:** `string`
- **Optional**
- **Purpose:** Client-side module entry (hint to bundlers)

### type

- **Type:** `"module" | "commonjs"`
- **Optional** (defaults to `"commonjs"`)
- **Purpose:** Tells Node.js how to interpret `.js` files
- **Scope:** Applies to all `.js` files in nearest parent package
- **Behavior:**
  - `"module"`: `.js` = ESM, `.cjs` = CJS
  - `"commonjs"`: `.js` = CJS, `.mjs` = ESM
  - `.mjs` is always ESM, `.cjs` is always CJS regardless

### bin

- **Type:** `string | Record<string, string>`
- **Optional**
- **Forms:**
  - String: single executable, command name = package name
  - Object: map of command names to file paths
- **Rules:**
  - Files must start with `#!/usr/bin/env node`
  - Can also be configured via `directories.bin`
- **Example:**

```json
{ "bin": "./cli.js" }
{ "bin": { "myapp": "./cli.js", "myhelper": "./helper.js" } }
```

### man

- **Type:** `string | string[]`
- **Optional**
- **Rules:**
  - Files must end with a number (optionally `.gz`)
  - Example: `"./man/doc.1"`, `"./man/doc.1.gz"`
- **Also configurable via:** `directories.man`

### directories

- **Type:** `{ bin?: string, man?: string }`
- **Optional**
- **Sub-fields:**
  - `bin`: Directory of executables (alternative to `bin` field)
  - `man`: Directory of man pages (alternative to `man` field)

---

## Exports Field

The modern replacement for `main`. When defined, all subpaths not explicitly
exported are encapsulated (ERR_PACKAGE_PATH_NOT_EXPORTED). Supported in
Node.js 12+.

### Type

```text
string
  | Record<string, ExportTarget>
  | ConditionalExport
```

Where `ExportTarget` is:

```text
string           // relative path starting with ./
  | null         // explicitly block this subpath
  | ConditionalExport
  | ExportTarget[]   // fallback array (first valid wins)
```

And `ConditionalExport` is:

```text
Record<ConditionKey, ExportTarget>
```

### Subpath exports

```json
{
  ".": "./index.js",
  "./feature": "./src/feature.js",
  "./utils/*": "./src/utils/*.js",
  "./internal/*": null
}
```

- Keys must start with `.`
- Targets must start with `./`
- No path traversal (`..`) in targets
- Wildcard `*` is string replacement (not glob)
- `null` explicitly blocks a subpath

### Condition keys

Evaluated in definition order, first match wins.

**Built-in (Node.js):**

| Key | Description |
| --- | --- |
| `types` | TypeScript declarations (must be first) |
| `node-addons` | C++ addon builds; disabled by `--no-addons` |
| `node` | Any Node.js environment |
| `import` | Loaded via `import` or `import()` |
| `require` | Loaded via `require()` |
| `module-sync` | Loaded via `import`, `import()`, or `require()` (no TLA) |
| `default` | Universal fallback (must be last) |

**Community-defined:**

| Key | Description |
| --- | --- |
| `types` | TypeScript type definitions |
| `browser` | Browser environment |
| `development` | Dev-only (mutually exclusive with `production`) |
| `production` | Production-only (mutually exclusive with `development`) |

**Custom conditions:** Enabled via `node --conditions=name`. Must not start
with `.`, contain `,`, or be integer keys.

### Condition ordering (recommended)

1. `types`
2. Environment-specific (`node`, `node-addons`, `browser`)
3. Format-specific (`import`, `require`, `module-sync`)
4. `default`

### Nesting

Conditions can nest arbitrarily:

```json
{
  ".": {
    "node": {
      "import": "./node-esm.js",
      "require": "./node-cjs.cjs"
    },
    "default": "./browser.js"
  }
}
```

### Interaction with main

- `exports` takes precedence over `main` when both exist
- Include `main` for backward compatibility with Node.js < 12

### Sugar form

Single export can be just a string:

```json
{ "exports": "./index.js" }
```

Equivalent to:

```json
{ "exports": { ".": "./index.js" } }
```

### Self-referencing

A package can import from itself by name when `exports` is defined:

```javascript
import { something } from 'my-package';       // resolves "." export
import { thing } from 'my-package/feature';    // resolves "./feature" export
```

---

## Imports Field

Private mappings for imports within the package. Not accessible from outside.

### Type

```text
Record<string, ImportTarget>
```

Where keys must start with `#`.

### Rules

- All import specifiers must start with `#`
- Can map to external packages (unlike `exports`)
- Supports same conditional logic and patterns as `exports`
- Applies only to imports from within the package

### Example

```json
{
  "imports": {
    "#dep": {
      "node": "dep-node-native",
      "default": "./dep-polyfill.js"
    },
    "#internal/*.js": "./src/internal/*.js"
  }
}
```

---

## Dependency Fields

### dependencies

- **Type:** `Record<string, string>`
- **Version specifiers:**
  - Exact: `"1.0.0"`
  - Range: `">=1.0.2 <2.1.2"`
  - Tilde: `"~1.2.3"` (patch-level changes)
  - Caret: `"^1.0.0"` (minor-level changes)
  - Wildcard: `"*"`, `"1.2.x"`, `"1.x"`
  - Tag: `"latest"`, `"next"`
  - URL: tarball URLs
  - Git: `"git+https://..."`, `"git+ssh://..."`
  - GitHub: `"user/repo"`, `"user/repo#branch"`, `"user/repo#semver:^1.0"`
  - Local path: `"file:../local-pkg"`

### devDependencies

- **Type:** `Record<string, string>` (same specifiers as dependencies)
- **Purpose:** Development/testing tools, not installed in production
- **Note:** Used for build steps via `prepare` script

### peerDependencies

- **Type:** `Record<string, string>`
- **Purpose:** Plugin compatibility with host package
- **Behavior:** Automatically installed in npm v7+
- **Convention:** Use broad ranges (`^1.0`, `1.x`)

### peerDependenciesMeta

- **Type:** `Record<string, { optional?: boolean }>`
- **Purpose:** Marks peer deps as optional (prevents auto-install)

### optionalDependencies

- **Type:** `Record<string, string>`
- **Purpose:** Dependencies that should not fail install if missing
- **Note:** Overrides entries in `dependencies` with same name
- **Skipped with:** `npm install --omit=optional`

### bundleDependencies

- **Type:** `string[] | boolean`
- **Purpose:** Names of packages to bundle when publishing
- **Forms:**
  - Array of package names
  - `true`: bundle all dependencies
  - `false`: bundle none

---

## Overrides Field

Forces specific versions of transitive dependencies. Only honored in root
package.json.

### Type

```text
Record<string, string | OverrideSpec>
```

Where `OverrideSpec` can nest:

```text
{
  ".": string,               // version for this package
  [childPackage]: string | OverrideSpec  // scoped overrides
}
```

### Specifiers

- Version range: `"1.0.0"`, `"^2.0.0"`
- `$` prefix: references own package's dependency version
- `npm:` prefix: replace with different package
- GitHub/local paths: same as dependency specifiers

### Nesting (scope by parent)

```json
{
  "overrides": {
    "foo": {
      ".": "1.0.0",
      "bar": "1.0.0"
    }
  }
}
```

Means: override `foo` to 1.0.0, and within `foo`, override `bar` to 1.0.0.

---

## Scripts and Config

### scripts

- **Type:** `Record<string, string>`
- **Purpose:** Lifecycle event commands
- **Well-known keys:** `start`, `test`, `build`, `prepare`, `prepublishOnly`,
  `preinstall`, `install`, `postinstall`, `preuninstall`, `uninstall`,
  `postuninstall`, `prepack`, `pack`, `postpack`, `prepublish`,
  `publish`, `postpublish`, `preversion`, `version`, `postversion`,
  `preshrinkwrap`, `shrinkwrap`, `postshrinkwrap`
- **Pre/post hooks:** `pre<script>` and `post<script>` run automatically

### config

- **Type:** `Record<string, string>`
- **Purpose:** Parameters for scripts, accessible as `npm_package_config_*`
  environment variables
- **Persists across upgrades**

### gypfile

- **Type:** `boolean`
- **Optional** (defaults to `true` if `binding.gyp` exists)
- **Purpose:** Set `false` to suppress automatic `node-gyp rebuild`

---

## Engine and Platform Fields

### engines

- **Type:** `{ node?: string, npm?: string }`
- **Optional**
- **Values:** Semver ranges (e.g., `">=18.0.0"`, `"^20.0.0"`)
- **Behavior:** Advisory only unless `engine-strict` config is set

### os

- **Type:** `string[]`
- **Optional**
- **Values:** OS names from `process.platform`
- **Negation:** Prefix with `!` to block (e.g., `"!win32"`)

### cpu

- **Type:** `string[]`
- **Optional**
- **Values:** Architecture names from `process.arch`
- **Negation:** Prefix with `!` to block (e.g., `"!arm"`)

### libc

- **Type:** `string[]`
- **Optional** (Linux only)
- **Values:** libc implementation names (e.g., `"glibc"`, `"musl"`)

### devEngines

- **Type:** Complex object for development environment constraints
- **Properties:** `cpu`, `os`, `libc`, `runtime`, `packageManager`
- **Each property:** `DevEngine | DevEngine[]`
- **DevEngine shape:**

```text
{
  "name": string,
  "version"?: string,
  "onFail"?: "warn" | "error" | "ignore"
}
```

---

## Publishing Fields

### private

- **Type:** `boolean`
- **Optional** (defaults to `false`)
- **Purpose:** Set `true` to prevent accidental publication

### publishConfig

- **Type:** `object`
- **Optional**
- **Common sub-fields:**
  - `tag`: dist-tag for publish (default: `"latest"`)
  - `registry`: override registry URL
  - `access`: `"public"` or `"restricted"` (for scoped packages)

---

## Workspace Fields

### workspaces

- **Type:** `string[]`
- **Optional**
- **Purpose:** File patterns locating local workspace packages
- **Behavior:** Matched packages are symlinked into top-level `node_modules`
- **Example:**

```json
{ "workspaces": ["packages/*", "apps/*"] }
```

---

## Default Behaviors

npm sets defaults automatically based on file existence:

- `"start"` script defaults to `node server.js` if `server.js` exists
- `"install"` script defaults to `node-gyp rebuild` if `binding.gyp` exists
- `AUTHORS` file is parsed into `contributors` array

---

## Schema Design Notes

Observations for building Effect schemas:

### Complexity tiers

**Tier 1 - Simple scalars:** `name`, `version`, `description`, `homepage`,
`license`, `private`, `type`, `main`, `browser`

**Tier 2 - Union types:** `bugs` (string | object), `repository`
(string | object), `author` (Person | string), `bin` (string | object),
`man` (string | string[]), `funding` (string | object | array),
`bundleDependencies` (string[] | boolean)

**Tier 3 - Record types:** `dependencies`, `devDependencies`,
`peerDependencies`, `optionalDependencies`, `peerDependenciesMeta`,
`scripts`, `config`, `engines`, `overrides`, `publishConfig`

**Tier 4 - Complex/recursive:** `exports` (deeply nested conditional +
subpath patterns), `imports` (similar to exports), `overrides` (recursive
nesting), `devEngines` (structured objects with enums)

### Branded type candidates

- `PackageName` (validated string with npm naming rules)
- `SemVerString` (valid semver, could integrate with semver-effect)
- `UrlString` (valid URL)
- `ExportsPath` (must start with `./`)
- `ImportsKey` (must start with `#`)
- `SpdxLicense` (valid SPDX identifier or expression)
- `DependencySpecifier` (version range | URL | git | file path)

### Key quirks to handle

- `exports` completely supersedes `main` when present
- `optionalDependencies` overrides same-name `dependencies` entries
- `overrides` is only honored in root package.json
- `files` always includes certain files regardless of config
- `bin` string form uses package `name` as command name
- `os`/`cpu` arrays support `!` prefix for negation
- Person string format needs parsing: `"Name <email> (url)"`
- Repository string has multiple shorthand forms to parse
- `bundleDependencies` can be boolean OR array
- `devEngines` properties can be single object or array of objects
