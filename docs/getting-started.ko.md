# Getting Started

이 문서는 package 설치, Host policy 선언, 첫 MFE 등록, native safety 검증, Host 전용 loader로 module을 mount하는 흐름을 정확히 설명합니다.


## 0. 지금 만들 구조

React Native MFE 구성은 보통 두 project로 나뉩니다.

```txt
host-app/
  react-native-micro-frontend.config.ts / .mjs / .cjs  # Host policy
  rnm.registry.json                      # runtime MFE registry

mfe-feature/
  src/index.tsx                          # MFE default component entry
  mfe.config.ts / .mjs / .cjs                      # MFE-local assumptions
```

먼저 이렇게 이해하면 됩니다.

| 요소 | 역할 |
| --- | --- |
| Host App | 설치된 native binary, navigation, fallback UI, shared state, 실제 bundle loader를 소유합니다. |
| MFE | 기능을 별도 JavaScript bundle로 배포하고 root component 하나를 default export합니다. |
| `react-native-micro-frontend.config.ts` / `.mjs` / `.cjs` | OTA provider, package manager, native-change policy, iOS/Android integration mode 같은 Host policy입니다. |
| `rnm.registry.json` | `rnm add`가 만드는 runtime registry입니다. Host가 어떤 MFE를 알고 있고 entry file이 어디인지 알게 합니다. |
| runtime hooks | Host loader가 렌더링하기 전에 missing, blocked, native-incompatible MFE를 막는 safety gate입니다. |

중요: 이 라이브러리는 native-safety와 registry layer입니다. 복사된 bundle archive는 `createBundleArchiveLoader()`로 실행할 수 있고, remote JavaScript 배포는 여전히 Hot Updater, embedded bundle, Host-owned loader 중 하나로 연결해야 합니다.

## 1. 설치

```bash
bun add @bunin/react-native-micro-frontend
bun add -d @bunin/react-native-micro-frontend-cli
bunx @bunin/react-native-micro-frontend-cli init
```

다른 package manager 명령은 [`package-managers.ko.md`](package-managers.ko.md)에 정리되어 있습니다.

## 2. Host policy 설정

`react-native-micro-frontend.config.ts`, `.mjs`, 또는 `.cjs`는 Host 정책을 설명합니다. 일반적인 runtime module 등록은 `rnm add`가 만드는 `rnm.registry.json`에 두고, Host config의 `mfes`는 비워 둡니다.

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

의미:

- Host config는 OTA, package-manager, native-change, iOS, Android 정책의 source of truth입니다.
- `mfes: {}`는 module 등록 정보를 `rnm.registry.json`에서 가져오겠다는 뜻입니다.
- generated native integration은 review 가능하게 유지합니다.
- package-manager 차이는 허용하되 명시적으로 관리합니다.

## 3. MFE 등록과 검증

```bash
rnm add mfe-feature --path ../mfe-feature --entry ./src/index.tsx --version 1.0.0
rnm verify mfe-feature
rnm publish mfe-feature --package-manager bun --channel production

# Hot Updater 대신 Expo EAS Update 사용
rnm add mfe-feature --path ../mfe-feature --entry ./src/index.tsx --version 1.0.0 --ota-provider expo --ota-mode manual
rnm expo mfe-feature --channel production --platform all --non-interactive
```

`rnm add`는 Host App의 `rnm.registry.json`을 만들거나 갱신합니다. `entry` 값은 MFE project root 기준의 파일이며, Metro가 bundle할 시작점이자 Host resolver가 나중에 load할 module 위치입니다.

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

검증이 통과한 뒤에만 publish합니다. native contract check가 실패하면 OTA 대신 Store release를 진행해야 합니다.

## 4. MFE component 제공

MFE entry file은 root component를 반드시 **default export**해야 합니다. Host loader가 따로 named export mapping을 구현하지 않는 한 named export에 의존하지 않습니다.

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

## 5. Host App에서 mount

runtime package는 missing module, blocked module, native hash mismatch를 막는 registry safety gate를 담당합니다. 복사된 archive는 `createBundleArchiveLoader()`가 읽고, remote download/evaluation은 Hot Updater, embedded bundle, Host-owned loader 중 Host App이 선택합니다.

`createMicroFrontendLoader()`로 loader를 만들고 `MicroFrontendComponent`에 전달하세요. loader는 먼저 `rnm.registry.json`의 config 값(`ota.provider`, `embeddedBundlePath`, `otaBundleUrl`, `bundleArchiveUrl`)을 읽습니다. registry에 넣을 수 없는 값은 `loadOptions` 또는 생성된 loader의 두 번째 인자로 직접 설정할 수 있습니다.

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

// 아래 선언은 실제 Hot Updater, embedded bundle, custom CDN 구현으로 교체하세요.
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
      sharedState={{ locale: "ko-KR" }}
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

