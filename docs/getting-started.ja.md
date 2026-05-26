# Getting Started

このガイドでは、package install、Host policy 宣言、最初の MFE registration、native safety verification、Host-owned loader による module mount までを正確に説明します。


## 0. 何を作るのか

React Native MFE 構成は通常 2 つの project で構成します。

```txt
host-app/
  react-native-micro-frontend.config.ts / .mjs / .cjs  # Host policy
  rnm.registry.json                      # runtime MFE registry

mfe-feature/
  src/index.tsx                          # MFE default component entry
  mfe.config.ts / .mjs / .cjs                      # MFE-local assumptions
```

まず次の model で理解してください。

| 要素 | 役割 |
| --- | --- |
| Host App | install 済み native binary、navigation、fallback UI、shared state、実際の bundle loader を所有します。 |
| MFE | 機能を独立した JavaScript bundle として配布し、root component を 1 つ default export します。 |
| `react-native-micro-frontend.config.ts` / `.mjs` / `.cjs` | Host policy: OTA provider、package manager、native-change policy、iOS/Android integration mode。 |
| `rnm.registry.json` | `rnm add` が生成する runtime registry。Host がどの MFE を知っていて、entry file がどこにあるかを示します。 |
| runtime hooks | Host loader が render する前に missing、blocked、native-incompatible MFE を止める safety gate です。 |

重要: この library は native-safety と registry layer です。remote JavaScript を自動実行するものではありません。実際の実行は Host App が Hot Updater、embedded bundle、custom loader のいずれかで接続します。

## 1. Install

```bash
bun add @bunin/react-native-micro-frontend
bun add -d @bunin/react-native-micro-frontend-cli
bunx @bunin/react-native-micro-frontend-cli init
```

他の package manager のコマンドは [`package-managers.ja.md`](package-managers.ja.md) にあります。

## 2. Host policy を設定する

`react-native-micro-frontend.config.ts`、`.mjs`、または `.cjs` は Host policy を記述します。通常の runtime module registration は `rnm add` が生成する `rnm.registry.json` に置くため、Host config の `mfes` は空にします。

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

- Host config は OTA、package-manager、native-change、iOS、Android policy の source of truth です。
- `mfes: {}` は module registration を `rnm.registry.json` から読むという意味です。
- generated native integration は review 可能に保ちます。
- package-manager の違いは許容しつつ明示的に管理します。

## 3. MFE を register して verify する

```bash
rnm add mfe-feature --path ../mfe-feature --entry ./src/index.tsx --version 1.0.0
rnm verify mfe-feature
rnm publish mfe-feature --package-manager bun --channel production

# Hot Updater の代わりに Expo EAS Update を使う
rnm add mfe-feature --path ../mfe-feature --entry ./src/index.tsx --version 1.0.0 --ota-provider expo --ota-mode manual
rnm expo mfe-feature --channel production --platform all --non-interactive
```

`rnm add` は Host App の `rnm.registry.json` を作成または更新します。`entry` は MFE project root から見た file path で、Metro bundle entry であり、Host resolver が後で load する module の場所でもあります。

```json
{
  "schemaVersion": 1,
  "mfes": {
    "mfe-feature": {
      "name": "mfe-feature",
      "version": "1.0.0",
      "entry": "./src/index.tsx",
      "path": "../mfe-feature",
      "ota": {
        "enabled": true,
        "mode": "manual",
        "provider": "hot-updater"
      },
      "nativeChangePolicy": "ask",
      "status": "active"
    }
  }
}
```

verification が通った場合だけ publish します。native contract check が失敗した場合は OTA ではなく Store release を行います。

## 4. MFE component を提供する

MFE entry file は root component を必ず **default export** します。独自の Host loader が named export mapping を実装していない限り、named export には依存しません。

```tsx
// mfe-feature/src/index.tsx
import { Text, View } from "react-native";

export default function MfeFeature() {
  return (
    <View>
      <Text>MFE Feature</Text>
    </View>
  );
}
```

## 5. Host App で mount する

runtime package は missing module、blocked module、native hash mismatch を防ぐ registry safety gate を担当します。JavaScript bundle の download や evaluation は行いません。実際の loader は Hot Updater、embedded bundle、custom loader のいずれかを Host App が選びます。

`createMicroFrontendLoader()` で loader を作り、`MicroFrontendComponent` に渡してください。loader はまず `rnm.registry.json` の config 値（`ota.provider`、`embeddedBundlePath`、`otaBundleUrl`、`bundleArchiveUrl`）を読みます。registry に入れられない値は `loadOptions`、または作成された loader の第 2 引数で直接指定できます。

