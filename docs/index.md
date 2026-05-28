# React Native Micro Frontend

**A native-safe delivery layer for React Native feature teams.**

`@bunin/react-native-micro-frontend` helps teams split product features into independently verified modules while preserving the native binary contract of the host app.

## Acknowledgement

This project began with strong inspiration from [Hot Updater](https://github.com/gronxb/hot-updater) by [gronxb](https://github.com/gronxb). Hot Updater is a remarkable self-hostable OTA project for React Native, and RNM intentionally keeps it as a first-class delivery engine while adding native-contract and microfrontend governance around it. Thank you, gronxb.

## Start here

```bash
bun add @bunin/react-native-micro-frontend
bun add -d @bunin/react-native-micro-frontend-cli
bunx @bunin/react-native-micro-frontend-cli init
```

## Guides

| Guide                                             | Purpose                                                        |
| ------------------------------------------------- | -------------------------------------------------------------- |
| [English README](../README.md)                    | Main library guide and examples.                               |
| [Getting started](getting-started.md)             | Install, configure, register, verify, and load your first MFE. |
| [Easy Way](easy-way.md)                           | Choose Bundle without OTA publish, Hot Updater/custom OTA, or Expo delivery.   |
| [Expo support](getting-started.md#expo-host-apps)      | Expo managed/prebuild/bare Host Apps with package, AOS, and iOS integration watcher. |
| [Options reference](options.md)                   | Every Host config, MFE config, registry, and runtime option.   |
| [Metro / Bundle archive](metro-bundle-archive.md) | Merge Metro with `withMfe` and load portable bundle archives.  |
| [Korean](README.ko.md)                            | Korean official guide.                                         |
| [Japanese](README.ja.md)                          | Japanese official guide.                                       |
| [Chinese](README.zh-CN.md)                        | Simplified Chinese official guide.                             |
| [Package managers & CLI](package-managers.md)     | Bun, npm, pnpm, Yarn, Deno runner matrix plus every RNM CLI command. |
| [Native contract](native-contract.md)             | Native compatibility notes.                                    |
| [RNM vs Re.Pack](repack-comparison.md)          | Metro-first native safety vs Re.Pack 5.x Module Federation.   |
| [Global state](/docs/global-state)                | Host-to-MFE sharedState providing and reading guide.           |
| [Hot Updater setup](/docs/hot-updater)            | Routed website guide for Hot Updater configuration.            |

## Easy Way

### 1. Bundle — portable archive

```bash
# run in the MFE project
rnm bundle mfe-feature --platform ios --host ../host-app
```

This creates a `.tar.gz` containing `index.bundle`, `manifest.json`, and only referenced runtime assets; without `--update-registry` it stays bundle-only/no-OTA.

### 2. OTA — Hot Updater/custom delivery

```bash
rnm add mfe-feature --path ../mfe-feature --entry ./src/index.tsx --version 1.0.0 --ota-provider hot-updater --ota-mode manual
rnm verify mfe-feature
rnm publish mfe-feature --package-manager bun --channel production

# Expo EAS Update instead
rnm add mfe-feature --path ../mfe-feature --entry ./src/index.tsx --version 1.0.0 --ota-provider expo --ota-mode manual
rnm expo mfe-feature --channel production --platform all --non-interactive
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
- **Portable bundle archives**: `rnm bundle` packages `index.bundle`, `manifest.json`, and only referenced runtime assets for Host copy/CDN upload.
- **Host-provided shared state**: the host can provide session, locale, and feature flags to feature modules without exposing the whole app store.
