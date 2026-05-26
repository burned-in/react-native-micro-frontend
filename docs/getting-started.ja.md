# Getting Started

このガイドでは、package install、Host policy 宣言、最初の MFE registration、native safety verification、Host-owned loader による module mount までを正確に説明します。


## 0. 何を作るのか

React Native MFE 構成は通常 2 つの project で構成します。

```txt
host-app/
  react-native-micro-frontend.config.ts  # Host policy
  rnm.registry.json                      # runtime MFE registry

mfe-feature/
  src/index.tsx                          # MFE default component entry
  mfe.config.ts                          # MFE-local assumptions
```

まず次の model で理解してください。

| 要素 | 役割 |
| --- | --- |
| Host App | install 済み native binary、navigation、fallback UI、shared state、実際の bundle loader を所有します。 |
| MFE | 機能を独立した JavaScript bundle として配布し、root component を 1 つ default export します。 |
| `react-native-micro-frontend.config.ts` | Host policy: OTA provider、package manager、native-change policy、iOS/Android integration mode。 |
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

`react-native-micro-frontend.config.ts` は Host policy を記述します。通常の runtime module registration は `rnm add` が生成する `rnm.registry.json` に置くため、Host config の `mfes` は空にします。

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

`createMicroFrontendLoader()` で loader を作り、`MicroFrontendComponent` に渡してください。loader はまず `rnm.registry.json` の config 値（`ota.provider`、`embeddedBundlePath`、`otaBundleUrl`）を読みます。registry に入れられない値は `loadOptions`、または作成された loader の第 2 引数で直接指定できます。

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
//   loadOptions={{ provider: "custom", otaBundleUrl: "https://cdn.example.com/mfe.bundle" }}
//   fallback={(state) => <Loading reason={state.reason} />}
// />
```


次に読むもの:

- [`options.ja.md`](options.ja.md): Host、MFE、registry、runtime の全 options
- [`native-contract.md`](native-contract.md): OTA blocking の基準
- [`package-managers.ja.md`](package-managers.ja.md): npm、pnpm、Yarn、Bun、Deno commands
- web `/jp/docs/global-state`: Host-provided global state
