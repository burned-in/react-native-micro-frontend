# 옵션 레퍼런스

Host App, 각 MFE project, runtime registry, runtime API에서 사용하는 공개 옵션을 모두 정리합니다.

헷갈릴 때는 아래 기준으로 나누면 됩니다.

- Host 전체 safety policy는 `react-native-micro-frontend.config.ts`에 둡니다.
- Runtime 등록 정보는 `rnm.registry.json`에 둡니다.
- 한 module의 build assumption은 `mfe.config.ts`에 둡니다.
- Render-time 접근은 `MicroFrontendProvider`와 hooks에서 처리합니다.

## 소유권 지도

```txt
host-app/react-native-micro-frontend.config.ts
  reactNative
  ota
  nativeChangePolicy
  packageManager
  package
  ios
  android
  mfes: {}

host-app/rnm.registry.json
  schemaVersion
  hostNativeHash
  mfes[name].entry
  mfes[name].path
  mfes[name].status
  mfes[name].nativeHash
  mfes[name].otaBundleUrl
  mfes[name].bundleArchiveUrl

mfe-feature/mfe.config.ts
  name
  version
  entry
  reactNative
  ota
  packageManager
  ios
  android
```

Host config의 `mfes`는 보통 비워 둡니다. Runtime 등록은 `rnm add`가 `rnm.registry.json`에 쓰게 하세요.

## Host config 옵션

파일: `host-app/react-native-micro-frontend.config.ts`

| 옵션 | 값 | 의미 |
| --- | --- | --- |
| `reactNative.minVersion` | `string` | Host App이 기대하는 최소 React Native version입니다. |
| `reactNative.hermes` | `"required" \| "optional" \| "disabled"` | Hermes를 필수, 허용, 비활성 중 하나로 정합니다. |
| `reactNative.newArchitecture` | `"required" \| "supported" \| "disabled"` | New Architecture compatibility policy입니다. |
| `ota.enabled` | `boolean` | Host policy 레벨에서 OTA delivery를 켜거나 끕니다. |
| `ota.provider` | `"hot-updater" \| "none" \| "custom"` | Host가 사용할 OTA provider integration입니다. |
| `ota.mode` | `"auto" \| "manual" \| "disabled"` | publish command를 자동 생성할지, 수동 gate로 둘지, 비활성화할지 정합니다. |
| `ota.existingHotUpdater.strategy` | `"reuse" \| "wrap" \| "separate" \| "disable" \| "manual"` | 기존 Hot Updater config 처리 방식입니다. |
| `ota.existingHotUpdater.configPath` | `string` | 선택 사항. `hot-updater.config.ts` 또는 `.js` 경로입니다. |
| `nativeChangePolicy` | `"ask" \| "block" \| "apply-and-disable-ota"` | native 변경 감지 시 처리 방식입니다. |
| `packageManager.supported` | `("bun" \| "deno" \| "npm" \| "pnpm" \| "yarn")[]` | Host/MFE workflow에서 허용할 package manager입니다. |
| `packageManager.strategy` | `"follow-host" \| "follow-mfe" \| "ask-every-time" \| "manual" \| "follow-existing-project"` | command가 package manager를 고르는 방식입니다. |
| `packageManager.explicit` | `"bun" \| "deno" \| "npm" \| "pnpm" \| "yarn"` | 선택 사항. 명시적인 package manager override입니다. |
| `package.sync` | `"auto" \| "manual" \| "warn-only" \| "disabled"` | dependency sync를 자동, 수동, warning-only, disabled 중 하나로 정합니다. |
| `package.sharedStrategy` | `"strict-singleton" \| "compatible-semver" \| "warn-only" \| "manual"` | Host와 MFE 사이 shared dependency 처리 방식입니다. |
| `ios.pods` | `"auto" \| "manual" \| "disabled" \| "warn-only"` | iOS Pod integration policy입니다. |
| `android.integration` | `"auto" \| "manual" \| "disabled" \| "warn-only"` | Android Gradle/manifest integration policy입니다. |
| `mfes` | `Record<string, MfeConfig>` | 선택 사항. 정적 MFE map입니다. 일반 runtime 등록은 `rnm.registry.json`을 권장합니다. |

