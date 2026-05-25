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
| [Korean](README.ko.md) | 한국어 공식 문서. |
| [Japanese](README.ja.md) | 日本語公式ドキュメント. |
| [Chinese](README.zh-CN.md) | 简体中文官方文档. |
| [Package managers](package-managers.md) | Bun, npm, pnpm, Yarn, and Deno command matrix. |
| [Native contract](native-contract.md) | Native compatibility notes. |
| [Hot Updater setup](/docs/hot-updater) | Routed website guide for Hot Updater configuration. |

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
- **Host-provided shared state**: the host can provide session, locale, and feature flags to feature modules without exposing the whole app store.
