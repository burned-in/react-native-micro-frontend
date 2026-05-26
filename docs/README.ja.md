# @bunin/react-native-micro-frontend

**React Native 向け native-safe micro frontend ライブラリ。**

機能モジュールを独立して開発し、native compatibility を検証し、host binary が安全に実行できる場合だけ OTA 更新を公開します。

関連ドキュメント: [公式ドキュメントホーム](index.ja.md) · [Getting Started](getting-started.ja.md) · [Options reference](options.ja.md) · [パッケージマネージャ・マトリクス](package-managers.ja.md)

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
| Metro integration | `withMfe` が Metro config を merge し、registered MFE root と shared package を Host `node_modules` に自動 map します。`rnm build` は inspectable bundle command を引き続き表示します。 |
| Bundle archive | `rnm bundle` が React Native bundling を実行し、`index.bundle`, Metro `assets/`, `manifest.json` だけを archive して Host copy/CDN delivery に使えます。 |
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

## Easy Way: generic, bundle, OTA メニュー

### メニュー 1. Generic — 通常の TypeScript module のように使う

Host App と MFE project が同じ workspace にあり、Metro が MFE source を直接 bundle できる場合に使います。local development や app store に一緒に含める feature module に最も簡単な path です。

```bash
# host-app/ で実行
rnm init
rnm add mfe-feature --path ../mfe-feature --entry ./src/index.tsx --version 1.0.0 --no-ota --ota-provider none --ota-mode disabled
```

```js
// host-app/metro.config.js
const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");

module.exports = (async () => {
  const { withMfe } = await import("@bunin/react-native-micro-frontend/metro");
  return withMfe(__dirname, mergeConfig(getDefaultConfig(__dirname), {}));
})();
```

```tsx
// Host loader: Metro が local MFE を含められるよう import は static map にします。
const localModules = {
  "mfe-feature": () => import("../mfe-feature/src/index"),
};

const loadMfeModule = createMicroFrontendLoader({
  fallback: async (manifest) => {
    const load = localModules[manifest.name as keyof typeof localModules];
    if (!load) throw new Error(`Local MFE not mapped: ${manifest.name}`);
    return await load();
  },
});
```

その後 `MicroFrontendProvider` と `MicroFrontendComponent` で render します。`isMfe` を手動で渡す必要はありません。loaded MFE subtree は自動的に MFE として mark されます。

### メニュー 2. Bundle — Host が必要な files だけを archive

MFE を portable archive にして Host project へ copy したり、release artifact/CDN/storage に upload したい場合に使います。

```bash
# mfe-feature/ で実行
rnm bundle --platform ios --host ../host-app --update-registry
```

```tsx
const loadMfeModule = createMicroFrontendLoader({
  custom: loadBundleArchive,
});
```

`rnm bundle` は `index.bundle`、`assets/`、`manifest.json`、`.tar.gz` archive だけを作ります。`--host` は `<host>/.bundle/rnm/` に copy し、`--update-registry` は `bundleArchiveUrl` を記録します。custom loader は archive download/read、verify、unpack、runtime engine での evaluation を担当します。

### メニュー 3. OTA — Hot Updater または custom OTA pipeline で配布

native-safety verification を通過した MFE を remote delivery する場合に使います。この library は native contract を先に検証し、実際の distribution と JavaScript evaluation は Hot Updater または OTA engine が担当します。

```bash
# host-app/ で実行
rnm add mfe-feature --path ../mfe-feature --entry ./src/index.tsx --version 1.0.0 --ota-provider hot-updater --ota-mode manual
rnm verify mfe-feature
rnm publish mfe-feature --package-manager bun --channel production
```

```tsx
const loadMfeModule = createMicroFrontendLoader({
  hotUpdater: loadWithHotUpdater,
  custom: loadWithCustomOta,
});
```

`ota.provider` が `hot-updater` の場合は `hotUpdater` loader を使い、custom OTA URL/archive を registry に置く場合は `custom` loader を使います。native assumption が変わって verification が失敗した場合は、OTA ではなく Store release を行います。

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

