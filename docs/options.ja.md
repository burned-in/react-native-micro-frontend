# Options reference

このページは Host App、各 MFE project、runtime registry、runtime API で使う public options をまとめます。

値をどこに置くか迷った場合は、次の基準で分けます。

- Host 全体の safety policy は `react-native-micro-frontend.config.ts` に置きます。
- Runtime registration は `rnm.registry.json` に置きます。
- 1 module の build assumptions は `mfe.config.ts` に置きます。
- Render-time access は `MicroFrontendProvider` と hooks で扱います。

## Ownership map

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

Host config の `mfes` は通常空にします。Runtime registration は `rnm add` が `rnm.registry.json` に書き込む流れを推奨します。

## Host config options

File: `host-app/react-native-micro-frontend.config.ts`

| Option | Values | Meaning |
| --- | --- | --- |
| `reactNative.minVersion` | `string` | Host App が期待する最小 React Native version。 |
| `reactNative.hermes` | `"required" \| "optional" \| "disabled"` | Hermes を必須、任意、無効のどれにするか。 |
| `reactNative.newArchitecture` | `"required" \| "supported" \| "disabled"` | New Architecture compatibility policy。 |
| `ota.enabled` | `boolean` | Host policy level で OTA delivery を有効/無効にします。 |
| `ota.provider` | `"hot-updater" \| "none" \| "custom"` | Host が選択する OTA provider integration。 |
| `ota.mode` | `"auto" \| "manual" \| "disabled"` | publish command を生成または gate する方式。 |
| `ota.existingHotUpdater.strategy` | `"reuse" \| "wrap" \| "separate" \| "disable" \| "manual"` | 既存 Hot Updater config の扱い。 |
| `ota.existingHotUpdater.configPath` | `string` | 任意。`hot-updater.config.ts` または `.js` の path。 |
| `nativeChangePolicy` | `"ask" \| "block" \| "apply-and-disable-ota"` | native changes が検出された時の処理。 |
| `packageManager.supported` | `("bun" \| "deno" \| "npm" \| "pnpm" \| "yarn")[]` | Host/MFE workflows で許可する package managers。 |
| `packageManager.strategy` | `"follow-host" \| "follow-mfe" \| "ask-every-time" \| "manual" \| "follow-existing-project"` | command が package manager を選ぶ方式。 |
| `packageManager.explicit` | `"bun" \| "deno" \| "npm" \| "pnpm" \| "yarn"` | 任意の package manager override。 |
| `package.sync` | `"auto" \| "manual" \| "warn-only" \| "disabled"` | dependency sync を自動、手動、警告のみ、無効のどれにするか。 |
| `package.sharedStrategy` | `"strict-singleton" \| "compatible-semver" \| "warn-only" \| "manual"` | Host と MFE 間の shared dependencies の扱い。 |
| `ios.pods` | `"auto" \| "manual" \| "disabled" \| "warn-only"` | iOS Pod integration policy。 |
| `android.integration` | `"auto" \| "manual" \| "disabled" \| "warn-only"` | Android Gradle/manifest integration policy。 |
| `mfes` | `Record<string, MfeConfig>` | 任意の static MFE map。通常の runtime registration には `rnm.registry.json` を推奨します。 |

## MFE config options

File: `mfe-feature/mfe.config.ts`

| Option | Values | Meaning |
| --- | --- | --- |
| `name` | `string` | CLI、registry、runtime lookup で使う安定した name。 |
| `version` | `string` | registry と publish metadata に記録される MFE version。 |
| `path` | `string` | 任意。Host App root から MFE project root への path。 |
| `entry` | `string` | MFE project root 内の entry file。root component を default export します。 |
| `reactNative` | `{ minVersion; hermes; newArchitecture }` | 任意の MFE native/runtime assumptions。 |
| `ota.enabled` | `boolean` | compatibility checks が通った時、この MFE を OTA publish できるか。 |
| `ota.mode` | `"auto" \| "manual" \| "disabled"` | MFE-level OTA mode。 |
| `ota.provider` | `"hot-updater" \| "none" \| "custom"` | 任意の MFE-level OTA provider override。 |
| `nativeChangePolicy` | `"ask" \| "block" \| "apply-and-disable-ota"` | native changes 検出時の MFE behavior。 |
| `packageManager.strategy` | `"follow-host" \| "follow-mfe" \| "ask-every-time" \| "manual" \| "follow-existing-project"` | この MFE の package-manager behavior。 |
| `packageManager.explicit` | `"bun" \| "deno" \| "npm" \| "pnpm" \| "yarn"` | この MFE の明示的 package manager。 |
| `package.sync` | `"auto" \| "manual" \| "warn-only" \| "disabled"` | MFE dependency sync policy。 |
| `package.sharedStrategy` | `"strict-singleton" \| "compatible-semver" \| "warn-only" \| "manual"` | この MFE の shared dependency strategy。 |
| `package.dependencies` | `Record<string, string>` | check または synchronize する MFE dependency versions。 |
| `ios.mode` | `"auto" \| "manual" \| "disabled" \| "warn-only"` | この MFE の iOS integration behavior。 |
| `ios.pods` | `{ name; path?; version?; required }[]` | この MFE が前提にする native pods。 |
| `android.mode` | `"auto" \| "manual" \| "disabled" \| "warn-only"` | この MFE の Android integration behavior。 |
| `android.gradleProjects` | `{ name; path?; required }[]` | この MFE が前提にする Gradle projects。 |
| `android.permissions` | `string[]` | この MFE が前提にする Android permissions。 |