// registry에 값이 없을 때 mount 지점에서 직접 설정하는 방법:
// <MicroFrontendComponent
//   name="mfe-feature"
//   load={loadMfeModule}
//   loadOptions={{ provider: "custom", bundleArchiveUrl: "https://cdn.example.com/mfe.ios.ota.tar.gz" }}
//   fallback={(state) => <Loading reason={state.reason} />}
// />
```

다음 문서:

- [`options.ko.md`](options.ko.md): Host, MFE, registry, runtime option 전체
- [`native-contract.md`](native-contract.md): OTA 차단 기준
- [`package-managers.ko.md`](package-managers.ko.md): npm, pnpm, Yarn, Bun, Deno 명령
- 웹 `/ko/docs/global-state`: Host-provided global state

## 6. `withMfe`로 Metro config merge

Host App `metro.config.js`에 helper를 추가하면 `rnm.registry.json` 기준으로 MFE root와 shared package가 자동으로 잡힙니다.

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

`withMfe`는 registered active MFE root를 `watchFolders`에 추가하고, shared package를 Host `node_modules`로 고정하며, 기존 `extraNodeModules` override를 보존해 수동 alias가 우선하게 합니다.

## 7. Host가 필요한 파일만 bundle로 묶기

Hot Updater처럼 archive를 만들어 Host project로 가져가려면 MFE project에서 실행하세요.

```bash
rnm bundle mfe-feature --platform ios --host ../host-app --update-registry
```

이 명령은 local React Native `bundle`을 실행하고 `index.bundle`, `manifest.json`, 실제 참조된 runtime asset만 생성한 뒤 `dist/rnm-bundles/<mfe>/<platform>/<mfe>.<platform>.ota.tar.gz`로 압축합니다. `--host`를 주면 `<host>/.bundle/rnm/`로 복사하고 `rnm.bundle-archives.ts`를 생성하며, `--update-registry`를 주면 `rnm.registry.json`의 `bundleArchiveUrl`도 업데이트합니다. 대화형 터미널에서는 감지한 Host entry file에서 `rnm.bundle-archives`를 import할지 묻고, `--yes` 또는 `--register-archives`를 주면 자동 적용합니다.

`bundleArchiveUrl`은 `createBundleArchiveLoader()`와 함께 사용하세요. 생성된 등록 파일은 React Native가 복사된 `.tar.gz`를 asset으로 resolve하게 하고, loader는 이를 읽어 gunzip/untar하고 manifest asset을 deterministic cache에 extract한 뒤 evaluate 전에 asset resolver를 patch해서 MFE source import 없이 Metro entry module을 반환합니다.


## 8. Easy Way: bundle, Hot Updater/OTA, Expo 메뉴

### 메뉴 1. Bundle — Host가 필요한 파일만 archive

MFE를 portable archive로 만들어 Host project에 복사하거나 release artifact/CDN/storage에 올리고 싶을 때 사용합니다.

```bash
# mfe-feature/에서 실행
rnm bundle mfe-feature --platform ios --host ../host-app
```

```tsx
const loadMfeModule = createMicroFrontendLoader({
  custom: loadBundleArchive,
});
```

`rnm bundle`은 `index.bundle`, `manifest.json`, 실제 참조된 runtime asset, `.tar.gz` archive만 만듭니다. `--no-bundle-assets`를 주지 않으면 `rnm bundle-asset`을 자동 실행합니다. `--host`는 `<host>/.bundle/rnm/`에 복사하고 `rnm.bundle-archives.ts`를 생성합니다. Host entry import는 `--yes`로 자동 적용하거나 한 번 수동 import하세요. `rnm.registry.json`에 `bundleArchiveUrl`을 쓰려면 `--update-registry`를 추가하세요.

### 메뉴 2. OTA — Hot Updater 또는 custom OTA pipeline으로 배포

native-safety verification을 통과한 MFE를 원격으로 배포할 때 사용합니다. 이 라이브러리는 native contract를 먼저 검증하고, 실제 distribution과 JavaScript evaluation은 Hot Updater 또는 OTA engine이 담당합니다.

```bash
# host-app/에서 실행
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

`ota.provider`가 `hot-updater`이면 `hotUpdater` loader를, custom OTA URL/archive를 registry에 넣는다면 `custom` loader를 사용하세요. native assumption이 바뀌어 검증이 실패하면 OTA 대신 Store release를 진행해야 합니다.


## Expo Host App

Expo managed, prebuild, bare/prebuilt project를 모두 지원합니다. package 통합은 React Native CLI project와 동일하게 동작합니다. native folder가 이미 있으면 `rnm aos`와 `rnm ios`가 generated Gradle/Podfile include 파일을 patch합니다. `ios/` 또는 `android/`가 아직 없으면 RNM이 Expo config plugin을 생성합니다.

```bash
rnm add mfe-feature --path ../mfe-feature
rnm all mfe-feature --yes
npx expo prebuild
```

`rnm add`, `rnm bundle --host`, `rnm verify`, `rnm publish`는 누락된 package/AOS/iOS 추가 항목을 감시합니다. 대화형으로 적용/건너뛰기, `--yes` 자동 적용, `--skip-integration` watcher 생략을 선택할 수 있습니다.
