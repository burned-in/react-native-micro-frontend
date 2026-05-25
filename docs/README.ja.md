# @bunin/react-native-micro-frontend

**React Native 向け native-safe micro frontend ライブラリ。**

機能モジュールを独立して開発し、native compatibility を検証し、host binary が安全に実行できる場合だけ OTA 更新を公開します。

関連ドキュメント: [公式ドキュメントホーム](index.ja.md) · [パッケージマネージャ・マトリクス](package-managers.ja.md)

```txt
React Native Micro Frontend
  registry-driven modules
  native contract verification
  Metro bundle generation
  Hot Updater delivery
  runtime safety gates
```

## 概要

`@bunin/react-native-micro-frontend` は React Native チーム向けの安全性と統合のレイヤーです。native binary compatibility を保ちながら feature module を独立して配信できます。

Hot Updater を置き換えるものではありません。Hot Updater は OTA delivery engine のままで、このライブラリは MFE を publish/load してよいかを事前に判断します。

## 主な機能

| 機能 | 説明 |
| --- | --- |
| MFE registry | feature module、entry point、OTA policy、runtime status を 1 つの registry で管理します。 |
| Native contract | React Native version、Hermes、New Architecture、native dependency、Podfile、Gradle、AndroidManifest、Info.plist 関連入力を hash 化します。 |
| OTA gate | native assumption が host binary と一致しない場合は OTA をブロックします。 |
| Runtime policy | blocked/incompatible MFE をロードせず、安全に fallback します。 |
| Metro integration | Re.Pack や Module Federation に依存せず、監査しやすい Metro bundle command を生成します。 |
| Hot Updater adapter | 既存の Hot Updater 公開フローを再利用します。 |
| Package manager support | Bun、npm、pnpm、Yarn、Deno の consumer workflow をサポートします。 |

## クイックスタート

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

## なぜ必要なのか？

React Native には、OTA で配布できる領域と、必ず App Store / Play Store 向けの native binary 再リリースが必要な領域があります。

```txt
JS / assets / styles / business logic
  -> 通常は OTA 可能

Pods / Gradle / AndroidManifest / Info.plist / RN version / Hermes / New Architecture
  -> 新しい native binary が必要
```

このライブラリは、その 2 つの境界を明確に分離します。各 MFE には registry entry と native contract があり、公開前に Host App の binary と互換性があるかを CLI が確認します。

## パッケージ構成

```txt
packages/
  core/
    public type、config helper、registry model、OTA 判定、package manager 検出

  cli/
    rnm CLI コマンド

  native-contract/
    package.json、Podfile.lock、Gradle、AndroidManifest、RN/Hermes/New Architecture 解析

  hot-updater-adapter/
    Hot Updater 検出、wrapper metadata、deploy command 生成

  metro-adapter/
    Metro 設定検出、MFE bundle command 生成

  react-native-runtime/
    runtime registry、Provider、hook、screen fallback policy

  integration/
    既存 Host App 解析、generated file、manual guide、safe patch、rollback helper

  config/
    CLI/CI 用 JSON config loader
```

## ローカル実行

```bash
bun install
bun test
bun run typecheck
bun run build
```

意味:

- `bun test`: OTA 判定、native hash、native diff、package manager 検出の回帰テストを実行します。
- `bun run typecheck`: monorepo 全体の TypeScript 型を検証します。
- `bun run build`: 各 package の `dist/` と declaration file を生成します。


## パッケージマネージャ対応

このプロジェクトは **Bun 優先**ですが、Bun 専用ではありません。

「パッケージマネージャ対応」には 2 つの意味があります。

1. **利用側プロジェクト対応**: host app または MFE は `bun`、`npm`、`pnpm`、`yarn`、`deno` で package を install し、CLI を実行できます。
2. **リポジトリ公開対応**: この monorepo の実際の release engine は Bun で、`bun`、`npm`、`pnpm`、`yarn`、`deno task` から同じ release script を呼び出せます。

### Runtime package を install する

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

意味:

- `@bunin/react-native-micro-frontend` には config helper、registry model、OTA gate、runtime exports が含まれます。
- Deno は npm registry package に `npm:` specifier を使います。
- React Native 自体は host app 側に存在している必要があります。

### グローバル install なしで CLI を実行する

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

意味:

- すべてのコマンドは同じ `rnm` CLI package を実行します。
- `init` は generated integration file を作成しますが、native file を黙って変更しません。
- Deno はプロジェクトファイルを読み書きするため `-A` 権限が必要です。