## Registry options

File: `host-app/rnm.registry.json`

| Option | Values | Meaning |
| --- | --- | --- |
| `schemaVersion` | `1` | Registry schema version。 |
| `hostNativeHash` | `string` | 任意。インストール済み Host binary の native hash。 |
| `mfes` | `Record<string, MfeManifest>` | name で keyed された registered MFE manifests。 |
| `MfeManifest.name` | `string` | Runtime lookup name。 |
| `MfeManifest.version` | `string` | Registered MFE version。 |
| `MfeManifest.entry` | `string` | Metro と Host resolver が使う MFE entry file。 |
| `MfeManifest.path` | `string` | Host App root から MFE project root への path。 |
| `MfeManifest.ota.enabled` | `boolean` | この registered MFE の OTA 有効状態。 |
| `MfeManifest.ota.mode` | `"auto" \| "manual" \| "disabled"` | Runtime/publish OTA mode。 |
| `MfeManifest.ota.provider` | `"hot-updater" \| "none" \| "custom"` | この registered MFE が使う provider。 |
| `MfeManifest.nativeChangePolicy` | `"ask" \| "block" \| "apply-and-disable-ota"` | この MFE の native-change policy。 |
| `MfeManifest.status` | `"active" \| "blocked" \| "disabled"` | Runtime status。blocked/disabled modules は render しません。 |
| `MfeManifest.blockedReason` | `string` | 任意。fallback UI または logs に出す readable reason。 |
| `MfeManifest.nativeHash` | `string` | 任意。MFE build/sync 時に取得した native hash。 |
| `MfeManifest.embeddedBundlePath` | `string` | 任意の local embedded JS bundle path。 |
| `MfeManifest.otaBundleUrl` | `string` | 任意の OTA URL または provider-specific bundle key。 |
| `MfeManifest.bundleArchiveUrl` | `string` | `rnm bundle` または `rnm build --archive` が生成した compressed bundle archive URL/path です。 |

## Runtime options

| API | Values | Meaning |
| --- | --- | --- |
| `MicroFrontendProvider.registry` | `MfeRegistry` | 必須の registry snapshot。通常は `rnm.registry.json` から import、または Host storage から load します。 |
| `MicroFrontendProvider.sharedState` | `Record<string, unknown>` | MFE hooks に公開する小さな Host-owned state snapshot。 |
| `MicroFrontendProvider.isMfe` | `boolean` | custom renderer 用の manual override です。`MicroFrontendComponent` は loaded MFE subtree を自動的に mark します。 |
| `MicroFrontendProvider.children` | `ReactNode` | runtime hooks を使える React subtree。 |
| `useMicroFrontend(name)` | `RuntimeMfeState` | registered MFE 1 つの status、manifest、reason を返します。 |
| `RuntimeMfeState.status` | `"ready" \| "loading" \| "blocked" \| "missing"` | `ready` のみ Host loader に渡します。他の state は fallback を render します。 |
| `useMicroFrontendSharedState<T>()` | `T` | Host-provided shared state snapshot を読み取ります。 |
| `useIsMfe()` | `boolean` | shared components が mounted MFE subtree 内で実行されているかを示します。 |
| `createMicroFrontendLoader(options?)` | `ConfiguredMicroFrontendLoader` | 再利用可能な Host loader を作ります。まず registry config の `ota.provider`、`embeddedBundlePath`、`otaBundleUrl`、`bundleArchiveUrl` を読みます。 |
| `loadMicroFrontendModule(manifest, options?)` | `Promise<MicroFrontendModule>` | Host callback で module 1 つを resolve します。optional options で provider、embedded path、OTA URL、bundle archive URL を直接指定できます。 |
| `MicroFrontendComponent.name` | `string` | Registered MFE name。 |
| `MicroFrontendComponent.load` | `ConfiguredMicroFrontendLoader` | `createMicroFrontendLoader()` で作った Host loader、または互換 loader です。 |
| `MicroFrontendComponent.loadOptions` | `MicroFrontendLoadOptions` | 値を `rnm.registry.json` に保存しない場合、mount ごとに provider/path/url/archive を直接指定します。 |
| `MicroFrontendComponent.fallback` | `ReactNode | ((state) => ReactNode)` | missing、blocked、loading、unavailable の時に render されます。 |
| `MicroFrontendComponent.errorFallback` | `ReactNode | ((error, state) => ReactNode)` | bundle load 失敗時の任意 UI です。 |
