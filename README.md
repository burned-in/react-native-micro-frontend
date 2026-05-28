# @bunin/react-native-micro-frontend

**Native-safe micro frontends for React Native.**

Build feature modules independently, verify their native compatibility, and ship OTA updates only when the host binary can safely run them.

```txt
React Native Micro Frontend
  registry-driven modules
  native contract verification
  Metro bundle generation
  Hot Updater delivery
  runtime safety gates
```

## Development status

This project is still under active development. The public API is usable for experiments and early integration work, but the `0.x` line may still change while the runtime, CLI, and native-contract workflows are hardened.

Use it in production only after pinning exact package versions and running your own native compatibility checks in CI.

## Overview

`@bunin/react-native-micro-frontend` is a safety and integration layer for React Native teams that want independent feature delivery without losing control of native binary compatibility.

It does **not** replace Hot Updater. Hot Updater remains the OTA delivery engine; this library decides whether an MFE is safe to load or publish before that delivery happens.

Acknowledgement: this project began with strong inspiration from [Hot Updater](https://github.com/gronxb/hot-updater), the self-hostable React Native OTA project by [gronxb](https://github.com/gronxb). Hot Updater proved that React Native OTA can be open, practical, and infrastructure-owned; RNM builds on that inspiration by adding a native-contract and microfrontend governance layer around delivery. Thank you, gronxb.

## Highlights

| Capability              | What it does                                                                                                                                                                      |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MFE registry            | Keeps every feature module, entry point, OTA policy, and runtime status in one predictable registry.                                                                              |
| Native contract         | Hashes React Native version, Hermes, New Architecture, native dependencies, Podfile, Gradle, AndroidManifest, and Info.plist-sensitive inputs.                                    |
| OTA gate                | Blocks OTA when native assumptions no longer match the host binary.                                                                                                               |
| Runtime policy          | Refuses blocked or incompatible MFEs and falls back safely in the host app.                                                                                                       |
| Metro integration       | `withMfe` merges Metro config, watches registered MFE roots, and automatically maps shared packages to Host `node_modules`; `rnm build` still prints inspectable bundle commands. |
| Bundle archive          | `rnm bundle` runs React Native bundling and archives only `index.bundle`, Metro `assets/`, and `manifest.json` for Host copy/CDN delivery.                                        |
| Hot Updater adapter     | Reuses existing Hot Updater deployments instead of replacing them.                                                                                                                |
| Package manager support | Supports Bun, npm, pnpm, Yarn, and Deno for consumer workflows.                                                                                                                   |
| Expo support           | Supports Expo managed, prebuild, and bare/prebuilt Host Apps; `examples/expo` shows EAS Update plus Bun-loaded `mfe.config.mjs` / `.cjs` support.                                |
| CJS/MJS package output | Every published package exposes Bun-built ESM (`dist/mjs/*.mjs`) and CommonJS (`dist/cjs/*.cjs`) entry points.                                                                       |

Host/MFE config files can use TypeScript, MJS, CJS, or JSON variants. Metro and Hot Updater config detection also recognizes `.mjs` and `.cjs`.

## Quick start

```bash
bun add @bunin/react-native-micro-frontend
bun add -d @bunin/react-native-micro-frontend-cli
bunx @bunin/react-native-micro-frontend-cli init
```

```ts
import { defineReactNativeMicroFrontendConfig } from "@bunin/react-native-micro-frontend";

export default defineReactNativeMicroFrontendConfig({
  ota: {
    enabled: true,
    provider: "hot-updater",
    mode: "manual",
  },

  nativeChangePolicy: "ask",

  packageManager: {
    supported: ["bun", "deno", "npm", "pnpm", "yarn"],
    strategy: "follow-host",
  },

  mfes: {},
});
```

## Easy Way: bundle, Hot Updater/OTA, Expo menus

### Menu 1. Bundle — package only the files the Host needs

Use this when you want a portable archive that can be copied into the Host project, attached to a release, or uploaded to your own storage.

```bash
# in mfe-feature/
rnm bundle mfe-feature --platform ios --host ../host-app
```

```tsx
const loadMfeModule = createMicroFrontendLoader({
  custom: loadBundleArchive,
});
```

`rnm bundle` creates only `index.bundle`, `assets/`, `manifest.json`, and a `.tar.gz` archive. `--host` copies it to `<host>/.bundle/rnm/`; without `--update-registry` it stays a bundle-only/no-OTA flow. Your custom loader reads/downloads the archive, verifies it, unpacks it, and evaluates it with your runtime engine. Add `--update-registry` only when you intentionally want to write `bundleArchiveUrl`.

### Menu 2. OTA — publish through Hot Updater or a custom OTA pipeline

Use this when the MFE should be delivered remotely after native-safety verification. The library verifies the native contract first; Hot Updater or your OTA engine still owns distribution and JavaScript evaluation.

```bash
# in host-app/
rnm add mfe-feature --path ../mfe-feature --entry ./src/index.tsx --version 1.0.0 --ota-provider hot-updater --ota-mode manual
rnm verify mfe-feature
rnm publish mfe-feature --package-manager bun --channel production

# Expo EAS Update instead
rnm add mfe-feature --path ../mfe-feature --entry ./src/index.tsx --version 1.0.0 --ota-provider expo --ota-mode manual
# rnm add also shows/applies missing Host packages such as expo and expo-updates
rnm expo mfe-feature --channel production --platform all --non-interactive
```

```tsx
const loadMfeModule = createMicroFrontendLoader({
  hotUpdater: loadWithHotUpdater,
  custom: loadWithCustomOta,
});
```

Use `hotUpdater` when `ota.provider` is `hot-updater`; use `custom` when your registry points to a custom OTA URL or archive. If verification fails because native assumptions changed, ship a store release instead of OTA.

## Documentation

| Document                                                       | Description                                                                            |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| [`docs/index.md`](docs/index.md)                               | Official documentation home.                                                           |
| [`docs/getting-started.md`](docs/getting-started.md)           | First install, host config, MFE registration, verification, and runtime loading guide. |
| [`docs/easy-way.md`](docs/easy-way.md)                         | Choose Bundle, Hot Updater/OTA, or Expo usage.                                                  |
| [`docs/metro-bundle-archive.md`](docs/metro-bundle-archive.md) | Merge Metro and load bundle archives.                                                  |
| [`docs/options.md`](docs/options.md)                           | Complete Host config, MFE config, registry, and runtime options reference.             |
| [`README.md`](README.md)                                       | English official guide.                                                                |
| [`docs/README.ko.md`](docs/README.ko.md)                       | Korean guide.                                                                          |
| [`docs/README.ja.md`](docs/README.ja.md)                       | Japanese guide.                                                                        |
| [`docs/README.zh-CN.md`](docs/README.zh-CN.md)                 | Simplified Chinese guide.                                                              |
| [`docs/package-managers.md`](docs/package-managers.md)         | Package manager command matrix.                                                        |
| [`docs/native-contract.md`](docs/native-contract.md)           | Native contract notes.                                                                 |
| [`docs/repack-comparison.md`](docs/repack-comparison.md)     | RNM vs Re.Pack 5.x architecture and decision guide.                                    |

## Documentation website

The polished documentation website lives in `apps/docs-site` and is built with Vite, Vike, Panda CSS, React, and Three.js.

```bash
bun run docs:dev
bun run docs:typecheck
bun run docs:build
bun run docs:preview
```

Meaning:

- `/` is the homepage with a Three.js module-network hero.
- `/docs` is the beginner-friendly setup path.
- `/docs/getting-started` is the step-by-step first MFE setup guide.
- `/docs/options` is the complete options reference split into detailed sections.
- `/docs/hot-updater` is the routed Hot Updater configuration guide.
- `/docs/repack-comparison` compares RNM with Re.Pack 5.x.
- `/docs/package-managers` lists Bun, npm, pnpm, Yarn, and Deno commands.
- `/ko/docs`, `/zh-cn/docs`, and `/jp/docs` expose localized entry pages.

## What problem does this solve?

React Native code has two different deployment surfaces:

```txt
JS / assets / styles / business logic
  -> can usually be delivered by OTA

Pods / Gradle / AndroidManifest / Info.plist / RN version / Hermes / New Architecture
  -> requires a new native binary
```

This library keeps those surfaces separate. Every MFE gets a registry entry and a native contract. Before a bundle is published, the CLI checks whether the MFE still matches the host binary.

## Package layout

```txt
packages/
  core/
    Public types, config helpers, registry model, OTA eligibility, package manager detection.

  cli/
    rnm command line interface.

  native-contract/
    package.json, Podfile.lock, Gradle, AndroidManifest, RN/Hermes/New Architecture parsing.

  hot-updater-adapter/
    Hot Updater config detection, wrapper metadata, deploy command generation.

  metro-adapter/
    Metro config detection and MFE bundle command generation.

  react-native-runtime/
    Runtime registry facade, Provider, hook, and screen fallback policy.

  integration/
    Existing host app analysis, generated files, manual guide, safe patch and rollback helpers.

  config/
    Runtime JSON config loader for CLI and CI use.
```

## Install and run locally

```bash
bun install
bun test
bun run typecheck
bun run build
```

What this means:

- `bun test` runs regression tests for the core OTA rules, native hash, native diff, and package-manager detection.
- `bun run typecheck` validates all TypeScript packages as a monorepo.
- `bun run build` emits package `dist/` output with declaration files.

## Package manager support

This project is **Bun-first**, but it is not Bun-only.

There are two separate meanings of “package manager support”:

1. **Consumer support**: a host app or MFE can install and run the packages with `bun`, `npm`, `pnpm`, `yarn`, or `deno`.
2. **Repository release support**: this monorepo uses Bun as the release engine, and exposes equivalent script entry points for `bun`, `npm`, `pnpm`, `yarn`, and `deno task`.

### Install the runtime package

```bash
# Bun
bun add @bunin/react-native-micro-frontend

# npm
npm install @bunin/react-native-micro-frontend

# pnpm
pnpm add @bunin/react-native-micro-frontend

# Yarn
yarn add @bunin/react-native-micro-frontend

# Deno
deno add npm:@bunin/react-native-micro-frontend
```

Meaning:

- `@bunin/react-native-micro-frontend` contains the public config helpers, registry model, OTA gate, and runtime exports.
- Deno uses the `npm:` specifier for npm registry packages.
- React Native itself is still expected to be present in the host app.

### Run the CLI without installing it globally

```bash
# Bun
bunx @bunin/react-native-micro-frontend-cli init

# npm
npx @bunin/react-native-micro-frontend-cli init

# pnpm
pnpm dlx @bunin/react-native-micro-frontend-cli init

# Yarn 2+
yarn dlx @bunin/react-native-micro-frontend-cli init

# Deno
deno run -A npm:@bunin/react-native-micro-frontend-cli init
```

Meaning:

- every command resolves the same `rnm` CLI package
- `init` creates generated integration files, but does not silently patch native files
- Deno requires `-A` because the CLI reads and writes project files

### Install the CLI as a dev dependency

```bash
# Bun
bun add -d @bunin/react-native-micro-frontend-cli

# npm
npm install --save-dev @bunin/react-native-micro-frontend-cli

# pnpm
pnpm add -D @bunin/react-native-micro-frontend-cli

# Yarn
yarn add -D @bunin/react-native-micro-frontend-cli

# Deno
deno add --package-json --dev npm:@bunin/react-native-micro-frontend-cli
```

Meaning:

- installing the CLI is useful when CI must use a pinned CLI version
- `deno add --package-json --dev` records the CLI in `package.json` devDependencies on Deno 2.8+
- the CLI binary name is `rnm`
- package manager detection still follows host project settings and lockfiles

### Package manager detection order

```txt
1. explicit --package-manager flag
2. MFE local config
3. host config
4. lockfiles: bun.lockb, bun.lock, deno.json, deno.jsonc, package-lock.json, npm-shrinkwrap.json, pnpm-lock.yaml, yarn.lock
5. packageManager field in package.json
6. npm fallback
```

Meaning:

- explicit CLI input always wins
- lockfiles are treated as stronger evidence than `packageManager` text
- host/MFE package-manager mismatches are allowed, but reported as integration risk

### OTA publish command generated by `rnm publish`

```bash
rnm publish mfe-feature --package-manager bun
rnm publish mfe-feature --package-manager npm
rnm publish mfe-feature --package-manager pnpm
rnm publish mfe-feature --package-manager yarn
rnm publish mfe-feature --package-manager deno
```

The generated Hot Updater commands are:

```bash
bunx hot-updater deploy -p ios -c production
npx hot-updater deploy -p ios -c production
pnpm dlx hot-updater deploy -p ios -c production
yarn dlx hot-updater deploy -p ios -c production
deno run -A npm:hot-updater deploy -p ios -c production
```

Meaning:

- `rnm publish` first runs the OTA safety gate
- native contract mismatches block OTA before any deploy command is printed
- the package manager only changes how Hot Updater is invoked

### Repository script equivalents

```bash
# Bun, preferred
bun run release:dry-run
bun run release:publish

# npm
npm run release:dry-run
npm run release:publish

# pnpm
pnpm release:dry-run
pnpm release:publish

# Yarn
yarn release:dry-run
yarn release:publish

# Deno task
deno task release:dry-run
deno task release:publish
```

Meaning:

- all entries call the same release workflow
- the workflow itself uses Bun for tests, builds, pack, and publish
- CI should install Bun even when the outer command is `npm`, `pnpm`, `yarn`, or `deno task`
- `pnpm-workspace.yaml` and `.npmrc` keep pnpm usable even though the repository declares Bun as the preferred `packageManager`.

## CLI command map

For exact options, run `rnm --help` or `rnm <command> --help`. The integration commands added for Host setup are:

| Command | Purpose |
| --- | --- |
| `rnm package <mfe>` | Add missing JS/native package dependencies after confirmation. |
| `rnm aos <mfe>` / `rnm android <mfe>` | Add Android Gradle projects, dependencies, and permissions. |
| `rnm ios <mfe>` | Add iOS Podfile integration. |
| `rnm all <mfe>` | Run `package -> AOS -> iOS` in order. |
| `rnm integrate all <mfe>` | Explicit backward-compatible integration route. |
| `rnm expo <mfe>` | Print an Expo EAS Update deploy command after integration watcher and OTA safety checks. |

`rnm add`, `rnm bundle --host`, `rnm verify`, `rnm publish`, and `rnm expo` run the integration watcher automatically. Use `--yes` to apply additions in automation or `--skip-integration` to skip the watcher. See [Package managers and CLI commands](docs/package-managers.md) for the full command reference.

## CLI examples

### 1. Initialize a host app

```bash
rnm init
```

Meaning:

- creates `react-native-micro-frontend.config.ts`
- creates `rnm.registry.json`
- creates `rnm.native-contract.json`
- creates generated native include files such as `ios/Podfile.rnm.generated.rb`
- does **not** silently patch your existing Podfile, Gradle files, or Metro config

Dry-run example:

```bash
rnm init --dry-run
```

Meaning:

- prints the planned files
- writes nothing
- is safe for CI probes and first-time audits

### 2. Register an MFE

```bash
rnm add mfe-feature \
  --path ../mfe-feature \
  --entry ./src/index.tsx \
  --version 1.0.0 \
  --ota-mode manual \
  --ota-provider hot-updater
```

Meaning:

- `mfe-feature` becomes a known MFE in `rnm.registry.json`
- its entry file is used by Metro bundle generation
- OTA is enabled but still blocked later if native compatibility fails

### 3. Verify OTA eligibility

```bash
rnm verify mfe-feature
```

Meaning:

- checks registry state
- checks whether the MFE is blocked
- checks whether `nativeHash` differs from the host hash
- exits non-zero when OTA is unsafe

### 4. Compare native contracts

```bash
rnm diff mfe-feature
```

Meaning:

- reads host `rnm.native-contract.json`
- reads `../mfe-feature/rnm.native-contract.json`
- prints native differences
- reports whether a store release is required

### 5. Handle native changes explicitly

Apply native changes policy:

```bash
rnm sync mfe-feature --apply-native
```

Meaning:

- marks the MFE as active
- disables OTA for that MFE version
- prints the “OTA DISABLED” store-release warning box

Block native changes policy:

```bash
rnm sync mfe-feature --block-native
```

Meaning:

- marks the MFE as blocked
- runtime loading is blocked
- OTA publish is blocked

### 6. Generate a Metro bundle command

```bash
rnm build mfe-feature \
  --platform ios \
  --type ota \
  --entry ./src/index.tsx
```

Meaning:

- prints a Metro `react-native bundle` command
- does not require Re.Pack or replace Metro
- separates command generation from execution so CI can inspect the exact command

### 6a. Merge Metro config with `withMfe`

```js
const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");

module.exports = (async () => {
  const { withMfe } = await import("@bunin/react-native-micro-frontend/metro");
  const defaultConfig = getDefaultConfig(__dirname);

  return withMfe(
    __dirname,
    mergeConfig(defaultConfig, {
      resolver: {
        assetExts: [...defaultConfig.resolver.assetExts, "lottie"],
      },
    })
  );
})();
```

Meaning:

- reads `rnm.registry.json` automatically
- adds active MFE project roots to Metro `watchFolders`
- maps shared dependencies such as `react`, `react-native`, `@bunin/react-native-micro-frontend`, and Host/MFE dependency intersections to Host `node_modules`
- preserves your existing `resolver.extraNodeModules` overrides, so manual aliases still win

### 6b. Build a minimal compressed bundle archive

```bash
# In the MFE project
rnm bundle mfe-feature --platform ios --host ../host-app --update-registry
```

Meaning:

- runs the local React Native `bundle` command instead of only printing it
- writes only `index.bundle`, Metro `assets/`, and `manifest.json`
- compresses those files to `dist/rnm-bundles/<mfe>/<platform>/<mfe>.<platform>.ota.tar.gz`
- when `--host` is provided, copies the archive to `<host>/.bundle/rnm/`
- when `--update-registry` is also provided, updates Host `rnm.registry.json` with `bundleArchiveUrl`

For CI-only command inspection, keep using `rnm build <mfe> --archive`.

### 7. Publish through Hot Updater after verification

```bash
rnm publish mfe-feature \
  --package-manager pnpm \
  --channel production
```

Meaning:

- runs the OTA gate first
- fails if nativeHash mismatches or the MFE is blocked
- prints Hot Updater deploy commands only after OTA is allowed

## Config example

```ts
import { defineReactNativeMicroFrontendConfig } from "@bunin/react-native-micro-frontend";

export default defineReactNativeMicroFrontendConfig({
  reactNative: {
    minVersion: "0.70.0",
    hermes: "required",
    newArchitecture: "supported",
  },

  ota: {
    enabled: true,
    provider: "hot-updater",
    mode: "manual",
    existingHotUpdater: {
      strategy: "reuse",
      configPath: "./hot-updater.config.ts",
    },
  },

  nativeChangePolicy: "ask",

  packageManager: {
    supported: ["bun", "deno", "npm", "pnpm", "yarn"],
    strategy: "follow-host",
  },

  package: {
    sync: "manual",
    sharedStrategy: "strict-singleton",
  },

  ios: {
    pods: "manual",
  },

  android: {
    integration: "manual",
  },

  mfes: {},
});
```

Meaning:

- React Native `0.70+` is the minimum supported line.
- Hermes and New Architecture are part of the native contract.
- Hot Updater is reused rather than replaced.
- Package manager behavior is explicit instead of guessed at command execution time.
- Native integration defaults to manual/generated-file first.

## Runtime example

```tsx
import type { MfeManifest } from "@bunin/react-native-micro-frontend";
import {
  MicroFrontendComponent,
  MicroFrontendProvider,
  createMicroFrontendLoader,
  type MicroFrontendModule,
} from "@bunin/react-native-micro-frontend/runtime";

type MfeModule = MicroFrontendModule;

declare function loadWithHotUpdater<TModule>(
  manifest: MfeManifest
): Promise<TModule>;
declare function loadEmbeddedBundle<TModule>(
  manifest: MfeManifest
): Promise<TModule>;
declare function loadCustomBundle<TModule>(
  manifest: MfeManifest
): Promise<TModule>;

const loadMfeModule = createMicroFrontendLoader<MfeModule>({
  hotUpdater: loadWithHotUpdater,
  embedded: loadEmbeddedBundle,
  custom: loadCustomBundle,
});

export function App({ registry }) {
  return (
    <MicroFrontendProvider registry={registry}>
      <MicroFrontendComponent
        name="mfe-feature"
        load={loadMfeModule}
        fallback={(state) => <Loading reason={state.reason} />}
      />
    </MicroFrontendProvider>
  );
}
```

Meaning:

- the host app owns where the registry comes from
- the runtime refuses blocked or nativeHash-mismatched MFEs
- MFE entry modules should default-export their root component
- `createMicroFrontendLoader()` reads registry config first: `ota.provider`, `embeddedBundlePath`, `otaBundleUrl`, and `bundleArchiveUrl`
- pass `loadOptions` or the created loader's second argument when a mount point needs direct provider/path/url/archive settings
- `MicroFrontendComponent` renders fallback while missing, blocked, loading, or failed, then renders `module.default` when the Host loader succeeds

## Host-provided global state

Use `sharedState` when the host needs to provide small, read-oriented state to every feature module: session identity, locale, feature flags, tenant, experiment bucket, or analytics context.

The pattern has two sides:

1. The host passes a typed snapshot to `MicroFrontendProvider`.
2. The MFE reads that snapshot with `useMicroFrontendSharedState<T>()`.
3. Shared UI can branch on `useIsMfe()` when the same component runs in both the host shell and an MFE subtree.

```tsx
import {
  MicroFrontendProvider,
  useIsMfe,
  useMicroFrontendSharedState,
} from "@bunin/react-native-micro-frontend/runtime";

export type HostSharedState = {
  readonly session?: {
    readonly userId: string;
  };
  readonly locale: "en-US" | "ko-KR" | "zh-CN" | "ja-JP";
  readonly featureFlags: Readonly<Record<string, boolean>>;
  readonly tenant?: {
    readonly id: string;
  };
};

const sharedState: HostSharedState = {
  session: {
    userId: "user_123",
  },
  locale: "ko-KR",
  featureFlags: {
    checkoutV2: true,
    profileMfe: true,
  },
  tenant: {
    id: "bunin",
  },
};

export function MountedFeatureModule({ registry }) {
  return (
    <MicroFrontendProvider registry={registry} sharedState={sharedState}>
      <FeatureModuleHeader />
    </MicroFrontendProvider>
  );
}

export function FeatureModuleHeader() {
  const isMfe = useIsMfe();
  const host = useMicroFrontendSharedState<HostSharedState>();
  const userId = host.session?.userId ?? "guest";
  const checkoutV2 = host.featureFlags.checkoutV2 ?? false;

  return (
    <Text>
      {isMfe ? "MFE" : "Host"} · {host.locale} · {userId} · checkoutV2=
      {String(checkoutV2)}
    </Text>
  );
}
```

Meaning:

- the host remains the source of truth
- feature modules get global state through the runtime hook, not by importing the host store
- `MicroFrontendComponent` automatically marks the loaded feature subtree as an MFE, so `useIsMfe()` is `true` inside mounted MFEs and `false` in the host shell. Use `MicroFrontendProvider isMfe` only for custom renderers that bypass `MicroFrontendComponent`.
- keep the shared type in a tiny shared contract package or file that both host and MFE can import
- mutations should go back through host-owned commands, callbacks, or events
- large caches, secrets, and native-only handles should not be placed in `sharedState`

## Hot Updater setup page

The documentation site includes a routed setup guide at `/docs/hot-updater`. It explains how to keep Hot Updater as the OTA delivery engine, wrap existing config with `withReactNativeMicroFrontend`, verify native safety, and publish only after the check passes.

## OTA decision rule

```txt
if ota.enabled === false
  -> OTA blocked

else if React Native version changed
  -> OTA blocked
  -> store release required

else if Hermes setting changed
  -> OTA blocked
  -> store release required

else if New Architecture setting changed
  -> OTA blocked
  -> store release required

else if native files/dependencies changed
  -> OTA blocked
  -> store release required

else if nativeHash mismatched
  -> OTA blocked
  -> store release required

else if MFE is blocked
  -> OTA blocked
  -> runtime load blocked

else
  -> OTA available
```

## Native contract inputs

```txt
nativeHash = hash(
  package native dependencies
  + Podfile.lock relevant pods
  + Gradle projects and dependencies
  + AndroidManifest permissions
  + Info.plist keys
  + React Native version
  + Hermes flag
  + New Architecture flag
)
```

Why this matters:

- JS-only changes can be delivered by OTA.
- Native ABI or dependency changes cannot be fixed by replacing JavaScript.
- A mismatched native hash means the host binary and MFE bundle were built against different native assumptions.

## RNM vs Re.Pack

RNM is intentionally **Metro-first** and does not depend on `@callstack/repack`.

Latest baseline checked on **2026-05-28**:

| Package | Latest checked version |
| --- | --- |
| `@bunin/react-native-micro-frontend` | `0.7.0` |
| `react-native` | `0.85.3` |
| `@callstack/repack` | `5.2.5` |

| Concern | RNM | Re.Pack 5.x |
| --- | --- | --- |
| Primary role | Native-safety, registry, integration, and Host loader orchestration | React Native bundler/runtime replacement |
| Bundler | Metro with `withMfe` helper | Rspack or Webpack instead of Metro |
| Microfrontend split | `rnm.registry.json` + Host-owned loader | Module Federation v2 remotes/chunks |
| Artifact | `index.bundle`, `manifest.json`, referenced assets, `.tar.gz` archive, OTA URL, or embedded bundle | Federated modules, remote chunks/containers, script runtime cache |
| Native safety | Native contract hash blocks unsafe OTA/runtime load | App/team must own native compatibility policy |

Choose RNM when Metro compatibility, native-contract OTA gates, reviewable integration files, and Host-owned loader policy are the priority. Choose Re.Pack when Module Federation, Rspack/Webpack plugins, tree-shaking, and remote chunk composition are the priority.

Re.Pack deserves credit: it has been the practical standard for React Native microfrontends and is a remarkable piece of engineering. The trade-off is that adopting it means accepting an additional Rspack/Webpack layer: another build model, Module Federation shared-dependency policy, remote chunk/cache operations, and debugging surface next to native release risk. If the team only needs native-safe OTA gates around Metro artifacts, that layer can become architecture weight rather than leverage.

See [`docs/repack-comparison.md`](docs/repack-comparison.md) for the full decision guide.

## One-shot versioning and publishing

All publishable packages are versioned together. Use the root scripts instead of changing each package manually.

### Set or bump every package version

The examples below show the Bun command first because Bun is the preferred workflow. The same release scripts are also callable through `npm`, `pnpm`, `yarn`, and `deno task`.

```bash
bun run version:all 0.7.0
bun run version:all patch
bun run version:all minor
bun run version:all major
```

Equivalent commands:

```bash
npm run version:all -- 0.7.0
pnpm version:all 0.7.0
yarn version:all 0.7.0
deno task version:all 0.7.0
```

Meaning:

- updates the root version
- updates every `packages/*/package.json` version
- updates internal package dependencies such as `@bunin/react-native-micro-frontend-cli -> @bunin/react-native-micro-frontend`
- keeps the split package layout but releases it as one coordinated version

### Build and pack every package

```bash
bun run release:check
```

Meaning:

- runs tests
- runs TypeScript typecheck
- builds all packages
- creates all npm-compatible tarballs in `.npm-pack/` using `bun pm pack`

### Dry-run the full registry publish

```bash
bun run release:dry-run
```

Meaning:

- runs the full release check
- runs `bun publish --dry-run` for every package in dependency order
- does not publish anything to the npm registry

### Publish for real

```bash
# Configure npm registry auth first, for example with an existing ~/.npmrc token.
bun run release:publish
```

Meaning:

- runs the full release check again
- publishes every package to the npm registry in this order:
  1. `@bunin/react-native-micro-frontend`
  2. `@bunin/react-native-micro-frontend-native-contract`
  3. `@bunin/react-native-micro-frontend-hot-updater-adapter`
  4. `@bunin/react-native-micro-frontend-metro-adapter`
  5. `@bunin/react-native-micro-frontend-integration`
  6. `@bunin/react-native-micro-frontend-config`
  7. `@bunin/react-native-micro-frontend-runtime`
  8. `@bunin/react-native-micro-frontend-cli`

The publish script uses `bun publish --cwd <package>`; the default options are `--access public --tag latest`.

## License

MIT.

Beerware has a great hacker vibe, and the project keeps that spirit: if this library saves your release, buying the maintainer a beer is welcome. The actual package license stays MIT so npm users, companies, and automated compliance tools can adopt it without friction.
