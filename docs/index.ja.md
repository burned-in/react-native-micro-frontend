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

| ドキュメント | 用途 |
| --- | --- |
| [日本語 README](README.ja.md) | メインガイドと例。 |
| [English](../README.md) | English official guide. |
| [한국어](README.ko.md) | 한국어 공식 문서. |
| [简体中文](README.zh-CN.md) | 简体中文官方文档. |
| [パッケージマネージャ](package-managers.ja.md) | Bun、npm、pnpm、Yarn、Deno コマンド一覧。 |
| [Native contract](native-contract.md) | native compatibility notes。 |
| [Hot Updater 設定](/docs/hot-updater) | Hot Updater route guide. |

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
- **Host-provided shared state**: Host から session、locale、feature flags を MFE に安全に提供できます。