```tsx
import type { MfeManifest, MfeRegistry } from "@bunin/react-native-micro-frontend";
import {
  MicroFrontendComponent,
  MicroFrontendProvider,
  createMicroFrontendLoader,
  type MicroFrontendModule,
} from "@bunin/react-native-micro-frontend/runtime";
import registryJson from "./rnm.registry.json";

type MfeFeatureProps = {
  readonly title?: string;
};

type MfeModule = MicroFrontendModule<MfeFeatureProps>;

// これらの宣言は実際の Hot Updater、embedded bundle、custom CDN 実装に置き換えてください。
declare function loadWithHotUpdater<TModule>(
  manifest: MfeManifest,
): Promise<TModule>;
declare function loadEmbeddedBundle<TModule>(
  manifest: MfeManifest,
): Promise<TModule>;
declare function loadCustomBundle<TModule>(
  manifest: MfeManifest,
): Promise<TModule>;

const loadMfeModule = createMicroFrontendLoader<MfeModule>({
  hotUpdater: loadWithHotUpdater,
  embedded: loadEmbeddedBundle,
  custom: loadCustomBundle,
});

export function App() {
  return (
    <MicroFrontendProvider
      registry={registryJson as MfeRegistry}
      sharedState={{ locale: "ja-JP" }}
    >
      <MicroFrontendComponent<MfeFeatureProps>
        name="mfe-feature"
        load={loadMfeModule}
        componentProps={{ title: "MFE Feature" }}
        fallback={(state) => <Loading reason={state.reason} />}
        errorFallback={(error) => (
          <Loading
            reason={error instanceof Error ? error.message : "MFE load failed."}
          />
        )}
      />
    </MicroFrontendProvider>
  );
}

// rnm.registry.json に値がない場合は mount 地点で直接指定できます:
// <MicroFrontendComponent
//   name="mfe-feature"
//   load={loadMfeModule}
//   loadOptions={{ provider: "custom", bundleArchiveUrl: "https://cdn.example.com/mfe.ios.ota.tar.gz" }}
//   fallback={(state) => <Loading reason={state.reason} />}
// />
```


次に読むもの:

- [`options.ja.md`](options.ja.md): Host、MFE、registry、runtime の全 options
- [`native-contract.md`](native-contract.md): OTA blocking の基準
- [`package-managers.ja.md`](package-managers.ja.md): npm、pnpm、Yarn、Bun、Deno commands
- web `/jp/docs/global-state`: Host-provided global state

## 6. `withMfe` で Metro config を merge する

Host App の `metro.config.js` に helper を追加すると、`rnm.registry.json` から MFE root と shared package を自動検出できます。

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

`withMfe` は registered active MFE root を `watchFolders` に追加し、shared package を Host `node_modules` に固定し、既存の `extraNodeModules` override を保持して manual alias を優先します。

## 7. Host が必要な files だけを bundle する

Hot Updater のような archive を作って Host project に取り込む場合は MFE project で実行します。

```bash
rnm bundle mfe-feature --platform ios --host ../host-app --update-registry
```

この command は local React Native `bundle` を実行し、`index.bundle`, `assets/`, `manifest.json` だけを生成して `dist/rnm-bundles/<mfe>/<platform>/<mfe>.<platform>.ota.tar.gz` に圧縮します。`--host` を指定すると `<host>/.bundle/rnm/` に copy し、`--update-registry` を指定すると `rnm.registry.json` の `bundleArchiveUrl` を更新します。

`bundleArchiveUrl` は archive を download/verify/unpack/evaluate する custom loader と一緒に使ってください。runtime は custom loader を選択しますが、remote JavaScript を直接実行しません。


## 8. Easy Way: generic, bundle, OTA メニュー

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
rnm bundle mfe-feature --platform ios --host ../host-app
```

```tsx
const loadMfeModule = createMicroFrontendLoader({
  custom: loadBundleArchive,
});
```

`rnm bundle` は `index.bundle`、`assets/`、`manifest.json`、`.tar.gz` archive だけを作ります。`--host` は `<host>/.bundle/rnm/` に copy し、`--update-registry` を外すと bundle-only/no-OTA flow です。custom loader は archive download/read、verify、unpack、runtime engine での evaluation を担当します。`rnm.registry.json` に `bundleArchiveUrl` を書きたい場合だけ `--update-registry` を追加してください。

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


## Expo Host App

Expo managed、prebuild、bare/prebuilt project をすべてサポートします。package integration は React Native CLI project と同じです。native folders が既にある場合、`rnm aos` と `rnm ios` は generated Gradle/Podfile include files を patch します。`ios/` または `android/` がまだ無い場合、RNM は Expo config plugin を生成します。

```bash
rnm add mfe-feature --path ../mfe-feature
rnm all mfe-feature --yes
npx expo prebuild
```

`rnm add`、`rnm bundle --host`、`rnm verify`、`rnm publish` は不足している package/AOS/iOS additions を監視します。対話的に apply/skip するか、`--yes` で自動適用、`--skip-integration` で watcher を省略できます。