### CLI を devDependency として install する

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

意味:

- CI で CLI version を固定したい場合は devDependency install が有効です。
- `deno add --package-json --dev` は Deno 2.8+ で CLI を `package.json` devDependencies に記録します。
- CLI binary 名は `rnm` です。
- package manager detection は host project の設定と lockfile を基準に動作します。

### パッケージマネージャ検出順序

```txt
1. explicit --package-manager flag
2. MFE local config
3. host config
4. lockfiles: bun.lockb, bun.lock, deno.json, deno.jsonc, package-lock.json, npm-shrinkwrap.json, pnpm-lock.yaml, yarn.lock
5. packageManager field in package.json
6. npm fallback
```

意味:

- CLI で明示した値が常に最優先です。
- lockfile は `packageManager` 文字列より強い証拠として扱います。
- host/MFE の package manager が違っても許容しますが、integration risk として報告します。

### `rnm publish` が生成する OTA 公開コマンド

```bash
rnm publish mfe-feature --package-manager bun
rnm publish mfe-feature --package-manager npm
rnm publish mfe-feature --package-manager pnpm
rnm publish mfe-feature --package-manager yarn
rnm publish mfe-feature --package-manager deno
```

生成される Hot Updater コマンド:

```bash
bunx hot-updater deploy -p ios -c production
npx hot-updater deploy -p ios -c production
pnpm dlx hot-updater deploy -p ios -c production
yarn dlx hot-updater deploy -p ios -c production
deno run -A npm:hot-updater deploy -p ios -c production
```

意味:

- `rnm publish` は最初に OTA safety gate を実行します。
- native contract mismatch がある場合、公開コマンドを出す前に OTA をブロックします。
- package manager は Hot Updater の呼び出し方だけを変えます。

### リポジトリ release script の同等コマンド

```bash
# Bun, 推奨
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

意味:

- すべての入口は同じ release workflow を呼び出します。
- workflow 内部の test、build、pack、publish はすべて Bun を使います。
- CI の外側が `npm`、`pnpm`、`yarn`、`deno task` でも Bun は install されている必要があります。
- `pnpm-workspace.yaml` と `.npmrc` により、repository の preferred `packageManager` が Bun でも pnpm を使用できます。

## CLI 例

### 1. Host App を初期化する

```bash
rnm init
```

意味:

- `react-native-micro-frontend.config.ts` を作成
- `rnm.registry.json` を作成
- `rnm.native-contract.json` を作成
- `ios/Podfile.rnm.generated.rb` などの generated include file を作成
- 既存の Podfile、Gradle、Metro 設定を黙って変更しない

Dry-run:

```bash
rnm init --dry-run
```

意味:

- 必要なファイルだけを表示
- ファイルは一切書き込まない
- 初回導入前の安全確認に使えます

### 2. MFE を登録する

```bash
rnm add mfe-feature \
  --path ../mfe-feature \
  --entry ./src/index.tsx \
  --version 1.0.0 \
  --ota-mode manual \
  --ota-provider hot-updater
```

意味:

- `mfe-feature` を `rnm.registry.json` に登録します。
- `entry` は Metro bundle の開始ファイルです。
- OTA が有効でも、native contract が一致しなければ後でブロックされます。

### 3. OTA 可能性を検証する

```bash
rnm verify mfe-feature
```

意味:

- registry 状態を確認
- MFE が blocked か確認
- `nativeHash` が Host と異なるか確認
- OTA が安全でなければ non-zero exit code を返します

### 4. Native contract を比較する

```bash
rnm diff mfe-feature
```

意味:

- Host の `rnm.native-contract.json` を読む
- MFE の `../mfe-feature/rnm.native-contract.json` を読む
- native 変更点を表示
- Store release が必要か表示

### 5. Native 変更を明示的に処理する

Native 変更を適用済みとして扱い、この MFE version の OTA を無効化する場合:

```bash
rnm sync mfe-feature --apply-native
```

意味:

- MFE を active のままにします。
- この MFE version の OTA を無効化します。
- “OTA DISABLED” warning box を表示します。

Native 変更を拒否し、MFE をブロックする場合:

```bash
rnm sync mfe-feature --block-native
```

意味:

- MFE を blocked 状態にします。
- Runtime load をブロックします。
- OTA publish をブロックします。

### 6. Metro bundle command を生成する

```bash
rnm build mfe-feature \
  --platform ios \
  --type ota \
  --entry ./src/index.tsx
