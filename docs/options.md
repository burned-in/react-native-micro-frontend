# Options Reference

This page lists the public options used by the Host App, each MFE project, the runtime registry, and the runtime APIs.

Use this rule when you are unsure where a value belongs:

- Host-wide safety policy belongs in `react-native-micro-frontend.config.ts`.
- Runtime registration belongs in `rnm.registry.json`.
- One module's build assumptions belong in `mfe.config.ts`.
- Render-time access belongs in `MicroFrontendProvider` and hooks.

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

`mfes` is normally empty in the Host config. Let `rnm add` write runtime registration to `rnm.registry.json`.

## Host config options

File: `host-app/react-native-micro-frontend.config.ts`

| Option | Values | Meaning |
| --- | --- | --- |
| `reactNative.minVersion` | `string` | Minimum React Native version expected by the Host App. |
| `reactNative.hermes` | `"required" \| "optional" \| "disabled"` | Whether Hermes is required, allowed, or disabled. |
| `reactNative.newArchitecture` | `"required" \| "supported" \| "disabled"` | New Architecture compatibility policy. |
| `ota.enabled` | `boolean` | Enables or disables OTA delivery at the Host policy level. |
| `ota.provider` | `"hot-updater" \| "expo" \| "none" \| "custom"` | OTA provider integration selected by the Host. |
| `ota.mode` | `"auto" \| "manual" \| "disabled"` | How publish commands are produced or gated. |
| `ota.existingHotUpdater.strategy` | `"reuse" \| "wrap" \| "separate" \| "disable" \| "manual"` | How to handle an existing Hot Updater config. |
| `ota.existingHotUpdater.configPath` | `string` | Optional path to `hot-updater.config.ts` or `.js`. |
| `nativeChangePolicy` | `"ask" \| "block" \| "apply-and-disable-ota"` | What to do when native changes are detected. |
| `packageManager.supported` | `("bun" \| "deno" \| "npm" \| "pnpm" \| "yarn")[]` | Package managers allowed in Host/MFE workflows. |
| `packageManager.strategy` | `"follow-host" \| "follow-mfe" \| "ask-every-time" \| "manual" \| "follow-existing-project"` | How commands pick a package manager. |
| `packageManager.explicit` | `"bun" \| "deno" \| "npm" \| "pnpm" \| "yarn"` | Optional package manager override. |
| `package.sync` | `"auto" \| "manual" \| "warn-only" \| "disabled"` | Whether dependency sync is automatic, manual, warning-only, or disabled. |
| `package.sharedStrategy` | `"strict-singleton" \| "compatible-semver" \| "warn-only" \| "manual"` | How shared dependencies are handled across Host and MFEs. |
| `ios.pods` | `"auto" \| "manual" \| "disabled" \| "warn-only"` | iOS Pod integration policy. |
| `android.integration` | `"auto" \| "manual" \| "disabled" \| "warn-only"` | Android Gradle/manifest integration policy. |
| `mfes` | `Record<string, MfeConfig>` | Optional static MFE map. Prefer `rnm.registry.json` for runtime registration. |

## MFE config options

File: `mfe-feature/mfe.config.ts`

| Option | Values | Meaning |
| --- | --- | --- |
| `name` | `string` | Stable name used by CLI, registry, and runtime lookup. |
| `version` | `string` | MFE version recorded in registry and publish metadata. |
| `path` | `string` | Optional path from Host App root to MFE project root. |
| `entry` | `string` | Entry file inside the MFE project root. It must default-export the root component. |
| `reactNative` | `{ minVersion; hermes; newArchitecture }` | Optional MFE native/runtime assumptions. |
| `ota.enabled` | `boolean` | Whether this MFE can publish through OTA when checks pass. |
| `ota.mode` | `"auto" \| "manual" \| "disabled"` | MFE-level OTA mode. |
| `ota.provider` | `"hot-updater" \| "expo" \| "none" \| "custom"` | Optional MFE-level OTA provider override. |
| `nativeChangePolicy` | `"ask" \| "block" \| "apply-and-disable-ota"` | MFE behavior when native changes are detected. |
| `packageManager.strategy` | `"follow-host" \| "follow-mfe" \| "ask-every-time" \| "manual" \| "follow-existing-project"` | Package-manager behavior for this MFE. |
| `packageManager.explicit` | `"bun" \| "deno" \| "npm" \| "pnpm" \| "yarn"` | Explicit package manager for this MFE. |
| `package.sync` | `"auto" \| "manual" \| "warn-only" \| "disabled"` | MFE dependency sync policy. |
| `package.sharedStrategy` | `"strict-singleton" \| "compatible-semver" \| "warn-only" \| "manual"` | Shared dependency strategy for this MFE. |
| `package.dependencies` | `Record<string, string>` | MFE dependency versions to check or synchronize. |
| `ios.mode` | `"auto" \| "manual" \| "disabled" \| "warn-only"` | iOS integration behavior for this MFE. |
| `ios.pods` | `{ name; path?; version?; required }[]` | Native pods assumed by this MFE. |
| `android.mode` | `"auto" \| "manual" \| "disabled" \| "warn-only"` | Android integration behavior for this MFE. |
| `android.gradleProjects` | `{ name; path?; required }[]` | Gradle projects assumed by this MFE. |
| `android.permissions` | `string[]` | Android permissions assumed by this MFE. |