### 6a. `withMfe` で Metro config を merge する

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
    }),
  );
})();
```

意味:

- `rnm.registry.json` を自動で読みます。
- active MFE project root を Metro `watchFolders` に追加します。
- `react`, `react-native`, `@bunin/react-native-micro-frontend`, Host/MFE 共通 dependency を Host `node_modules` に固定します。
- 既存の `resolver.extraNodeModules` override は保持され、manual alias が優先されます。

### 6b. 必要な files だけを compressed bundle archive にする

```bash
# MFE project で実行
rnm bundle --platform ios --host ../host-app --update-registry
```

意味:

- command 表示だけでなく local React Native `bundle` を実行します。
- `index.bundle`, Metro `assets/`, `manifest.json` だけを出力します。
- それらだけを `dist/rnm-bundles/<mfe>/<platform>/<mfe>.<platform>.ota.tar.gz` に圧縮します。
- `--host` を指定すると archive を `<host>/.bundle/rnm/` に copy します。
- `--update-registry` も指定すると Host `rnm.registry.json` の `bundleArchiveUrl` を更新します。

CI で command だけ確認する場合は `rnm build <mfe> --archive` を使い続けてください。

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
import type { MfeManifest } from "@bunin/react-native-micro-frontend";
import {
  MicroFrontendComponent,
  MicroFrontendProvider,
  createMicroFrontendLoader,
  type MicroFrontendModule,
} from "@bunin/react-native-micro-frontend/runtime";

type MfeModule = MicroFrontendModule;

declare function loadWithHotUpdater<TModule>(manifest: MfeManifest): Promise<TModule>;
declare function loadEmbeddedBundle<TModule>(manifest: MfeManifest): Promise<TModule>;
declare function loadCustomBundle<TModule>(manifest: MfeManifest): Promise<TModule>;

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

意味:

- Host App が registry の取得元を決めます。
- runtime は blocked または nativeHash mismatch の MFE を拒否します。
- MFE entry module は root component を default export する必要があります。
- `createMicroFrontendLoader()` はまず registry config（`ota.provider`、`embeddedBundlePath`、`otaBundleUrl`、`bundleArchiveUrl`）を読みます。
- mount ごとに provider/path/url を直接指定する必要がある場合は、`loadOptions` または作成された loader の第 2 引数を使います。
- `MicroFrontendComponent` は missing、blocked、loading、failed では fallback を表示し、Host loader 成功後に `module.default` を render します。

## Host から提供される global state を取得する

Host から MFE へ session identity、locale、feature flags、tenant、experiment bucket、analytics context のような小さな read-oriented state を渡す場合は `sharedState` を使います。

この pattern は 2 段階です。

1. Host が typed snapshot を `MicroFrontendProvider` に渡します。
2. MFE が `useMicroFrontendSharedState<T>()` でその snapshot を読み取ります。
3. 同じ component が Host shell と MFE subtree の両方で動く場合は、`useIsMfe()` で現在位置を判定します。

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
  locale: "ja-JP",
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
    <MicroFrontendProvider
      registry={registry}
      sharedState={sharedState}
    >
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
      {isMfe ? "MFE" : "Host"} · {host.locale} · {userId} · checkoutV2={String(checkoutV2)}
    </Text>
  );
}
```

意味:

- source of truth は Host に残します。
- MFE は Host store を直接 import せず、runtime hook で global state を取得します。
- `MicroFrontendComponent` が loaded feature subtree を自動的に MFE として mark するため、mounted MFE 内の `useIsMfe()` は `true`、Host shell では `false` です。`MicroFrontendComponent` を迂回する custom renderer だけ `MicroFrontendProvider isMfe` を直接使ってください。
- `HostSharedState` type は Host と MFE の両方が import できる小さな shared contract package または file に置きます。
- 変更は Host commands、callbacks、events を通して戻す設計にします。
- 大きな cache、secret、native-only handle は `sharedState` に入れません。

## Hot Updater 設定ページ

ドキュメントサイトには `/docs/getting-started` route があり、初回 install、Host config、MFE registration、verification、runtime loading を説明します。`/docs/options` route は Host config、MFE config、registry、runtime options を detailed page として整理します。Hot Updater については `/docs/hot-updater` route があります。Hot Updater を OTA delivery engine として維持し、`withReactNativeMicroFrontend` で metadata をラップし、native safety check が通った場合だけ publish command を生成する流れを説明します。

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