## MFE config 옵션

파일: `mfe-feature/mfe.config.ts`

| 옵션 | 값 | 의미 |
| --- | --- | --- |
| `name` | `string` | CLI, registry, runtime lookup에서 쓰는 안정적인 이름입니다. |
| `version` | `string` | registry와 publish metadata에 기록되는 MFE version입니다. |
| `path` | `string` | 선택 사항. Host App root 기준 MFE project root 경로입니다. |
| `entry` | `string` | MFE project root 내부 entry file입니다. root component를 default export해야 합니다. |
| `reactNative` | `{ minVersion; hermes; newArchitecture }` | 선택 사항. MFE native/runtime assumption입니다. |
| `ota.enabled` | `boolean` | compatibility check 통과 시 이 MFE가 OTA publish 가능한지 정합니다. |
| `ota.mode` | `"auto" \| "manual" \| "disabled"` | MFE-level OTA mode입니다. |
| `ota.provider` | `"hot-updater" \| "none" \| "custom"` | 선택 사항. MFE-level OTA provider override입니다. |
| `nativeChangePolicy` | `"ask" \| "block" \| "apply-and-disable-ota"` | native 변경 감지 시 MFE 처리 방식입니다. |
| `packageManager.strategy` | `"follow-host" \| "follow-mfe" \| "ask-every-time" \| "manual" \| "follow-existing-project"` | 이 MFE의 package-manager 동작입니다. |
| `packageManager.explicit` | `"bun" \| "deno" \| "npm" \| "pnpm" \| "yarn"` | 이 MFE의 명시적 package manager입니다. |
| `package.sync` | `"auto" \| "manual" \| "warn-only" \| "disabled"` | MFE dependency sync policy입니다. |
| `package.sharedStrategy` | `"strict-singleton" \| "compatible-semver" \| "warn-only" \| "manual"` | 이 MFE의 shared dependency strategy입니다. |
| `package.dependencies` | `Record<string, string>` | check 또는 synchronize할 MFE dependency version입니다. |
| `ios.mode` | `"auto" \| "manual" \| "disabled" \| "warn-only"` | 이 MFE의 iOS integration behavior입니다. |
| `ios.pods` | `{ name; path?; version?; required }[]` | 이 MFE가 가정하는 native pods입니다. |
| `android.mode` | `"auto" \| "manual" \| "disabled" \| "warn-only"` | 이 MFE의 Android integration behavior입니다. |
| `android.gradleProjects` | `{ name; path?; required }[]` | 이 MFE가 가정하는 Gradle projects입니다. |
| `android.permissions` | `string[]` | 이 MFE가 가정하는 Android permissions입니다. |

## Registry 옵션

파일: `host-app/rnm.registry.json`

