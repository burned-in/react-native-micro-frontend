# Package managers and CLI commands

This project is Bun-first and supports `bun`, `npm`, `pnpm`, `yarn`, and `deno` for consumer workflows. This page also lists every RNM CLI command added for integration, watcher, bundle, verify, and publish flows.

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

## RNM CLI command reference

Every command supports friendly help for the installed CLI version:

```bash
rnm --help
rnm help
rnm <command> --help
rnm <command> -h
```

### Host integration commands

| Command | Purpose |
| --- | --- |
| `rnm package <mfe>` | Detect missing JS/native package dependencies and add them to the Host `package.json` after confirmation. |
| `rnm aos <mfe>` / `rnm android <mfe>` | Detect Android Gradle projects, Gradle dependencies, and permissions; write generated Android include files or Expo plugin data. |
| `rnm ios <mfe>` | Detect iOS Pods; write generated Podfile include files or Expo plugin data. |
| `rnm all <mfe>` | Run every integration in the safe order: `package -> AOS -> iOS`. |
| `rnm integrate all <mfe>` | Backward-compatible explicit integration route. |
| `rnm expo <mfe>` | Run the same integration watcher and OTA eligibility gate, then print an Expo EAS Update deploy command. |

```bash
rnm package mfe-feature --dry-run
rnm aos mfe-feature --yes
rnm android mfe-feature --yes
rnm ios mfe-feature --yes
rnm all mfe-feature --yes
```

### Expo support

The same CLI commands support Expo managed, prebuild, and bare/prebuilt Host Apps. See `examples/expo` for an Expo Host and MFE config loaded through Bun (`mfe.config.mjs`; `.cjs` is supported too). In bare/prebuilt projects, RNM writes generated Podfile and Gradle include files. In managed projects without `ios/` or `android/`, RNM writes `rnm.expo-plugin.cjs` and `rnm.expo-integration.json`, then adds the plugin to `app.json` when possible.

```bash
rnm add mfe-feature --path ../mfe-feature --yes
rnm all mfe-feature --yes
npx expo prebuild
```

For Expo EAS Update delivery, register the MFE with the Expo OTA provider and print the EAS deploy command after RNM's native-safety gate passes. During `rnm add --ota-provider expo`, the package watcher also shows missing Host packages such as `expo` and `expo-updates`, then applies them when you choose yes or pass `--yes`.

```bash
rnm add mfe-feature --path ../mfe-feature --ota-provider expo --ota-mode manual --yes
rnm expo mfe-feature --channel production --platform all --non-interactive
# same route through publish
rnm publish mfe-feature --provider expo --channel production --platform all --non-interactive
```

### Automatic integration watcher

`rnm add`, `rnm bundle --host`, `rnm verify`, `rnm publish`, and `rnm expo` watch for missing `package -> AOS -> iOS` additions before continuing. In an interactive terminal RNM asks whether to apply detected additions.

```bash
rnm add mfe-feature --path ../mfe-feature --yes
rnm bundle mfe-feature --platform ios --host ../host-app --yes
rnm verify mfe-feature --skip-integration
rnm publish mfe-feature --package-manager bun --channel production --skip-integration
rnm expo mfe-feature --channel production --platform all --skip-integration
```

Use `--yes` for non-interactive apply, direct integration commands with `--dry-run` to inspect changes, and `--skip-integration` when you intentionally want to run only the original add/bundle/verify/publish/expo command.

### Lifecycle and diagnostics commands

| Command | Purpose |
| --- | --- |
| `rnm init` | Create reviewable Host config, registry, native contract, and generated include files. |
| `rnm build` | Print React Native bundle commands and optional archive output paths. |
| `rnm bundle` | Build a minimal archive containing `index.bundle`, `manifest.json`, and only referenced runtime assets. |
| `rnm diff` | Compare Host and MFE native contracts. |
| `rnm sync` | Record native-change decisions such as blocking an MFE or disabling OTA after native changes. |
| `rnm status` | Print registered MFE status from `rnm.registry.json`. |
| `rnm doctor` | Read-only project setup diagnostics. |
| `rnm rollback` | Restore `.bak` files created before patching existing files. |

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

Expo EAS Update can use either `rnm expo` or `rnm publish --provider expo`:

| `--package-manager` | Expo EAS Update command |
| --- | --- |
| `bun` | `bunx eas-cli@latest update --channel production --message 'RNM mfe-feature@1.0.0' --platform all` |
| `npm` | `npx eas-cli@latest update --channel production --message 'RNM mfe-feature@1.0.0' --platform all` |
| `pnpm` | `pnpm dlx eas-cli@latest update --channel production --message 'RNM mfe-feature@1.0.0' --platform all` |
| `yarn` | `yarn dlx eas-cli@latest update --channel production --message 'RNM mfe-feature@1.0.0' --platform all` |
| `deno` | `deno run -A npm:eas-cli update --channel production --message 'RNM mfe-feature@1.0.0' --platform all` |

Use `--branch`, `--auto`, `--environment`, and `--non-interactive` when your EAS workflow needs those options.

## Bundle archive command

Run this from the MFE project after installing the CLI. It executes React Native bundling, automatically collects referenced runtime assets, and archives `index.bundle`, `manifest.json`, and the verified asset files.

```bash
rnm bundle mfe-feature --platform ios --host ../host-app --update-registry --yes
```

To inspect asset collection without creating the final tarball, run `rnm bundle-asset mfe-feature --platform ios --entry ./src/index.tsx`. Use `--asset-glob` only as a fallback for dynamic require patterns.

Use the same command through each runner: `bunx ... bundle`, `npx ... bundle`, `pnpm dlx ... bundle`, `yarn dlx ... bundle`, or `deno run -A ... bundle`. With `--host`, the CLI generates `rnm.bundle-archives.ts`; it prompts for the Host entry import unless you pass `--yes` or `--register-archives`.
