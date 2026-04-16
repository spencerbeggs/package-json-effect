# Contributing

## Prerequisites

- Node.js 24+
- pnpm 10+

## Setup

```bash
git clone https://github.com/spencerbeggs/package-json-effect.git
cd package-json-effect
pnpm install
```

## Development commands

| Command | Description |
| ------- | ----------- |
| `pnpm test` | Run all tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:coverage` | Run tests with v8 coverage report |
| `pnpm lint` | Check code with Biome |
| `pnpm lint:fix` | Auto-fix lint issues |
| `pnpm typecheck` | Type-check via Turbo |
| `pnpm build` | Build dev and prod outputs |
| `pnpm build:dev` | Build development output only |
| `pnpm build:prod` | Build production output only |

## Code quality

Linting and formatting are handled by [Biome](https://biomejs.dev/). The configuration
extends `@savvy-web/lint-staged/biome/silk.jsonc`. Biome runs automatically on staged
files before each commit via Husky and lint-staged.

Tests use [Vitest](https://vitest.dev/) with the `forks` pool and v8 coverage. Build
orchestration uses [Turbo](https://turbo.build/).

## Commits

All commits require:

1. Conventional commit format: `feat`, `fix`, `chore`, `docs`, `test`, etc.
2. DCO signoff: `Signed-off-by: Your Name <your@email.com>`

Add a signoff automatically with:

```bash
git commit -s -m "feat: add support for funding field"
```

## Pull requests

1. Branch from `main`
2. Keep changes focused — one feature or fix per PR
3. Ensure all tests pass: `pnpm test`
4. Ensure type-checking passes: `pnpm typecheck`
5. Ensure lint passes: `pnpm lint`
6. Open a PR against `main` and describe what changed and why

Versioning is managed via [Changesets](https://github.com/changesets/changesets).
If your change affects the public API or fixes a bug, include a changeset.