## Registry options

File: `host-app/rnm.registry.json`

| Option | Values | Meaning |
| --- | --- | --- |
| `schemaVersion` | `1` | Registry schema version. |
| `hostNativeHash` | `string` | Optional native hash of the installed Host binary. |
| `mfes` | `Record<string, MfeManifest>` | Registered MFE manifests keyed by name. |
| `MfeManifest.name` | `string` | Runtime lookup name. |
| `MfeManifest.version` | `string` | Registered MFE version. |
| `MfeManifest.entry` | `string` | MFE entry file used by Metro and Host resolver. |
| `MfeManifest.path` | `string` | Path from Host App root to MFE project root. |
| `MfeManifest.ota.enabled` | `boolean` | Whether OTA is enabled for this registered MFE. |
| `MfeManifest.ota.mode` | `"auto" \| "manual" \| "disabled"` | Runtime/publish OTA mode. |
| `MfeManifest.ota.provider` | `"hot-updater" \| "expo" \| "none" \| "custom"` | Provider used for this registered MFE. |
| `MfeManifest.nativeChangePolicy` | `"ask" \| "block" \| "apply-and-disable-ota"` | Native-change policy captured for this MFE. |
| `MfeManifest.status` | `"active" \| "blocked" \| "disabled"` | Runtime status. Blocked and disabled modules should not render. |
| `MfeManifest.blockedReason` | `string` | Optional human-readable reason shown in fallback UI or logs. |
| `MfeManifest.nativeHash` | `string` | Optional native hash captured when the MFE was built or synced. |
| `MfeManifest.embeddedBundlePath` | `string` | Optional local embedded JS bundle path. |
| `MfeManifest.otaBundleUrl` | `string` | Optional OTA URL or provider-specific bundle key. |
| `MfeManifest.bundleArchiveUrl` | `string` | Optional compressed bundle archive URL/path produced by `rnm bundle` or `rnm build --archive`. |

## Runtime options

| API | Values | Meaning |
| --- | --- | --- |
| `MicroFrontendProvider.registry` | `MfeRegistry` | Required registry snapshot, usually imported from `rnm.registry.json` or loaded from Host storage. |
| `MicroFrontendProvider.sharedState` | `Record<string, unknown>` | Small Host-owned state snapshot exposed to MFE hooks. |
| `MicroFrontendProvider.isMfe` | `boolean` | Optional manual override for custom renderers. `MicroFrontendComponent` marks loaded MFE subtrees automatically. |
| `MicroFrontendProvider.children` | `ReactNode` | React subtree that can use runtime hooks. |
| `useMicroFrontend(name)` | `RuntimeMfeState` | Returns status, manifest, and reason for one registered MFE. |
| `RuntimeMfeState.status` | `"ready" \| "loading" \| "blocked" \| "missing"` | `ready` can be passed to the Host loader. Other states should render fallback. |
| `useMicroFrontendSharedState<T>()` | `T` | Reads the Host-provided shared state snapshot. |
| `useIsMfe()` | `boolean` | Tells shared components whether they are inside a mounted MFE subtree. |
| `createMicroFrontendLoader(options?)` | `ConfiguredMicroFrontendLoader` | Creates a reusable Host loader. It reads registry config first: `ota.provider`, `embeddedBundlePath`, `otaBundleUrl`, `bundleArchiveUrl`. |
| `loadMicroFrontendModule(manifest, options?)` | `Promise<MicroFrontendModule>` | Resolves one module with Host callbacks. Optional options can directly supply provider, embedded path, OTA URL, or bundle archive URL. |
| `MicroFrontendComponent.name` | `string` | Registered MFE name. |
| `MicroFrontendComponent.load` | `ConfiguredMicroFrontendLoader` | Host loader created by `createMicroFrontendLoader()`, or a compatible loader. |
| `MicroFrontendComponent.loadOptions` | `MicroFrontendLoadOptions` | Optional per-mount provider/path/url/archive overrides when values are not stored in `rnm.registry.json`. |
| `MicroFrontendComponent.fallback` | `ReactNode | ((state) => ReactNode)` | Rendered when missing, blocked, loading, or unavailable. |
| `MicroFrontendComponent.errorFallback` | `ReactNode | ((error, state) => ReactNode)` | Optional UI for bundle load failures. |

## Recommended default

```ts
import { defineReactNativeMicroFrontendConfig } from "@bunin/react-native-micro-frontend";

export default defineReactNativeMicroFrontendConfig({
  reactNative: {
    minVersion: "0.76.0",
    hermes: "required",
    newArchitecture: "supported",
  },

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
    sync: "warn-only",
    sharedStrategy: "compatible-semver",
  },

  ios: { pods: "manual" },
  android: { integration: "manual" },

  mfes: {},
});
```
