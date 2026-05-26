# Package manager matrix

This project is Bun-first and supports `bun`, `npm`, `pnpm`, `yarn`, and `deno` for consumer workflows.

## Install package

| Tool | Runtime package | CLI package |
| --- | --- | --- |
| Bun | `bun add @bunin/react-native-micro-frontend` | `bun add -d @bunin/react-native-micro-frontend-cli` |
| npm | `npm install @bunin/react-native-micro-frontend` | `npm install --save-dev @bunin/react-native-micro-frontend-cli` |
| pnpm | `pnpm add @bunin/react-native-micro-frontend` | `pnpm add -D @bunin/react-native-micro-frontend-cli` |
| Yarn | `yarn add @bunin/react-native-micro-frontend` | `yarn add -D @bunin/react-native-micro-frontend-cli` |
| Deno | `deno add npm:@bunin/react-native-micro-frontend` | `deno add --package-json --dev npm:@bunin/react-native-micro-frontend-cli` |

## Run CLI without installing globally

| Tool | Command |
| --- | --- |
| Bun | `bunx @bunin/react-native-micro-frontend-cli init` |
| npm | `npx @bunin/react-native-micro-frontend-cli init` |
| pnpm | `pnpm dlx @bunin/react-native-micro-frontend-cli init` |
| Yarn 2+ | `yarn dlx @bunin/react-native-micro-frontend-cli init` |
| Deno | `deno run -A npm:@bunin/react-native-micro-frontend-cli init` |

## Repository release commands

| Action | Bun | npm | pnpm | Yarn | Deno task |
| --- | --- | --- | --- | --- | --- |
| Version all | `bun run version:all 0.2.0` | `npm run version:all -- 0.2.0` | `pnpm version:all 0.2.0` | `yarn version:all 0.2.0` | `deno task version:all 0.2.0` |
| Check | `bun run release:check` | `npm run release:check` | `pnpm release:check` | `yarn release:check` | `deno task release:check` |
| Dry-run publish | `bun run release:dry-run` | `npm run release:dry-run` | `pnpm release:dry-run` | `yarn release:dry-run` | `deno task release:dry-run` |
| Publish | `bun run release:publish` | `npm run release:publish` | `pnpm release:publish` | `yarn release:publish` | `deno task release:publish` |

The repository release workflow still uses Bun internally for testing, building, packing, and publishing. Install Bun in CI even when the outer command is another package manager.

`pnpm-workspace.yaml` and `.npmrc` keep pnpm usable even though the repository declares Bun as the preferred `packageManager`.

## OTA deploy commands emitted by `rnm publish`

| `--package-manager` | Hot Updater command |
| --- | --- |
| `bun` | `bunx hot-updater deploy -p ios -c production` |
| `npm` | `npx hot-updater deploy -p ios -c production` |
| `pnpm` | `pnpm dlx hot-updater deploy -p ios -c production` |
| `yarn` | `yarn dlx hot-updater deploy -p ios -c production` |
| `deno` | `deno run -A npm:hot-updater deploy -p ios -c production` |

`rnm publish` prints deploy commands only after OTA eligibility passes.

## Bundle archive command

Run this from the MFE project after installing the CLI. It executes React Native bundling and archives only `index.bundle`, `assets/`, and `manifest.json`.

```bash
rnm bundle --platform ios --host ../host-app --update-registry
```

Use the same command through each runner: `bunx ... bundle`, `npx ... bundle`, `pnpm dlx ... bundle`, `yarn dlx ... bundle`, or `deno run -A ... bundle`.
