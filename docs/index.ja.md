# React Native Micro Frontend

**React Native feature team のための native-safe delivery layer。**

`@bunin/react-native-micro-frontend` は、機能を独立して検証可能な module に分割しながら、host app の native binary contract を守ります。

## クイックスタート

```bash
bun add @bunin/react-native-micro-frontend
bun add -d @bunin/react-native-micro-frontend-cli
bunx @bunin/react-native-micro-frontend-cli init
```

## ドキュメント

| ドキュメント                                         | 用途                                                                     |
| ---------------------------------------------------- | ------------------------------------------------------------------------ |
| [日本語 README](README.ja.md)                        | メインガイドと例。                                                       |
| [Getting Started](getting-started.ja.md)             | install、config、register、verify、最初の MFE loading guide。            |
| [Easy Way](easy-way.ja.md)                           | Generic、OTA publish なしの Bundle、OTA delivery から選ぶ guide。        |
| [Options reference](options.ja.md)                   | Host config、MFE config、registry、runtime の全 options。                |
| [Metro / Bundle archive](metro-bundle-archive.ja.md) | `withMfe` で Metro を merge し、portable bundle archive を読み込みます。 |
| [英語](../README.md)                                 | 英語公式ガイド。                                                         |
| [韓国語](README.ko.md)                               | 韓国語公式ドキュメント。                                                 |
| [簡体中国語](README.zh-CN.md)                        | 簡体中国語公式ドキュメント。                                             |
| [パッケージマネージャ](package-managers.ja.md)       | Bun、npm、pnpm、Yarn、Deno コマンド一覧。                                |
| [Native contract](native-contract.md)                | native compatibility notes。                                             |
| [Global state](/jp/docs/global-state)                | Host から MFE へ sharedState を提供して読み取るガイド。                  |
| [Hot Updater 設定](/jp/docs/hot-updater)             | Hot Updater route guide.                                                 |

## Easy Way

### 1. Generic — 通常の TS module 方式

```bash
rnm add mfe-feature --path ../mfe-feature --entry ./src/index.tsx --version 1.0.0 --no-ota --ota-provider none --ota-mode disabled
```

`metro.config.js` に `withMfe` を入れ、Host loader で static import により local MFE を接続します。`isMfe` は `MicroFrontendComponent` 内で自動適用されます。

### 2. Bundle — portable archive

```bash
# MFE project で実行
rnm bundle mfe-feature --platform ios --host ../host-app
```

`index.bundle`、`assets/`、`manifest.json` だけを含む `.tar.gz` を作り、`--update-registry` を外すと bundle-only/no-OTA flow のままです。

### 3. OTA — Hot Updater/custom delivery

```bash
rnm add mfe-feature --path ../mfe-feature --entry ./src/index.tsx --version 1.0.0 --ota-provider hot-updater --ota-mode manual
rnm verify mfe-feature
rnm publish mfe-feature --package-manager bun --channel production
```

`createMicroFrontendLoader({ hotUpdater, custom })` で接続します。OTA engine は native-safety verification 通過後の配布と evaluation を担当します。

## コアフロー

```txt
MFE を登録
  -> native contract を計算
  -> host binary と比較
  -> OTA を許可またはブロック
  -> runtime policy でロード
```

## 設計原則

- **Safety first**: native 変更には native release が必要です。
- **Bun-first, ecosystem-friendly**: repository runtime は Bun 優先で、consumer project は Bun、npm、pnpm、Yarn、Deno を使用できます。
- **No hidden native patches**: generated file と manual integration を review 可能に保ちます。
- **Hot Updater compatible**: compatibility check 後に Hot Updater へ OTA delivery を委譲します。
- **Metro-ready by default**: `withMfe` が Metro config を merge し、registered MFE root と shared package alias を自動設定します。
- **Portable bundle archives**: `rnm bundle` は `index.bundle`, `assets/`, `manifest.json` だけを package し、Host copy/CDN upload に使えます。
- **Host-provided shared state**: Host から session、locale、feature flags を MFE に安全に提供できます。