```

意味:

- Metro ベースの `react-native bundle` command を表示します。
- Re.Pack は使用しません。
- command 生成と実行を分離し、CI で確認しやすくします。

### 7. Hot Updater publish command を生成する

```bash
rnm publish mfe-feature \
  --package-manager pnpm \
  --channel production
```

意味:

- まず OTA eligibility gate を実行します。
- nativeHash mismatch または blocked 状態なら失敗します。
- 安全な場合のみ Hot Updater deploy command を表示します。

## 設定例

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

意味:

- React Native `0.70+` を最小サポート範囲にします。
- Hermes と New Architecture は native contract に含まれます。
- Hot Updater は再利用され、このライブラリが置き換えるわけではありません。
- package manager strategy を明示します。
- native integration は generated file と手動確認を優先します。

## Runtime 例

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

意味:

- Host App が registry の取得元を決めます。
- runtime は blocked または nativeHash mismatch の MFE を拒否します。
- 安全でない場合、またはロードできない場合は fallback を表示します。


## Host から提供される global state を取得する

Host から MFE へ session identity、locale、feature flags、tenant、experiment bucket、analytics context のような小さな read-oriented state を渡す場合は `sharedState` を使います。

この pattern は 2 段階です。

1. Host が typed snapshot を `MicroFrontendProvider` に渡します。
2. MFE が `useMicroFrontendSharedState<T>()` でその snapshot を読み取ります。

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
  locale: "ja-JP",
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

意味:

- source of truth は Host に残します。
- MFE は Host store を直接 import せず、runtime hook で global state を取得します。
- `HostSharedState` type は Host と MFE の両方が import できる小さな shared contract package または file に置きます。
- 変更は Host commands、callbacks、events を通して戻す設計にします。
- 大きな cache、secret、native-only handle は `sharedState` に入れません。

## Hot Updater 設定ページ

ドキュメントサイトには `/docs/hot-updater` route があります。Hot Updater を OTA delivery engine として維持し、`withReactNativeMicroFrontend` で metadata をラップし、native safety check が通った場合だけ publish command を生成する流れを説明します。

## OTA 判定ルール

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

## nativeHash の構成要素

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

意味:

- JS-only の変更は OTA 可能な場合があります。
- native ABI または native dependency の変更は、JS を差し替えるだけでは解決できません。
- nativeHash mismatch は、Host binary と MFE bundle の native 前提が異なることを意味します。

## Re.Pack 方針

Re.Pack は使用しません。

```txt
許可:
  Metro bundle generation
  Hot Updater OTA delivery
  native contract verification
  runtime registry loading

禁止:
  @callstack/repack
  Webpack Module Federation
  Re.Pack remote chunk runtime
```

## 一括バージョン管理と公開

公開対象 package はすべて同じ version で管理します。各 `package.json` を個別に手動変更せず、root script を使います。

### 全 package の version を指定または bump する

```bash
bun run version:all 0.2.0
bun run version:all patch
bun run version:all minor
bun run version:all major
```

同等コマンド:

```bash
npm run version:all -- 0.2.0
pnpm version:all 0.2.0
yarn version:all 0.2.0
deno task version:all 0.2.0
```


意味:

- root version を更新
- すべての `packages/*/package.json` version を更新
- internal package dependency version も同期
- package は分割されていても release version は統一管理

### 全体検証と pack

```bash
bun run release:check
```

意味:

- test を実行
- TypeScript typecheck を実行
- すべての package を build
- `bun pm pack` で `.npm-pack/` に npm 互換 tarball を生成

### registry publish dry-run

```bash
bun run release:dry-run
```

意味:

- 完全な release check を実行
- すべての package に対して `bun publish --dry-run` を実行
- 実際には npm registry へ公開しません

### 実際に公開する

```bash
# 先に ~/.npmrc token などで npm registry 認証を設定してください。
bun run release:publish
```

意味:

- 完全な release check を再実行
- 依存関係順にすべての package を npm registry に publish
- publish script は `bun publish --cwd <package>` を使用し、デフォルト option は `--access public --tag latest`

## License

MIT.

Beerware の hacker vibe は良いですが、実際の package license は npm users、companies、automated compliance tools が採用しやすいよう MIT にします。この library が release を救ったら、maintainer に beer を一杯おごる気持ちは歓迎です。
