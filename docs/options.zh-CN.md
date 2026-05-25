# 选项参考

本页列出 Host App、每个 MFE project、runtime registry 与 runtime API 使用的公开选项。

不确定某个值放在哪里时，请使用下面的规则：

- Host 级 safety policy 放在 `react-native-micro-frontend.config.ts`。
- Runtime registration 放在 `rnm.registry.json`。
- 单个 module 的 build assumptions 放在 `mfe.config.ts`。
- Render-time access 通过 `MicroFrontendProvider` 和 hooks 处理。

## 所属关系图

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

Host config 中的 `mfes` 通常保持为空。Runtime registration 建议由 `rnm add` 写入 `rnm.registry.json`。

## Host config 选项

文件：`host-app/react-native-micro-frontend.config.ts`

| 选项 | 值 | 含义 |
| --- | --- | --- |
| `reactNative.minVersion` | `string` | Host App 期望的最低 React Native version。 |
| `reactNative.hermes` | `"required" \| "optional" \| "disabled"` | Hermes 是必需、可选还是禁用。 |
| `reactNative.newArchitecture` | `"required" \| "supported" \| "disabled"` | New Architecture compatibility policy。 |
| `ota.enabled` | `boolean` | 在 Host policy 层启用或关闭 OTA delivery。 |
| `ota.provider` | `"hot-updater" \| "none" \| "custom"` | Host 选择的 OTA provider integration。 |
| `ota.mode` | `"auto" \| "manual" \| "disabled"` | publish command 的生成或 gate 方式。 |
| `ota.existingHotUpdater.strategy` | `"reuse" \| "wrap" \| "separate" \| "disable" \| "manual"` | 如何处理已有 Hot Updater config。 |
| `ota.existingHotUpdater.configPath` | `string` | 可选。`hot-updater.config.ts` 或 `.js` 路径。 |
| `nativeChangePolicy` | `"ask" \| "block" \| "apply-and-disable-ota"` | 检测到 native change 时的处理方式。 |
| `packageManager.supported` | `("bun" \| "deno" \| "npm" \| "pnpm" \| "yarn")[]` | Host/MFE workflows 中允许使用的 package managers。 |
| `packageManager.strategy` | `"follow-host" \| "follow-mfe" \| "ask-every-time" \| "manual" \| "follow-existing-project"` | command 选择 package manager 的方式。 |
| `packageManager.explicit` | `"bun" \| "deno" \| "npm" \| "pnpm" \| "yarn"` | 可选的 package manager override。 |
| `package.sync` | `"auto" \| "manual" \| "warn-only" \| "disabled"` | dependency sync 是自动、手动、仅警告还是禁用。 |
| `package.sharedStrategy` | `"strict-singleton" \| "compatible-semver" \| "warn-only" \| "manual"` | Host 与 MFE 之间 shared dependencies 的处理方式。 |
| `ios.pods` | `"auto" \| "manual" \| "disabled" \| "warn-only"` | iOS Pod integration policy。 |
| `android.integration` | `"auto" \| "manual" \| "disabled" \| "warn-only"` | Android Gradle/manifest integration policy。 |
| `mfes` | `Record<string, MfeConfig>` | 可选 static MFE map。Runtime registration 建议使用 `rnm.registry.json`。 |

## MFE config 选项

文件：`mfe-feature/mfe.config.ts`

| 选项 | 值 | 含义 |
| --- | --- | --- |
| `name` | `string` | CLI、registry、runtime lookup 使用的稳定名称。 |
| `version` | `string` | 记录在 registry 与 publish metadata 中的 MFE version。 |
| `path` | `string` | 可选。Host App root 到 MFE project root 的路径。 |
| `entry` | `string` | MFE project root 内的 entry file，必须 default-export root component。 |
| `reactNative` | `{ minVersion; hermes; newArchitecture }` | 可选的 MFE native/runtime assumptions。 |
| `ota.enabled` | `boolean` | compatibility check 通过时，此 MFE 是否可通过 OTA publish。 |
| `ota.mode` | `"auto" \| "manual" \| "disabled"` | MFE-level OTA mode。 |
| `ota.provider` | `"hot-updater" \| "none" \| "custom"` | 可选的 MFE-level OTA provider override。 |
| `nativeChangePolicy` | `"ask" \| "block" \| "apply-and-disable-ota"` | 检测到 native changes 时此 MFE 的行为。 |
| `packageManager.strategy` | `"follow-host" \| "follow-mfe" \| "ask-every-time" \| "manual" \| "follow-existing-project"` | 此 MFE 的 package-manager behavior。 |
| `packageManager.explicit` | `"bun" \| "deno" \| "npm" \| "pnpm" \| "yarn"` | 此 MFE 的明确 package manager。 |
| `package.sync` | `"auto" \| "manual" \| "warn-only" \| "disabled"` | MFE dependency sync policy。 |
| `package.sharedStrategy` | `"strict-singleton" \| "compatible-semver" \| "warn-only" \| "manual"` | 此 MFE 的 shared dependency strategy。 |
| `package.dependencies` | `Record<string, string>` | 需要 check 或 synchronize 的 MFE dependency versions。 |
| `ios.mode` | `"auto" \| "manual" \| "disabled" \| "warn-only"` | 此 MFE 的 iOS integration behavior。 |
| `ios.pods` | `{ name; path?; version?; required }[]` | 此 MFE 假设存在的 native pods。 |
| `android.mode` | `"auto" \| "manual" \| "disabled" \| "warn-only"` | 此 MFE 的 Android integration behavior。 |
| `android.gradleProjects` | `{ name; path?; required }[]` | 此 MFE 假设存在的 Gradle projects。 |
| `android.permissions` | `string[]` | 此 MFE 假设存在的 Android permissions。 |

