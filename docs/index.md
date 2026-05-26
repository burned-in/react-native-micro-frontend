# React Native Micro Frontend

**A native-safe delivery layer for React Native feature teams.**

`@bunin/react-native-micro-frontend` helps teams split product features into independently verified modules while preserving the native binary contract of the host app.

## Start here

```bash
bun add @bunin/react-native-micro-frontend
bun add -d @bunin/react-native-micro-frontend-cli
bunx @bunin/react-native-micro-frontend-cli init
```

## Guides

| Guide | Purpose |
| --- | --- |
| [English README](../README.md) | Main library guide and examples. |
| [Getting started](getting-started.md) | Install, configure, register, verify, and load your first MFE. |
| [Options reference](options.md) | Every Host config, MFE config, registry, and runtime option. |
| [Korean](README.ko.md) | Korean official guide. |
| [Japanese](README.ja.md) | Japanese official guide. |
| [Chinese](README.zh-CN.md) | Simplified Chinese official guide. |
| [Package managers](package-managers.md) | Bun, npm, pnpm, Yarn, and Deno command matrix. |
| [Native contract](native-contract.md) | Native compatibility notes. |
| [Global state](/docs/global-state) | Host-to-MFE sharedState providing and reading guide. |
| [Hot Updater setup](/docs/hot-updater) | Routed website guide for Hot Updater configuration. |


## Easy Way

### 1. Generic — normal TS module style

```bash
rnm add mfe-feature --path ../mfe-feature --entry ./src/index.tsx --version 1.0.0 --no-ota --ota-provider none --ota-mode disabled
```

Use `withMfe` in `metro.config.js`, then map the local MFE through a static import in the Host loader. `isMfe` is automatic inside `MicroFrontendComponent`.

### 2. Bundle — portable archive

```bash
# run in the MFE project
rnm bundle --platform ios --host ../host-app --update-registry
```

This creates a `.tar.gz` containing only `index.bundle`, `assets/`, and `manifest.json`; `--update-registry` writes `bundleArchiveUrl`.

### 3. OTA — Hot Updater/custom delivery

```bash
rnm add mfe-feature --path ../mfe-feature --entry ./src/index.tsx --version 1.0.0 --ota-provider hot-updater --ota-mode manual
rnm verify mfe-feature
rnm publish mfe-feature --package-manager bun --channel production
```

Use `createMicroFrontendLoader({ hotUpdater, custom })`; the OTA engine distributes and evaluates code after native-safety verification passes.

## Core flow

```txt
register MFE
  -> calculate native contract
  -> compare with host binary
  -> allow or block OTA
  -> load through runtime policy
```

## Design principles

- **Safety first**: native changes require a native release.
- **Bun-first, ecosystem-friendly**: Bun is the preferred repository runtime; consumer projects can use Bun, npm, pnpm, Yarn, or Deno.
- **No hidden native patches**: generated files and manual integration stay reviewable.
- **Hot Updater compatible**: OTA delivery is delegated to Hot Updater after compatibility checks pass.
- **Metro-ready by default**: `withMfe` merges Metro config, watches registered MFE roots, and maps shared packages to Host `node_modules`.
- **Portable bundle archives**: `rnm bundle` packages only `index.bundle`, `assets/`, and `manifest.json` for Host copy/CDN upload.
- **Host-provided shared state**: the host can provide session, locale, and feature flags to feature modules without exposing the whole app store.