| 옵션 | 값 | 의미 |
| --- | --- | --- |
| `schemaVersion` | `1` | Registry schema version입니다. |
| `hostNativeHash` | `string` | 선택 사항. 설치된 Host binary의 native hash입니다. |
| `mfes` | `Record<string, MfeManifest>` | 이름으로 keying된 등록 MFE manifests입니다. |
| `MfeManifest.name` | `string` | Runtime lookup name입니다. |
| `MfeManifest.version` | `string` | 등록된 MFE version입니다. |
| `MfeManifest.entry` | `string` | Metro와 Host resolver가 사용하는 MFE entry file입니다. |
| `MfeManifest.path` | `string` | Host App root 기준 MFE project root 경로입니다. |
| `MfeManifest.ota.enabled` | `boolean` | 등록된 MFE의 OTA 활성 여부입니다. |
| `MfeManifest.ota.mode` | `"auto" \| "manual" \| "disabled"` | Runtime/publish OTA mode입니다. |
| `MfeManifest.ota.provider` | `"hot-updater" \| "none" \| "custom"` | 등록된 MFE의 provider입니다. |
| `MfeManifest.nativeChangePolicy` | `"ask" \| "block" \| "apply-and-disable-ota"` | 이 MFE에 캡처된 native-change policy입니다. |
| `MfeManifest.status` | `"active" \| "blocked" \| "disabled"` | Runtime status입니다. blocked/disabled module은 render하지 않아야 합니다. |
| `MfeManifest.blockedReason` | `string` | 선택 사항. fallback UI나 log에 보여줄 사람이 읽는 이유입니다. |
| `MfeManifest.nativeHash` | `string` | 선택 사항. MFE build/sync 때 캡처한 native hash입니다. |
| `MfeManifest.embeddedBundlePath` | `string` | 선택 사항. local embedded JS bundle path입니다. |
| `MfeManifest.otaBundleUrl` | `string` | 선택 사항. OTA URL 또는 provider-specific bundle key입니다. |
| `MfeManifest.bundleArchiveUrl` | `string` | `rnm bundle` 또는 `rnm build --archive`가 만든 압축 bundle archive URL/path입니다. |

## Runtime 옵션

| API | 값 | 의미 |
| --- | --- | --- |
| `MicroFrontendProvider.registry` | `MfeRegistry` | 필수 registry snapshot입니다. 보통 `rnm.registry.json`에서 import하거나 Host storage에서 load합니다. |
| `MicroFrontendProvider.sharedState` | `Record<string, unknown>` | MFE hooks에 노출하는 작은 Host-owned state snapshot입니다. |
| `MicroFrontendProvider.isMfe` | `boolean` | custom renderer용 수동 override입니다. `MicroFrontendComponent`는 loaded MFE subtree를 자동 표시합니다. |
| `MicroFrontendProvider.children` | `ReactNode` | runtime hooks를 사용할 수 있는 React subtree입니다. |
| `useMicroFrontend(name)` | `RuntimeMfeState` | 등록된 MFE 하나의 status, manifest, reason을 반환합니다. |
| `RuntimeMfeState.status` | `"ready" \| "loading" \| "blocked" \| "missing"` | `ready`만 Host loader로 넘기고, 나머지는 fallback을 render하세요. |
| `useMicroFrontendSharedState<T>()` | `T` | Host가 제공한 shared state snapshot을 읽습니다. |
| `useIsMfe()` | `boolean` | shared component가 mounted MFE subtree 안에서 실행 중인지 알려 줍니다. |
| `createMicroFrontendLoader(options?)` | `ConfiguredMicroFrontendLoader` | 재사용 가능한 Host loader를 만듭니다. 먼저 registry config인 `ota.provider`, `embeddedBundlePath`, `otaBundleUrl`, `bundleArchiveUrl`을 읽습니다. |
| `loadMicroFrontendModule(manifest, options?)` | `Promise<MicroFrontendModule>` | Host callback으로 module 하나를 resolve합니다. optional options로 provider, embedded path, OTA URL, bundle archive URL을 직접 줄 수 있습니다. |
| `MicroFrontendComponent.name` | `string` | 등록된 MFE name입니다. |
| `MicroFrontendComponent.load` | `ConfiguredMicroFrontendLoader` | `createMicroFrontendLoader()`로 만든 Host loader 또는 호환 loader입니다. |
| `MicroFrontendComponent.loadOptions` | `MicroFrontendLoadOptions` | 값을 `rnm.registry.json`에 저장하지 않을 때 mount별 provider/path/url/archive를 직접 지정합니다. |
| `MicroFrontendComponent.fallback` | `ReactNode | ((state) => ReactNode)` | missing, blocked, loading, unavailable 상태에서 render됩니다. |
| `MicroFrontendComponent.errorFallback` | `ReactNode | ((error, state) => ReactNode)` | bundle load 실패 시 보여 줄 선택 UI입니다. |