## Registry 选项

文件：`host-app/rnm.registry.json`

| 选项 | 值 | 含义 |
| --- | --- | --- |
| `schemaVersion` | `1` | Registry schema version。 |
| `hostNativeHash` | `string` | 可选。已安装 Host binary 的 native hash。 |
| `mfes` | `Record<string, MfeManifest>` | 按 name 组织的 registered MFE manifests。 |
| `MfeManifest.name` | `string` | Runtime lookup name。 |
| `MfeManifest.version` | `string` | Registered MFE version。 |
| `MfeManifest.entry` | `string` | Metro 与 Host resolver 使用的 MFE entry file。 |
| `MfeManifest.path` | `string` | Host App root 到 MFE project root 的路径。 |
| `MfeManifest.ota.enabled` | `boolean` | 此 registered MFE 是否启用 OTA。 |
| `MfeManifest.ota.mode` | `"auto" \| "manual" \| "disabled"` | Runtime/publish OTA mode。 |
| `MfeManifest.ota.provider` | `"hot-updater" \| "none" \| "custom"` | 此 registered MFE 使用的 provider。 |
| `MfeManifest.nativeChangePolicy` | `"ask" \| "block" \| "apply-and-disable-ota"` | 为此 MFE 捕获的 native-change policy。 |
| `MfeManifest.status` | `"active" \| "blocked" \| "disabled"` | Runtime status。blocked/disabled modules 不应 render。 |
| `MfeManifest.blockedReason` | `string` | 可选。fallback UI 或 logs 中显示的人类可读原因。 |
| `MfeManifest.nativeHash` | `string` | 可选。MFE build 或 sync 时捕获的 native hash。 |
| `MfeManifest.embeddedBundlePath` | `string` | 可选。local embedded JS bundle path。 |
| `MfeManifest.otaBundleUrl` | `string` | 可选。OTA URL 或 provider-specific bundle key。 |

## Runtime 选项

| API | 值 | 含义 |
| --- | --- | --- |
| `MicroFrontendProvider.registry` | `MfeRegistry` | 必需的 registry snapshot，通常来自 `rnm.registry.json` 或 Host storage。 |
| `MicroFrontendProvider.sharedState` | `Record<string, unknown>` | 暴露给 MFE hooks 的小型 Host-owned state snapshot。 |
| `MicroFrontendProvider.isMfe` | `boolean` | 标记 subtree 是 Host-mounted MFE。`useIsMfe()` 读取此值。 |
| `MicroFrontendProvider.children` | `ReactNode` | 可以使用 runtime hooks 的 React subtree。 |
| `useMicroFrontend(name)` | `RuntimeMfeState` | 返回一个 registered MFE 的 status、manifest 与 reason。 |
| `RuntimeMfeState.status` | `"ready" \| "loading" \| "blocked" \| "missing"` | 只有 `ready` 可以交给 Host loader；其他状态应 render fallback。 |
| `useMicroFrontendSharedState<T>()` | `T` | 读取 Host-provided shared state snapshot。 |
| `useIsMfe()` | `boolean` | 告诉 shared components 是否运行在 mounted MFE subtree 中。 |
| `MicroFrontendScreen.name` | `string` | Registered MFE name。 |
| `MicroFrontendScreen.fallback` | `ReactNode` | 不安全或不可用时 render。此 component 是 fallback-first；真实 loader 请通过 `useMicroFrontend()` 连接。 |
