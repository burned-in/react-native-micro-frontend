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

## Overview

`@bunin/react-native-micro-frontend` is a safety and integration layer for React Native teams that want independent feature delivery without losing control of native binary compatibility.

It does **not** replace Hot Updater. Hot Updater remains the OTA delivery engine; this library decides whether an MFE is safe to load or publish before that delivery happens.

## Highlights

| Capability | What it does |
| --- | --- |
| MFE registry | Keeps every feature module, entry point, OTA policy, and runtime status in one predictable registry. |
| Native contract | Hashes React Native version, Hermes, New Architecture, native dependencies, Podfile, Gradle, AndroidManifest, and Info.plist-sensitive inputs. |
| OTA gate | Blocks OTA when native assumptions no longer match the host binary. |
| Runtime policy | Refuses blocked or incompatible MFEs and falls back safely in the host app. |
| Metro integration | Generates inspectable Metro bundle commands without requiring Re.Pack or Module Federation. |
| Hot Updater adapter | Reuses existing Hot Updater deployments instead of replacing them. |
| Package manager support | Supports Bun, npm, pnpm, Yarn, and Deno for consumer workflows. |

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

## Documentation

| Document | Description |
| --- | --- |
| [`docs/index.md`](docs/index.md) | Official documentation home. |
| [`README.md`](README.md) | English official guide. |
| [`docs/README.ko.md`](docs/README.ko.md) | Korean guide. |
| [`docs/README.ja.md`](docs/README.ja.md) | Japanese guide. |
| [`docs/README.zh-CN.md`](docs/README.zh-CN.md) | Simplified Chinese guide. |
| [`docs/package-managers.md`](docs/package-managers.md) | Package manager command matrix. |
| [`docs/native-contract.md`](docs/native-contract.md) | Native contract notes. |

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
- `/docs/hot-updater` is the routed Hot Updater configuration guide.
- `/docs/package-managers` lists Bun, npm, pnpm, Yarn, and Deno commands.
- `/docs/ko`, `/docs/zh-cn`, and `/docs/ja` expose localized entry pages.

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
- does not use Re.Pack
- separates command generation from execution so CI can inspect the exact command

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
import {
  MicroFrontendProvider,
  MicroFrontendScreen,
} from "@bunin/react-native-micro-frontend/runtime";

export function App({ registry }) {
  return (
    <MicroFrontendProvider registry={registry}>
      <MicroFrontendScreen
        name="mfe-feature"
        fallback={<Loading />}
      />
    </MicroFrontendProvider>
  );
}
```

Meaning:

- the host app owns where the registry comes from
- the runtime refuses blocked or nativeHash-mismatched MFEs
- the fallback is shown when loading is unsafe or unavailable


## Host-provided global state

Use `sharedState` when the host needs to provide small, read-oriented state to every feature module: session identity, locale, feature flags, tenant, experiment bucket, or analytics context.

The pattern has two sides:

1. The host passes a typed snapshot to `MicroFrontendProvider`.
2. The MFE reads that snapshot with `useMicroFrontendSharedState<T>()`.

```tsx
import {
  MicroFrontendProvider,
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

export function HostRoot({ registry }) {
  return (
    <MicroFrontendProvider
      registry={registry}
      sharedState={sharedState}
    >
      <FeatureShell />
    </MicroFrontendProvider>
  );
}

export function FeatureModuleHeader() {
  const host = useMicroFrontendSharedState<HostSharedState>();
  const userId = host.session?.userId ?? "guest";
  const checkoutV2 = host.featureFlags.checkoutV2 ?? false;

  return (
    <Text>
      {host.locale} · {userId} · checkoutV2={String(checkoutV2)}
    </Text>
  );
}
```

Meaning:

- the host remains the source of truth
- feature modules get global state through the runtime hook, not by importing the host store
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

## Re.Pack policy

Re.Pack is intentionally excluded.

```txt
Allowed:
  Metro bundle generation
  Hot Updater OTA delivery
  native contract verification
  runtime registry loading

Not allowed:
  @callstack/repack
  Webpack Module Federation
  Re.Pack remote chunk runtime
```

## One-shot versioning and publishing

All publishable packages are versioned together. Use the root scripts instead of changing each package manually.

### Set or bump every package version

The examples below show the Bun command first because Bun is the preferred workflow. The same release scripts are also callable through `npm`, `pnpm`, `yarn`, and `deno task`.

```bash
bun run version:all 0.2.0
bun run version:all patch
bun run version:all minor
bun run version:all major
```

Equivalent commands:

```bash
npm run version:all -- 0.2.0
pnpm version:all 0.2.0
yarn version:all 0.2.0
deno task version:all 0.2.0
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
