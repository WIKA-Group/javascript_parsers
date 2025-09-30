# Repository Setup

This guide explains how to work with the public mirror of the WIKA parser monorepo, install dependencies with pnpm, and understand the workspace layout before you begin developing new codecs or device profiles.

## Mirror model and contribution flow

This repository is a read-only mirror. See [Contributing](/contributors/contributing) for full details on filing issues and PRs.

## Environment prerequisites

| Tool | Recommended version | Notes |
| --- | --- | --- |
| Node.js | 20 LTS or newer | Aligns with pnpm 10 and modern TypeScript tooling. `nvm install 20` or `fnm install 20` if you manage multiple runtimes. |
| pnpm | 10.15.0 | Matches the `packageManager` field in the root `package.json`. Install via `corepack enable` (Node ≥16.10) or `npm install -g pnpm@10.15.0`. |
| Git | Latest stable | Clone the GitHub mirror. |

Once Node and pnpm are installed, run `pnpm --version` to confirm the pinned version before continuing.

## Cloning the workspace

```bash
git clone https://github.com/WIKA-Group/javascript_parsers.git
cd javascript_parsers
```

All subsequent commands should be executed from the repository root unless otherwise stated.

## Bootstrapping the pnpm workspace

Install dependencies across every package:

```bash
pnpm install
```

Common follow-up commands:

**Generate schemas and build all packages**

```bash
pnpm build
```

This runs `pnpm -r schema` followed by `pnpm -r build`, orchestrating the per-package scripts.

**Run unit tests and coverage**

```bash
pnpm test
pnpm coverage
```

**Type-check and lint**

```bash
pnpm typecheck
pnpm lint
pnpm lint:fix
```

**Work on the documentation site**

```bash
pnpm docs:dev
```

The pnpm workspace is configured in `pnpm-workspace.yaml`, which scopes everything under `packages/*` and `examples/*`.

## Packages in this repository

| Path | Name | Purpose |
| --- | --- | --- |
| `packages/parsers` | `@w2a-iiot/raw-javascript-parsers` | Source of the device parsers used for building distribution bundles (raw JS codecs, device assets, schemas, tests). Contains scripts for building release artefacts and running schema generation. |
| `packages/library` | `@w2a-iiot/parsers` | Typed library wrapper that exposes parser factory functions for application use. Built with `tsdown` and published separately. |
| `examples/server`, `examples/web` | Example integrations | Minimal applications demonstrating how to host or embed parsers. Useful for manual testing or reference when integrating with third-party platforms. |

When targeting a specific package, use pnpm filters. Examples:

```bash
pnpm --filter @w2a-iiot/raw-javascript-parsers build
pnpm --filter @w2a-iiot/parsers build
```

## Working effectively with pnpm

- Run `pnpm install --frozen-lockfile` on CI or when validating incoming contributions to ensure the `pnpm-lock.yaml` remains authoritative.
- Use `pnpm --filter <package>` or `pnpm --recursive` (`pnpm -r`) to limit script execution to the packages you are modifying.
- Generated assets (e.g., `dist/` folders) live alongside their packages; clean them with `pnpm --filter <package> clean` if such scripts are added, or delete the directories manually before rebuilding.

## Troubleshooting

- **Version mismatches**:<br>If pnpm warns about incompatible Node versions, switch with your version manager (e.g. `nvm use 20`) before retrying the install.
- **Stale dependencies**:<br>Remove the lockfile and reinstall only if absolutely necessary. Prefer `pnpm install --force` to refresh the `node_modules` directory without altering dependency versions.
- **Binary rebuilds**:<br>Some dependencies (`@parcel/watcher`, `esbuild`) are marked under `onlyBuiltDependencies` to ensure pnpm compiles them locally; rerun `pnpm install` after Node upgrades.

With the environment ready, continue to the [Parser Development](/contributors/parser-development) guide to implement or extend device support, and consult [Testing](/contributors/testing) for validation expectations.
