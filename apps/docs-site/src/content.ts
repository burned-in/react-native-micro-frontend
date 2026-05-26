export type NavItem = {
  readonly label: string;
  readonly href: string;
};

export type Feature = {
  readonly title: string;
  readonly body: string;
};

export type DocSection = {
  readonly eyebrow?: string;
  readonly title: string;
  readonly body: readonly string[];
  readonly code?: string;
  readonly cards?: readonly Feature[];
};

export const navItems: readonly NavItem[] = [
  { label: 'Overview', href: '/' },
  { label: 'Docs', href: '/docs' },
  { label: 'Getting started', href: '/docs/getting-started' },
  { label: 'Options', href: '/docs/options' },
  { label: 'Hot Updater', href: '/docs/hot-updater' },
  { label: 'Package managers', href: '/docs/package-managers' },
  { label: 'Native contract', href: '/docs/native-contract' },
  { label: '한국어', href: '/ko/docs' },
  { label: '中文', href: '/zh-cn/docs' },
  { label: '日本語', href: '/jp/docs' },
];

export const packageManagers = ['Bun', 'npm', 'pnpm', 'Yarn', 'Deno'] as const;

export const installMatrix = [
  {
    tool: 'Bun',
    runtime: 'bun add @bunin/react-native-micro-frontend',
    cli: 'bun add -d @bunin/react-native-micro-frontend-cli',
    run: 'bunx @bunin/react-native-micro-frontend-cli init',
    release: 'bun run release:publish',
  },
  {
    tool: 'npm',
    runtime: 'npm install @bunin/react-native-micro-frontend',
    cli: 'npm install --save-dev @bunin/react-native-micro-frontend-cli',
    run: 'npx @bunin/react-native-micro-frontend-cli init',
    release: 'npm run release:publish',
  },
  {
    tool: 'pnpm',
    runtime: 'pnpm add @bunin/react-native-micro-frontend',
    cli: 'pnpm add -D @bunin/react-native-micro-frontend-cli',
    run: 'pnpm dlx @bunin/react-native-micro-frontend-cli init',
    release: 'pnpm run release:publish',
  },
  {
    tool: 'Yarn',
    runtime: 'yarn add @bunin/react-native-micro-frontend',
    cli: 'yarn add -D @bunin/react-native-micro-frontend-cli',
    run: 'yarn dlx @bunin/react-native-micro-frontend-cli init',
    release: 'yarn release:publish',
  },
  {
    tool: 'Deno',
    runtime: 'deno add npm:@bunin/react-native-micro-frontend',
    cli: 'deno add --package-json --dev npm:@bunin/react-native-micro-frontend-cli',
    run: 'deno run -A npm:@bunin/react-native-micro-frontend-cli init',
    release: 'deno task release:publish',
  },
] as const;

export const features: readonly Feature[] = [
  {
    title: 'Native-safe OTA',
    body: 'OTA is allowed only when React Native, Hermes, New Architecture, and native dependency assumptions still match the host binary.',
  },
  {
    title: 'Registry-first runtime',
    body: 'Every feature module has a version, entry point, native hash, OTA policy, and runtime state that the host can inspect before loading.',
  },
  {
    title: 'Hot Updater compatible',
    body: 'The library wraps and verifies Hot Updater workflows instead of replacing your existing OTA delivery engine.',
  },
  {
    title: 'Metro auto wiring',
    body: 'withMfe reads rnm.registry.json, watches registered MFE roots, and maps shared packages to the Host node_modules automatically.',
  },
  {
    title: 'Minimal bundle archives',
    body: 'rnm bundle runs React Native bundling and archives only index.bundle, Metro assets, and manifest.json for Host copy or CDN delivery.',
  },
  {
    title: 'Host-provided state',
    body: 'The host can intentionally provide session, locale, feature flags, or analytics context to feature modules through runtime hooks.',
  },
  {
    title: 'Package-manager neutral',
    body: 'Consumer projects can use Bun, npm, pnpm, Yarn, or Deno while the repository release pipeline remains Bun-first.',
  },
  {
    title: 'Reviewable integration',
    body: 'Generated Podfile, Gradle, and Metro include files are explicit artifacts; the CLI avoids silent native patching.',
  },
];

export const homeSections: readonly DocSection[] = [
  {
    eyebrow: 'Development status',
    title: 'Active development on the 0.x line.',
    body: [
      'This project is still being hardened across the runtime, CLI, native-contract checks, and Hot Updater adapter workflows.',
      'Pin exact package versions before production use, run native compatibility checks in CI, and expect API refinements while the 0.x line evolves.',
    ],
    code: `status: active development
license: MIT
beerware spirit: appreciated, not the legal package license`,
  },
  {
    eyebrow: 'Core concept',
    title: 'Separate JavaScript delivery from native binary risk.',
    body: [
      'React Native apps have two deployment surfaces: JavaScript that can usually ship through OTA, and native code that requires an app store release.',
      'This library records the native contract of the host and every feature module, then blocks unsafe OTA before runtime or publish time.',
    ],
    code: `if nativeContractChanged
  block OTA
  require store release
else if moduleBlocked
  block runtime load
else
  allow Hot Updater deploy`,
  },
  {
    eyebrow: 'Install',
    title: 'Start with Bun, keep every package manager supported.',
    body: [
      'Bun is the preferred local workflow for this repository. Consumer apps can still install and run the CLI with npm, pnpm, Yarn, or Deno.',
    ],
    code: `bun add @bunin/react-native-micro-frontend
bun add -d @bunin/react-native-micro-frontend-cli
bunx @bunin/react-native-micro-frontend-cli init`,
  },
  {
    eyebrow: 'First module',
    title: 'A beginner-friendly path from empty host to verified module.',
    body: [
      'Initialize the host, register one feature module, verify native compatibility, then publish only after the safety check passes.',
      'The sample name is intentionally generic so teams can replace it with checkout, profile, support, payments, or any product feature.',
    ],
    code: `rnm init
rnm add mfe-feature --path ../mfe-feature --entry ./src/index.tsx --version 1.0.0
rnm verify mfe-feature
rnm publish mfe-feature --package-manager bun --channel production`,
  },

  {
    eyebrow: 'Easy Way',
    title: 'Pick the menu you need: generic, bundle, or OTA.',
    body: [
      'Generic treats the MFE like a normal TypeScript module: Metro bundles a local or sibling project through withMfe and a static import map.',
      'Bundle creates a portable archive containing only index.bundle, assets, and manifest.json, then can copy it to the Host and write bundleArchiveUrl.',
      'OTA keeps Hot Updater or your custom OTA engine in charge of distribution after native-safety verification passes.',
    ],
    code: `# 1. Generic: normal TS module style
rnm add mfe-feature --path ../mfe-feature --entry ./src/index.tsx --version 1.0.0 --no-ota --ota-provider none --ota-mode disabled

# host-app/metro.config.js
const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");

module.exports = (async () => {
  const { withMfe } = await import("@bunin/react-native-micro-frontend/metro");
  return withMfe(__dirname, mergeConfig(getDefaultConfig(__dirname), {}));
})();

# 2. Bundle: portable archive
# in mfe-feature/
rnm bundle --platform ios --host ../host-app --update-registry

# 3. OTA: verified remote delivery
rnm verify mfe-feature
rnm publish mfe-feature --package-manager bun --channel production`,
  },
  {
    eyebrow: 'Metro and bundles',
    title: 'Use withMfe for Metro, and rnm bundle for portable artifacts.',
    body: [
      'withMfe merges your Metro config with MFE watchFolders and shared-package aliases from rnm.registry.json, so manual extraNodeModules setup is no longer the default path.',
      'When you need a Hot-Updater-like artifact, run rnm bundle in the MFE project. It packages only index.bundle, assets, and manifest.json, then can copy the archive into the Host project.',
    ],
    code: `// host-app/metro.config.js
const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");

module.exports = (async () => {
  const { withMfe } = await import("@bunin/react-native-micro-frontend/metro");
  const defaultConfig = getDefaultConfig(__dirname);

  return withMfe(__dirname, mergeConfig(defaultConfig, {}));
})();

# in mfe-feature/
rnm bundle --platform ios --host ../host-app --update-registry`,
  },
];

export const gettingStartedSections: readonly DocSection[] = [
  {
    eyebrow: 'Step 0',
    title: 'Understand the Host / MFE split first.',
    body: [
      'You are building two projects: a Host App that owns the installed native binary, navigation, fallback UI, shared state, and bundle loader; and an MFE that ships one feature as a separate JavaScript bundle.',
      'Host policy lives in react-native-micro-frontend.config.ts. Runtime module registration lives in rnm.registry.json generated by rnm add. The MFE entry file default-exports one root component.',
      'This library is the native-safety and registry layer. It does not magically execute remote JavaScript; the Host connects Hot Updater, an embedded bundle, or a custom loader.',
    ],
    code: `host-app/
  react-native-micro-frontend.config.ts  # Host policy
  rnm.registry.json                      # runtime MFE registry

mfe-feature/
  src/index.tsx                          # default component entry
  mfe.config.ts                          # MFE-local assumptions`,
  },
  {
    eyebrow: 'Step 1',
    title: 'Install the runtime and CLI.',
    body: [
      'Install the runtime package in the host app and add the CLI as a dev dependency. Bun is the preferred local workflow, but the published packages work with npm, pnpm, Yarn, and Deno.',
      'Run init once in the host app. It creates a reviewable React Native Micro Frontend config instead of silently patching native files.',
    ],
    code: `bun add @bunin/react-native-micro-frontend
bun add -d @bunin/react-native-micro-frontend-cli
bunx @bunin/react-native-micro-frontend-cli init`,
  },
  {
    eyebrow: 'Step 2',
    title: 'Declare host policy before adding modules.',
    body: [
      'react-native-micro-frontend.config.ts describes host policy. Keep mfes empty for the normal flow; runtime module registration lives in rnm.registry.json generated by rnm add.',
      'The host config owns OTA, package-manager, native-change, iOS, and Android policy. Generated native integration remains reviewable.',
    ],
    code: `import { defineReactNativeMicroFrontendConfig } from "@bunin/react-native-micro-frontend";

export default defineReactNativeMicroFrontendConfig({
  ota: { enabled: true, provider: "hot-updater", mode: "manual" },
  nativeChangePolicy: "ask",
  packageManager: {
    supported: ["bun", "deno", "npm", "pnpm", "yarn"],
    strategy: "follow-host",
  },
  package: { sync: "manual", sharedStrategy: "strict-singleton" },
  ios: { pods: "manual" },
  android: { integration: "manual" },
  mfes: {},
});`,
  },
  {
    eyebrow: 'Step 3',
    title: 'Register, verify, then publish the first MFE.',
    body: [
      'rnm add creates or updates rnm.registry.json in the Host App. The entry value is the file inside the MFE project root that Metro bundles and the host resolver later loads.',
      'Only publish after verification passes. If native contract checks fail, ship a store release instead of pushing an unsafe OTA update.',
    ],
    code: `rnm add mfe-feature --path ../mfe-feature --entry ./src/index.tsx --version 1.0.0
rnm verify mfe-feature
rnm publish mfe-feature --package-manager bun --channel production

// rnm.registry.json
{
  "schemaVersion": 1,
  "mfes": {
    "mfe-feature": {
      "name": "mfe-feature",
      "version": "1.0.0",
      "entry": "./src/index.tsx",
      "path": "../mfe-feature",
      "ota": { "enabled": true, "mode": "manual", "provider": "hot-updater" },
      "nativeChangePolicy": "ask",
      "status": "active"
    }
  }
}`,
  },
  {
    eyebrow: 'Step 4',
    title: 'Default-export the MFE component.',
    body: [
      'The MFE entry file must default-export its root React component. Do not rely on a named export unless your own host loader explicitly maps it.',
      'The registry entry path points to this file. Metro bundles it; the host-specific resolver evaluates it and reads module.default.',
    ],
    code: `// mfe-feature/src/index.tsx
import { Text, View } from "react-native";

export default function MfeFeature() {
  return (
    <View>
      <Text>MFE Feature</Text>
    </View>
  );
}`,
  },
  {
    eyebrow: 'Step 5',
    title: 'Mount through the runtime safety gate and a host loader.',
    body: [
      'The runtime package checks missing modules, blocked modules, and native hash mismatches. It does not download or evaluate JavaScript bundles by itself.',
      'Use createMicroFrontendLoader() and MicroFrontendComponent. The loader reads registry config first (ota.provider, embeddedBundlePath, otaBundleUrl, bundleArchiveUrl), and loadOptions can supply direct per-mount metadata.',
    ],
    code: `import type { MfeManifest, MfeRegistry } from "@bunin/react-native-micro-frontend";
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

// Replace these declarations with your real Hot Updater, embedded-bundle, or custom CDN implementation.
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
      sharedState={{ locale: "en-US" }}
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

// Optional direct settings when a value is not stored in rnm.registry.json:
// <MicroFrontendComponent
//   name="mfe-feature"
//   load={loadMfeModule}
//   loadOptions={{ provider: "custom", bundleArchiveUrl: "https://cdn.example.com/mfe.ios.ota.tar.gz" }}
//   fallback={(state) => <Loading reason={state.reason} />}
// />`,
  },
  {
    eyebrow: 'Step 6',
    title: 'Merge Metro config with withMfe.',
    body: [
      'Add withMfe in the Host App metro.config.js. It reads rnm.registry.json, adds active MFE roots to watchFolders, and maps shared packages to the Host node_modules automatically.',
      'Pass your existing mergeConfig result into withMfe. Existing resolver.extraNodeModules overrides are preserved and still take precedence.',
    ],
    code: `const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");

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
})();`,
  },
  {
    eyebrow: 'Step 7',
    title: 'Bundle only the files the Host needs.',
    body: [
      'Run rnm bundle inside the MFE project when you want a Hot-Updater-like archive. It executes React Native bundling, writes index.bundle, assets, and manifest.json, then compresses only those files.',
      'Use --host to copy the archive into the Host project and --update-registry to set bundleArchiveUrl in rnm.registry.json. Your custom loader still owns download, verification, unpacking, and JS evaluation.',
    ],
    code: `# in mfe-feature/
rnm bundle --platform ios --host ../host-app --update-registry

# output
# dist/rnm-bundles/mfe-feature/ios/index.bundle
# dist/rnm-bundles/mfe-feature/ios/assets/
# dist/rnm-bundles/mfe-feature/ios/manifest.json
# dist/rnm-bundles/mfe-feature/ios/mfe-feature.ios.ota.tar.gz`,
  },

  {
    eyebrow: 'Easy Way',
    title: 'Use one of three menus: generic, bundle, or OTA.',
    body: [
      'Generic is the normal TypeScript-module style. Register with OTA disabled, add withMfe to metro.config.js, and keep the Host loader import static so Metro can include the MFE source.',
      'Bundle is the portable archive style. Run rnm bundle in the MFE project to produce only index.bundle, assets, manifest.json, and a .tar.gz; use bundleArchiveUrl with a custom loader.',
      'OTA is the remote delivery style. Register with hot-updater or custom OTA metadata, run verify before publish, and let the OTA engine distribute and evaluate JavaScript only after native-safety checks pass.',
      'You do not need to pass an isMfe prop. MicroFrontendComponent automatically marks the loaded subtree as MFE context.',
    ],
    code: `# 1. Generic: normal TS module style
# host-app/
rnm add mfe-feature --path ../mfe-feature --entry ./src/index.tsx --version 1.0.0 --no-ota --ota-provider none --ota-mode disabled

const localModules = {
  "mfe-feature": () => import("../mfe-feature/src/index"),
};

# 2. Bundle: portable archive
# mfe-feature/
rnm bundle --platform ios --host ../host-app --update-registry

const bundleLoader = createMicroFrontendLoader({
  custom: loadBundleArchive,
});

# 3. OTA: Hot Updater or custom OTA
# host-app/
rnm add mfe-feature --path ../mfe-feature --entry ./src/index.tsx --version 1.0.0 --ota-provider hot-updater --ota-mode manual
rnm verify mfe-feature
rnm publish mfe-feature --package-manager bun --channel production

const otaLoader = createMicroFrontendLoader({
  hotUpdater: loadWithHotUpdater,
  custom: loadWithCustomOta,
});`,
  },
];

export const optionsSections: readonly DocSection[] = [
  {
    eyebrow: 'Options map',
    title: 'Know which file owns each option.',
    body: [
      'Host policy options live in react-native-micro-frontend.config.ts. Runtime module options live in rnm.registry.json. MFE-local assumptions live in mfe.config.ts.',
      'Keep host policy and runtime registration separate so a new maintainer can tell whether a value changes app policy, module registration, or one feature bundle.',
    ],
    code: `host-app/react-native-micro-frontend.config.ts
  reactNative
  ota
  nativeChangePolicy
  packageManager
  package
  ios
  android
  mfes: {}              # normally empty; registration is in rnm.registry.json

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
  android`,
  },
  {
    eyebrow: 'Host config',
    title: 'react-native-micro-frontend.config.ts options.',
    body: [
      'These options describe the Host App policy. They do not download MFE code and should not be treated as the runtime registry.',
      'The recommended first setup keeps mfes empty and lets rnm add write rnm.registry.json.',
    ],
    code: `reactNative.minVersion: string
  Minimum React Native version expected by the Host App.

reactNative.hermes: "required" | "optional" | "disabled"
  Whether Hermes is required, allowed, or disabled for compatible MFEs.

reactNative.newArchitecture: "required" | "supported" | "disabled"
  New Architecture compatibility policy.

ota.enabled: boolean
  Enables or disables OTA delivery at the Host policy level.

ota.provider: "hot-updater" | "none" | "custom"
  OTA provider integration selected by the Host.

ota.mode: "auto" | "manual" | "disabled"
  How publish commands should be produced or gated.

ota.existingHotUpdater.strategy:
  "reuse" | "wrap" | "separate" | "disable" | "manual"
  How to handle an existing Hot Updater config.

ota.existingHotUpdater.configPath?: string
  Path to an existing hot-updater.config.ts or .js.

nativeChangePolicy: "ask" | "block" | "apply-and-disable-ota"
  What to do when native changes are detected.

packageManager.supported: ("bun" | "deno" | "npm" | "pnpm" | "yarn")[]
  Package managers allowed in Host/MFE workflows.

packageManager.strategy:
  "follow-host" | "follow-mfe" | "ask-every-time" | "manual" | "follow-existing-project"
  How commands pick a package manager.

packageManager.explicit?: "bun" | "deno" | "npm" | "pnpm" | "yarn"
  Explicit package manager override.

package.sync: "auto" | "manual" | "warn-only" | "disabled"
  Whether package.json dependency synchronization is automatic or manual.

package.sharedStrategy:
  "strict-singleton" | "compatible-semver" | "warn-only" | "manual"
  How shared dependencies are handled across Host and MFEs.

ios.pods: "auto" | "manual" | "disabled" | "warn-only"
  iOS Pod integration policy.

android.integration: "auto" | "manual" | "disabled" | "warn-only"
  Android Gradle/manifest integration policy.

mfes: Record<string, MfeConfig>
  Optional static MFE config map. Normal runtime registration should live in rnm.registry.json.`,
  },
  {
    eyebrow: 'MFE config',
    title: 'mfe.config.ts options.',
    body: [
      'These options describe one feature module and the native assumptions it was built with.',
      'The entry file should default-export the root React component that the Host loader eventually renders as module.default.',
    ],
    code: `name: string
  Stable MFE name used by CLI, registry, and runtime lookup.

version: string
  MFE version recorded in the registry and publish metadata.

path?: string
  Path from Host App root to the MFE project root.

entry: string
  Entry file inside the MFE project root. This file must default-export the root component.

reactNative?: { minVersion; hermes; newArchitecture }
  Optional MFE-level native/runtime assumptions.

ota.enabled: boolean
  Whether this MFE can be published through OTA when compatibility checks pass.

ota.mode: "auto" | "manual" | "disabled"
  MFE-level OTA mode.

ota.provider?: "hot-updater" | "none" | "custom"
  Optional MFE-level OTA provider override.

nativeChangePolicy: "ask" | "block" | "apply-and-disable-ota"
  MFE-level behavior when native changes are detected.

packageManager.strategy:
  "follow-host" | "follow-mfe" | "ask-every-time" | "manual" | "follow-existing-project"
  Package-manager behavior for this MFE.

packageManager.explicit?: "bun" | "deno" | "npm" | "pnpm" | "yarn"
  Explicit package manager for this MFE.

package.sync?: "auto" | "manual" | "warn-only" | "disabled"
  MFE dependency synchronization policy.

package.sharedStrategy?:
  "strict-singleton" | "compatible-semver" | "warn-only" | "manual"
  Shared dependency strategy for this MFE.

package.dependencies?: Record<string, string>
  MFE dependency versions that should be checked or synchronized.

ios.mode?: "auto" | "manual" | "disabled" | "warn-only"
  iOS integration behavior for this MFE.

ios.pods?: { name: string; path?: string; version?: string; required: boolean }[]
  Native pods assumed by this MFE.

android.mode?: "auto" | "manual" | "disabled" | "warn-only"
  Android integration behavior for this MFE.

android.gradleProjects?: { name: string; path?: string; required: boolean }[]
  Gradle projects assumed by this MFE.

android.permissions?: string[]
  Android permissions assumed by this MFE.`,
  },
  {
    eyebrow: 'Registry',
    title: 'rnm.registry.json runtime options.',
    body: [
      'The Host runtime reads this registry before rendering any feature module. It is the runtime source of truth for registered MFEs.',
      'rnm add creates the basic entry. verify, sync, or publish workflows can add native hash and provider-specific bundle metadata.',
    ],
    code: `schemaVersion: 1
  Registry schema version.

hostNativeHash?: string
  Native hash of the installed Host binary.

mfes: Record<string, MfeManifest>
  Registered MFE manifests keyed by name.

MfeManifest.name: string
  Runtime lookup name.

MfeManifest.version: string
  Registered MFE version.

MfeManifest.entry: string
  MFE entry file used by Metro and the Host resolver.

MfeManifest.path: string
  Path from Host App root to the MFE project root.

MfeManifest.ota.enabled: boolean
  Whether OTA is enabled for this registered MFE.

MfeManifest.ota.mode: "auto" | "manual" | "disabled"
  Runtime/publish OTA mode for this registered MFE.

MfeManifest.ota.provider: "hot-updater" | "none" | "custom"
  Provider used for this registered MFE.

MfeManifest.nativeChangePolicy:
  "ask" | "block" | "apply-and-disable-ota"
  Native-change policy captured for this MFE.

MfeManifest.status: "active" | "blocked" | "disabled"
  Runtime status. Blocked and disabled modules should not render.

MfeManifest.blockedReason?: string
  Human-readable reason shown in fallback UI or logs.

MfeManifest.nativeHash?: string
  Native hash captured when this MFE was built or synced.

MfeManifest.embeddedBundlePath?: string
  Optional local embedded JS bundle path.

MfeManifest.otaBundleUrl?: string
  Optional OTA URL or provider-specific bundle key.

MfeManifest.bundleArchiveUrl?: string
  Optional compressed bundle archive URL/path produced by rnm bundle or rnm build --archive.`,
  },
  {
    eyebrow: 'Runtime',
    title: 'Provider, hooks, loader, and component options.',
    body: [
      'Runtime APIs do safety checks and expose Host-owned shared state. They do not implement the bundle transport.',
      'Use createMicroFrontendLoader() and MicroFrontendComponent for real loading flows; useMicroFrontend() remains available for custom flows.',
    ],
    code: `MicroFrontendProvider.registry: MfeRegistry
  Required registry snapshot, usually imported from rnm.registry.json or loaded from Host storage.

MicroFrontendProvider.sharedState?: Record<string, unknown>
  Small Host-owned state snapshot exposed to MFE hooks.

MicroFrontendProvider.isMfe?: boolean
  Optional manual override for custom renderers. MicroFrontendComponent marks loaded MFE subtrees automatically.

MicroFrontendProvider.children: ReactNode
  React subtree that can use runtime hooks.

useMicroFrontend(name: string): RuntimeMfeState
  Returns status, manifest, and reason for one registered MFE.

RuntimeMfeState.status: "ready" | "loading" | "blocked" | "missing"
  Ready can be handed to the Host loader. Blocked/missing should render fallback.

useMicroFrontendSharedState<T>(): T
  Reads the Host-provided sharedState snapshot.

useIsMfe(): boolean
  Tells shared components whether they are running in a mounted MFE subtree.

createMicroFrontendLoader(options?): ConfiguredMicroFrontendLoader
  Creates a reusable Host loader. It reads registry config first: ota.provider, embeddedBundlePath, otaBundleUrl, bundleArchiveUrl.

loadMicroFrontendModule(manifest, options?): Promise<MicroFrontendModule>
  Resolves one module with Host callbacks. Optional options can directly supply provider, embeddedBundlePath, otaBundleUrl, or bundleArchiveUrl.

MicroFrontendComponent.name: string
  Registered MFE name.

MicroFrontendComponent.load: ConfiguredMicroFrontendLoader
  Host loader created by createMicroFrontendLoader(), or your compatible loader.

MicroFrontendComponent.loadOptions?: MicroFrontendLoadOptions
  Direct per-mount provider/path/url/archive overrides when values are not stored in rnm.registry.json.

MicroFrontendComponent.fallback: ReactNode | ((state) => ReactNode)
  Rendered when missing, blocked, loading, or unavailable.

MicroFrontendComponent.errorFallback?: ReactNode | ((error, state) => ReactNode)
  Optional UI for bundle load failures.`,
  },
];

const localizedOptionCode = {
  ko: {
    map: `host-app/react-native-micro-frontend.config.ts
  reactNative
  ota
  nativeChangePolicy
  packageManager
  package
  ios
  android
  mfes: {}              # 보통 비워 둡니다. 등록 정보는 rnm.registry.json에 둡니다.

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
  android`,
    host: `reactNative.minVersion: string
  Host App이 기대하는 최소 React Native version입니다.

reactNative.hermes: "required" | "optional" | "disabled"
  compatible MFE에서 Hermes를 필수, 허용, 비활성 중 하나로 정합니다.

reactNative.newArchitecture: "required" | "supported" | "disabled"
  New Architecture compatibility policy입니다.

ota.enabled: boolean
  Host policy 레벨에서 OTA delivery를 켜거나 끕니다.

ota.provider: "hot-updater" | "none" | "custom"
  Host가 선택한 OTA provider integration입니다.

ota.mode: "auto" | "manual" | "disabled"
  publish command를 자동 생성할지, manual gate로 둘지, 비활성화할지 정합니다.

ota.existingHotUpdater.strategy:
  "reuse" | "wrap" | "separate" | "disable" | "manual"
  기존 Hot Updater config를 어떻게 처리할지 정합니다.

ota.existingHotUpdater.configPath?: string
  기존 hot-updater.config.ts 또는 .js 경로입니다.

nativeChangePolicy: "ask" | "block" | "apply-and-disable-ota"
  native 변경이 감지됐을 때의 처리 방식입니다.

packageManager.supported: ("bun" | "deno" | "npm" | "pnpm" | "yarn")[]
  Host/MFE workflow에서 허용하는 package manager 목록입니다.

packageManager.strategy:
  "follow-host" | "follow-mfe" | "ask-every-time" | "manual" | "follow-existing-project"
  command가 package manager를 선택하는 방식입니다.

packageManager.explicit?: "bun" | "deno" | "npm" | "pnpm" | "yarn"
  명시적인 package manager override입니다.

package.sync: "auto" | "manual" | "warn-only" | "disabled"
  package.json dependency synchronization을 자동, 수동, warning-only, disabled 중 하나로 정합니다.

package.sharedStrategy:
  "strict-singleton" | "compatible-semver" | "warn-only" | "manual"
  Host와 MFE 사이 shared dependency 처리 방식입니다.

ios.pods: "auto" | "manual" | "disabled" | "warn-only"
  iOS Pod integration policy입니다.

android.integration: "auto" | "manual" | "disabled" | "warn-only"
  Android Gradle/manifest integration policy입니다.

mfes: Record<string, MfeConfig>
  선택적 static MFE config map입니다. 일반 runtime registration은 rnm.registry.json에 둡니다.`,
    mfe: `name: string
  CLI, registry, runtime lookup에서 쓰는 안정적인 MFE name입니다.

version: string
  registry와 publish metadata에 기록되는 MFE version입니다.

path?: string
  Host App root 기준 MFE project root 경로입니다.

entry: string
  MFE project root 안의 entry file입니다. root component를 default export해야 합니다.

reactNative?: { minVersion; hermes; newArchitecture }
  선택적인 MFE-level native/runtime assumptions입니다.

ota.enabled: boolean
  compatibility check가 통과했을 때 이 MFE를 OTA publish할 수 있는지 정합니다.

ota.mode: "auto" | "manual" | "disabled"
  MFE-level OTA mode입니다.

ota.provider?: "hot-updater" | "none" | "custom"
  선택적인 MFE-level OTA provider override입니다.

nativeChangePolicy: "ask" | "block" | "apply-and-disable-ota"
  native 변경 감지 시 MFE-level 처리 방식입니다.

packageManager.strategy:
  "follow-host" | "follow-mfe" | "ask-every-time" | "manual" | "follow-existing-project"
  이 MFE의 package-manager behavior입니다.

packageManager.explicit?: "bun" | "deno" | "npm" | "pnpm" | "yarn"
  이 MFE에서 명시적으로 사용할 package manager입니다.

package.sync?: "auto" | "manual" | "warn-only" | "disabled"
  MFE dependency synchronization policy입니다.

package.sharedStrategy?:
  "strict-singleton" | "compatible-semver" | "warn-only" | "manual"
  이 MFE의 shared dependency strategy입니다.

package.dependencies?: Record<string, string>
  check 또는 synchronize할 MFE dependency versions입니다.

ios.mode?: "auto" | "manual" | "disabled" | "warn-only"
  이 MFE의 iOS integration behavior입니다.

ios.pods?: { name: string; path?: string; version?: string; required: boolean }[]
  이 MFE가 가정하는 native pods입니다.

android.mode?: "auto" | "manual" | "disabled" | "warn-only"
  이 MFE의 Android integration behavior입니다.

android.gradleProjects?: { name: string; path?: string; required: boolean }[]
  이 MFE가 가정하는 Gradle projects입니다.

android.permissions?: string[]
  이 MFE가 가정하는 Android permissions입니다.`,
    registry: `schemaVersion: 1
  Registry schema version입니다.

hostNativeHash?: string
  설치된 Host binary의 native hash입니다.

mfes: Record<string, MfeManifest>
  name을 key로 갖는 registered MFE manifests입니다.

MfeManifest.name: string
  Runtime lookup name입니다.

MfeManifest.version: string
  등록된 MFE version입니다.

MfeManifest.entry: string
  Metro와 Host resolver가 사용하는 MFE entry file입니다.

MfeManifest.path: string
  Host App root 기준 MFE project root 경로입니다.

MfeManifest.ota.enabled: boolean
  이 registered MFE의 OTA 활성 여부입니다.

MfeManifest.ota.mode: "auto" | "manual" | "disabled"
  이 registered MFE의 runtime/publish OTA mode입니다.

MfeManifest.ota.provider: "hot-updater" | "none" | "custom"
  이 registered MFE가 사용하는 provider입니다.

MfeManifest.nativeChangePolicy:
  "ask" | "block" | "apply-and-disable-ota"
  이 MFE에 캡처된 native-change policy입니다.

MfeManifest.status: "active" | "blocked" | "disabled"
  Runtime status입니다. blocked/disabled module은 render하지 않아야 합니다.

MfeManifest.blockedReason?: string
  fallback UI나 log에 보여줄 사람이 읽는 이유입니다.

MfeManifest.nativeHash?: string
  이 MFE가 build 또는 sync될 때 캡처한 native hash입니다.

MfeManifest.embeddedBundlePath?: string
  선택적인 local embedded JS bundle path입니다.

MfeManifest.otaBundleUrl?: string
  선택적인 OTA URL 또는 provider-specific bundle key입니다.

MfeManifest.bundleArchiveUrl?: string
  rnm bundle 또는 rnm build --archive가 만든 compressed bundle archive URL/path입니다.`,
    runtime: `MicroFrontendProvider.registry: MfeRegistry
  필수 registry snapshot입니다. 보통 rnm.registry.json에서 import하거나 Host storage에서 load합니다.

MicroFrontendProvider.sharedState?: Record<string, unknown>
  MFE hooks에 노출하는 작은 Host-owned state snapshot입니다.

MicroFrontendProvider.isMfe?: boolean
  custom renderer용 수동 override입니다. MicroFrontendComponent가 loaded MFE subtree를 자동 표시합니다.

MicroFrontendProvider.children: ReactNode
  runtime hooks를 사용할 수 있는 React subtree입니다.

useMicroFrontend(name: string): RuntimeMfeState
  registered MFE 하나의 status, manifest, reason을 반환합니다.

RuntimeMfeState.status: "ready" | "loading" | "blocked" | "missing"
  ready는 Host loader에 넘길 수 있습니다. blocked/missing은 fallback을 render해야 합니다.

useMicroFrontendSharedState<T>(): T
  Host가 제공한 sharedState snapshot을 읽습니다.

useIsMfe(): boolean
  shared component가 mounted MFE subtree 안에서 실행 중인지 알려 줍니다.

createMicroFrontendLoader(options?): ConfiguredMicroFrontendLoader
  재사용 가능한 Host loader를 만듭니다. 먼저 registry config인 ota.provider, embeddedBundlePath, otaBundleUrl, bundleArchiveUrl을 읽습니다.

loadMicroFrontendModule(manifest, options?): Promise<MicroFrontendModule>
  Host callback으로 module 하나를 resolve합니다. optional options로 provider, embeddedBundlePath, otaBundleUrl, bundleArchiveUrl을 직접 줄 수 있습니다.

MicroFrontendComponent.name: string
  Registered MFE name입니다.

MicroFrontendComponent.load: ConfiguredMicroFrontendLoader
  createMicroFrontendLoader()로 만든 Host loader 또는 호환 loader입니다.

MicroFrontendComponent.loadOptions?: MicroFrontendLoadOptions
  값을 rnm.registry.json에 저장하지 않을 때 mount별 provider/path/url/archive를 직접 지정합니다.

MicroFrontendComponent.fallback: ReactNode | ((state) => ReactNode)
  missing, blocked, loading, unavailable 상태에서 render됩니다.

MicroFrontendComponent.errorFallback?: ReactNode | ((error, state) => ReactNode)
  bundle load 실패 시 보여 줄 선택 UI입니다.`,
  },
  zh: {
    map: `host-app/react-native-micro-frontend.config.ts
  reactNative
  ota
  nativeChangePolicy
  packageManager
  package
  ios
  android
  mfes: {}              # 通常保持为空；registration 放在 rnm.registry.json

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
  android`,
    host: `reactNative.minVersion: string
  Host App 期望的最低 React Native version。

reactNative.hermes: "required" | "optional" | "disabled"
  compatible MFE 中 Hermes 是必需、可选还是禁用。

reactNative.newArchitecture: "required" | "supported" | "disabled"
  New Architecture compatibility policy。

ota.enabled: boolean
  在 Host policy level 启用或关闭 OTA delivery。

ota.provider: "hot-updater" | "none" | "custom"
  Host 选择的 OTA provider integration。

ota.mode: "auto" | "manual" | "disabled"
  publish command 是自动生成、手动 gate，还是禁用。

ota.existingHotUpdater.strategy:
  "reuse" | "wrap" | "separate" | "disable" | "manual"
  如何处理已有 Hot Updater config。

ota.existingHotUpdater.configPath?: string
  已有 hot-updater.config.ts 或 .js 的路径。

nativeChangePolicy: "ask" | "block" | "apply-and-disable-ota"
  检测到 native changes 时的处理方式。

packageManager.supported: ("bun" | "deno" | "npm" | "pnpm" | "yarn")[]
  Host/MFE workflows 中允许的 package managers。

packageManager.strategy:
  "follow-host" | "follow-mfe" | "ask-every-time" | "manual" | "follow-existing-project"
  command 选择 package manager 的方式。

packageManager.explicit?: "bun" | "deno" | "npm" | "pnpm" | "yarn"
  明确的 package manager override。

package.sync: "auto" | "manual" | "warn-only" | "disabled"
  package.json dependency synchronization 是自动、手动、仅警告还是禁用。

package.sharedStrategy:
  "strict-singleton" | "compatible-semver" | "warn-only" | "manual"
  Host 与 MFE 之间 shared dependencies 的处理方式。

ios.pods: "auto" | "manual" | "disabled" | "warn-only"
  iOS Pod integration policy。

android.integration: "auto" | "manual" | "disabled" | "warn-only"
  Android Gradle/manifest integration policy。

mfes: Record<string, MfeConfig>
  可选 static MFE config map。常规 runtime registration 应放在 rnm.registry.json。`,
    mfe: `name: string
  CLI、registry、runtime lookup 使用的稳定 MFE name。

version: string
  记录在 registry 和 publish metadata 中的 MFE version。

path?: string
  从 Host App root 到 MFE project root 的路径。

entry: string
  MFE project root 内的 entry file。必须 default-export root component。

reactNative?: { minVersion; hermes; newArchitecture }
  可选的 MFE-level native/runtime assumptions。

ota.enabled: boolean
  compatibility check 通过时，此 MFE 是否可通过 OTA publish。

ota.mode: "auto" | "manual" | "disabled"
  MFE-level OTA mode。

ota.provider?: "hot-updater" | "none" | "custom"
  可选的 MFE-level OTA provider override。

nativeChangePolicy: "ask" | "block" | "apply-and-disable-ota"
  检测到 native changes 时的 MFE-level behavior。

packageManager.strategy:
  "follow-host" | "follow-mfe" | "ask-every-time" | "manual" | "follow-existing-project"
  此 MFE 的 package-manager behavior。

packageManager.explicit?: "bun" | "deno" | "npm" | "pnpm" | "yarn"
  此 MFE 明确使用的 package manager。

package.sync?: "auto" | "manual" | "warn-only" | "disabled"
  MFE dependency synchronization policy。

package.sharedStrategy?:
  "strict-singleton" | "compatible-semver" | "warn-only" | "manual"
  此 MFE 的 shared dependency strategy。

package.dependencies?: Record<string, string>
  需要 check 或 synchronize 的 MFE dependency versions。

ios.mode?: "auto" | "manual" | "disabled" | "warn-only"
  此 MFE 的 iOS integration behavior。

ios.pods?: { name: string; path?: string; version?: string; required: boolean }[]
  此 MFE 假设存在的 native pods。

android.mode?: "auto" | "manual" | "disabled" | "warn-only"
  此 MFE 的 Android integration behavior。

android.gradleProjects?: { name: string; path?: string; required: boolean }[]
  此 MFE 假设存在的 Gradle projects。

android.permissions?: string[]
  此 MFE 假设存在的 Android permissions。`,
    registry: `schemaVersion: 1
  Registry schema version。

hostNativeHash?: string
  已安装 Host binary 的 native hash。

mfes: Record<string, MfeManifest>
  按 name keyed 的 registered MFE manifests。

MfeManifest.name: string
  Runtime lookup name。

MfeManifest.version: string
  Registered MFE version。

MfeManifest.entry: string
  Metro 与 Host resolver 使用的 MFE entry file。

MfeManifest.path: string
  从 Host App root 到 MFE project root 的路径。

MfeManifest.ota.enabled: boolean
  此 registered MFE 是否启用 OTA。

MfeManifest.ota.mode: "auto" | "manual" | "disabled"
  此 registered MFE 的 runtime/publish OTA mode。

MfeManifest.ota.provider: "hot-updater" | "none" | "custom"
  此 registered MFE 使用的 provider。

MfeManifest.nativeChangePolicy:
  "ask" | "block" | "apply-and-disable-ota"
  为此 MFE 捕获的 native-change policy。

MfeManifest.status: "active" | "blocked" | "disabled"
  Runtime status。blocked/disabled modules 不应 render。

MfeManifest.blockedReason?: string
  fallback UI 或 logs 中显示的人类可读原因。

MfeManifest.nativeHash?: string
  此 MFE build 或 sync 时捕获的 native hash。

MfeManifest.embeddedBundlePath?: string
  可选 local embedded JS bundle path。

MfeManifest.otaBundleUrl?: string
  可选 OTA URL 或 provider-specific bundle key。

MfeManifest.bundleArchiveUrl?: string
  rnm bundle 或 rnm build --archive 生成的 compressed bundle archive URL/path。`,
    runtime: `MicroFrontendProvider.registry: MfeRegistry
  必需的 registry snapshot，通常从 rnm.registry.json import，或从 Host storage load。

MicroFrontendProvider.sharedState?: Record<string, unknown>
  暴露给 MFE hooks 的小型 Host-owned state snapshot。

MicroFrontendProvider.isMfe?: boolean
  custom renderer 的手动 override。MicroFrontendComponent 会自动标记 loaded MFE subtree。

MicroFrontendProvider.children: ReactNode
  可以使用 runtime hooks 的 React subtree。

useMicroFrontend(name: string): RuntimeMfeState
  返回一个 registered MFE 的 status、manifest 和 reason。

RuntimeMfeState.status: "ready" | "loading" | "blocked" | "missing"
  ready 可以交给 Host loader。blocked/missing 应 render fallback。

useMicroFrontendSharedState<T>(): T
  读取 Host-provided sharedState snapshot。

useIsMfe(): boolean
  告诉 shared component 是否运行在 mounted MFE subtree 中。

createMicroFrontendLoader(options?): ConfiguredMicroFrontendLoader
  创建可复用的 Host loader。它会优先读取 registry config：ota.provider、embeddedBundlePath、otaBundleUrl、bundleArchiveUrl。

loadMicroFrontendModule(manifest, options?): Promise<MicroFrontendModule>
  使用 Host callback resolve 一个 module。optional options 可直接提供 provider、embeddedBundlePath、otaBundleUrl 或 bundleArchiveUrl。

MicroFrontendComponent.name: string
  Registered MFE name。

MicroFrontendComponent.load: ConfiguredMicroFrontendLoader
  由 createMicroFrontendLoader() 创建的 Host loader，或兼容 loader。

MicroFrontendComponent.loadOptions?: MicroFrontendLoadOptions
  当值不存储在 rnm.registry.json 时，为单个 mount 点直接覆盖 provider/path/url/archive。

MicroFrontendComponent.fallback: ReactNode | ((state) => ReactNode)
  missing、blocked、loading 或 unavailable 时 render。

MicroFrontendComponent.errorFallback?: ReactNode | ((error, state) => ReactNode)
  bundle load 失败时的可选 UI。`,
  },
  ja: {
    map: `host-app/react-native-micro-frontend.config.ts
  reactNative
  ota
  nativeChangePolicy
  packageManager
  package
  ios
  android
  mfes: {}              # 通常は空。registration は rnm.registry.json に置きます。

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
  android`,
    host: `reactNative.minVersion: string
  Host App が期待する最小 React Native version です。

reactNative.hermes: "required" | "optional" | "disabled"
  compatible MFE で Hermes を必須、任意、無効のどれにするか指定します。

reactNative.newArchitecture: "required" | "supported" | "disabled"
  New Architecture compatibility policy です。

ota.enabled: boolean
  Host policy level で OTA delivery を有効または無効にします。

ota.provider: "hot-updater" | "none" | "custom"
  Host が選択する OTA provider integration です。

ota.mode: "auto" | "manual" | "disabled"
  publish command を自動生成、manual gate、無効のどれにするか指定します。

ota.existingHotUpdater.strategy:
  "reuse" | "wrap" | "separate" | "disable" | "manual"
  既存 Hot Updater config の扱い方です。

ota.existingHotUpdater.configPath?: string
  既存 hot-updater.config.ts または .js の path です。

nativeChangePolicy: "ask" | "block" | "apply-and-disable-ota"
  native changes が検出された場合の処理です。

packageManager.supported: ("bun" | "deno" | "npm" | "pnpm" | "yarn")[]
  Host/MFE workflows で許可する package managers です。

packageManager.strategy:
  "follow-host" | "follow-mfe" | "ask-every-time" | "manual" | "follow-existing-project"
  command が package manager を選択する方式です。

packageManager.explicit?: "bun" | "deno" | "npm" | "pnpm" | "yarn"
  明示的な package manager override です。

package.sync: "auto" | "manual" | "warn-only" | "disabled"
  package.json dependency synchronization を自動、手動、警告のみ、無効のどれにするか指定します。

package.sharedStrategy:
  "strict-singleton" | "compatible-semver" | "warn-only" | "manual"
  Host と MFE 間の shared dependencies の扱いです。

ios.pods: "auto" | "manual" | "disabled" | "warn-only"
  iOS Pod integration policy です。

android.integration: "auto" | "manual" | "disabled" | "warn-only"
  Android Gradle/manifest integration policy です。

mfes: Record<string, MfeConfig>
  任意の static MFE config map です。通常の runtime registration は rnm.registry.json に置きます。`,
    mfe: `name: string
  CLI、registry、runtime lookup で使う安定した MFE name です。

version: string
  registry と publish metadata に記録される MFE version です。

path?: string
  Host App root から MFE project root への path です。

entry: string
  MFE project root 内の entry file です。root component を default export する必要があります。

reactNative?: { minVersion; hermes; newArchitecture }
  任意の MFE-level native/runtime assumptions です。

ota.enabled: boolean
  compatibility check が通った場合、この MFE を OTA publish できるか指定します。

ota.mode: "auto" | "manual" | "disabled"
  MFE-level OTA mode です。

ota.provider?: "hot-updater" | "none" | "custom"
  任意の MFE-level OTA provider override です。

nativeChangePolicy: "ask" | "block" | "apply-and-disable-ota"
  native changes 検出時の MFE-level behavior です。

packageManager.strategy:
  "follow-host" | "follow-mfe" | "ask-every-time" | "manual" | "follow-existing-project"
  この MFE の package-manager behavior です。

packageManager.explicit?: "bun" | "deno" | "npm" | "pnpm" | "yarn"
  この MFE で明示的に使う package manager です。

package.sync?: "auto" | "manual" | "warn-only" | "disabled"
  MFE dependency synchronization policy です。

package.sharedStrategy?:
  "strict-singleton" | "compatible-semver" | "warn-only" | "manual"
  この MFE の shared dependency strategy です。

package.dependencies?: Record<string, string>
  check または synchronize する MFE dependency versions です。

ios.mode?: "auto" | "manual" | "disabled" | "warn-only"
  この MFE の iOS integration behavior です。

ios.pods?: { name: string; path?: string; version?: string; required: boolean }[]
  この MFE が前提にする native pods です。

android.mode?: "auto" | "manual" | "disabled" | "warn-only"
  この MFE の Android integration behavior です。

android.gradleProjects?: { name: string; path?: string; required: boolean }[]
  この MFE が前提にする Gradle projects です。

android.permissions?: string[]
  この MFE が前提にする Android permissions です。`,
    registry: `schemaVersion: 1
  Registry schema version です。

hostNativeHash?: string
  install 済み Host binary の native hash です。

mfes: Record<string, MfeManifest>
  name を key にした registered MFE manifests です。

MfeManifest.name: string
  Runtime lookup name です。

MfeManifest.version: string
  Registered MFE version です。

MfeManifest.entry: string
  Metro と Host resolver が使う MFE entry file です。

MfeManifest.path: string
  Host App root から MFE project root への path です。

MfeManifest.ota.enabled: boolean
  この registered MFE の OTA 有効状態です。

MfeManifest.ota.mode: "auto" | "manual" | "disabled"
  この registered MFE の runtime/publish OTA mode です。

MfeManifest.ota.provider: "hot-updater" | "none" | "custom"
  この registered MFE が使う provider です。

MfeManifest.nativeChangePolicy:
  "ask" | "block" | "apply-and-disable-ota"
  この MFE に captured された native-change policy です。

MfeManifest.status: "active" | "blocked" | "disabled"
  Runtime status です。blocked/disabled modules は render しません。

MfeManifest.blockedReason?: string
  fallback UI または logs に表示する readable reason です。

MfeManifest.nativeHash?: string
  この MFE の build または sync 時に captured された native hash です。

MfeManifest.embeddedBundlePath?: string
  任意の local embedded JS bundle path です。

MfeManifest.otaBundleUrl?: string
  任意の OTA URL または provider-specific bundle key です。

MfeManifest.bundleArchiveUrl?: string
  rnm bundle または rnm build --archive が生成した compressed bundle archive URL/path です。`,
    runtime: `MicroFrontendProvider.registry: MfeRegistry
  必須の registry snapshot です。通常は rnm.registry.json から import、または Host storage から load します。

MicroFrontendProvider.sharedState?: Record<string, unknown>
  MFE hooks に公開する小さな Host-owned state snapshot です。

MicroFrontendProvider.isMfe?: boolean
  custom renderer 用の manual override です。MicroFrontendComponent は loaded MFE subtree を自動的に mark します。

MicroFrontendProvider.children: ReactNode
  runtime hooks を使える React subtree です。

useMicroFrontend(name: string): RuntimeMfeState
  registered MFE 1 つの status、manifest、reason を返します。

RuntimeMfeState.status: "ready" | "loading" | "blocked" | "missing"
  ready は Host loader に渡せます。blocked/missing は fallback を render します。

useMicroFrontendSharedState<T>(): T
  Host-provided sharedState snapshot を読み取ります。

useIsMfe(): boolean
  shared component が mounted MFE subtree 内で実行されているかを示します。

createMicroFrontendLoader(options?): ConfiguredMicroFrontendLoader
  再利用可能な Host loader を作ります。まず registry config の ota.provider、embeddedBundlePath、otaBundleUrl、bundleArchiveUrl を読みます。

loadMicroFrontendModule(manifest, options?): Promise<MicroFrontendModule>
  Host callback で module 1 つを resolve します。optional options で provider、embeddedBundlePath、otaBundleUrl、bundleArchiveUrl を直接指定できます。

MicroFrontendComponent.name: string
  Registered MFE name です。

MicroFrontendComponent.load: ConfiguredMicroFrontendLoader
  createMicroFrontendLoader() で作った Host loader、または互換 loader です。

MicroFrontendComponent.loadOptions?: MicroFrontendLoadOptions
  値を rnm.registry.json に保存しない場合、mount ごとに provider/path/url/archive を直接指定します。

MicroFrontendComponent.fallback: ReactNode | ((state) => ReactNode)
  missing、blocked、loading、unavailable の時に render されます。

MicroFrontendComponent.errorFallback?: ReactNode | ((error, state) => ReactNode)
  bundle load 失敗時の任意 UI です。`,
  },
} as const;

export const docsSections: readonly DocSection[] = [
  {
    eyebrow: 'Configuration',
    title: 'Declare policy once, let the CLI enforce it.',
    body: [
      'The config file describes host policy: React Native support, OTA provider, native-change policy, package-manager strategy, and native integration mode.',
      'Keep mfes empty for the normal flow. Runtime module registration belongs in rnm.registry.json, which is generated by rnm add.',
    ],
    code: `import { defineReactNativeMicroFrontendConfig } from "@bunin/react-native-micro-frontend";

export default defineReactNativeMicroFrontendConfig({
  ota: { enabled: true, provider: "hot-updater", mode: "manual" },
  nativeChangePolicy: "ask",
  packageManager: {
    supported: ["bun", "deno", "npm", "pnpm", "yarn"],
    strategy: "follow-host",
  },
  mfes: {},
});`,
  },
  {
    eyebrow: 'CLI flow',
    title: 'Initialize, register, verify, publish.',
    body: [
      'The CLI generates reviewable integration files, registers feature modules, compares native contracts, and prints Hot Updater deploy commands only after OTA safety checks pass.',
    ],
    code: `rnm init
rnm add mfe-feature --path ../mfe-feature --entry ./src/index.tsx --version 1.0.0
rnm verify mfe-feature
rnm publish mfe-feature --package-manager bun --channel production`,
  },
  {
    eyebrow: 'Runtime',
    title: 'Load feature modules through an explicit runtime policy.',
    body: [
      'The runtime reads the registry and refuses blocked modules, missing modules, and native-hash mismatches. The host owns the fallback UI and actual bundle loader.',
      'Use createMicroFrontendLoader() to bind Host transports once, then mount with MicroFrontendComponent. Pass loadOptions when a mount point needs direct provider/path/url/archive settings.',
    ],
    code: `import {
  MicroFrontendComponent,
  MicroFrontendProvider,
  createMicroFrontendLoader,
} from "@bunin/react-native-micro-frontend/runtime";

const loadMfeModule = createMicroFrontendLoader({
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
}`,
  },
  {
    eyebrow: 'Global state',
    title: 'Get host-owned global state inside an MFE.',
    body: [
      'Pass a small typed sharedState snapshot from the host into MicroFrontendProvider, then read it inside any MFE with useMicroFrontendSharedState<T>().',
      'Use useIsMfe() when shared components need to know whether they are rendering in the host shell or in a host-mounted MFE subtree.',
      'Use this for read-oriented values such as session identity, locale, feature flags, tenant, experiment bucket, or analytics context. Do not put secrets, large caches, or native-only handles in sharedState.',
      'The host remains the source of truth. When an MFE needs to change global state, call a host-owned command, event, or typed callback instead of mutating the host store directly.',
    ],
    code: `import {
  MicroFrontendProvider,
  useIsMfe,
  useMicroFrontendSharedState,
} from "@bunin/react-native-micro-frontend/runtime";

export type HostSharedState = {
  readonly session?: { readonly userId: string };
  readonly locale: "en-US" | "ko-KR" | "zh-CN" | "ja-JP";
  readonly featureFlags: Readonly<Record<string, boolean>>;
  readonly tenant?: { readonly id: string };
};

const sharedState: HostSharedState = {
  session: { userId: "user_123" },
  locale: "ko-KR",
  featureFlags: { checkoutV2: true, profileMfe: true },
  tenant: { id: "bunin" },
};

export function MountedFeatureModule({ registry }) {
  return (
    <MicroFrontendProvider registry={registry} sharedState={sharedState}>
      <FeatureModuleHeader />
    </MicroFrontendProvider>
  );
}

export function FeatureModuleHeader() {
  const isMfe = useIsMfe();
  const host = useMicroFrontendSharedState<HostSharedState>();
  const userId = host.session?.userId ?? "guest";
  const checkoutV2 = host.featureFlags.checkoutV2 ?? false;

  return <Text>{isMfe ? "MFE" : "Host"} · {host.locale} · {userId} · checkoutV2={String(checkoutV2)}</Text>;
}`,
  },
];

const globalStateSection = docsSections[3];

if (!globalStateSection) {
  throw new Error('Global state documentation section is missing.');
}

export const globalStateSections: readonly DocSection[] = [globalStateSection];

export const hotUpdaterSections: readonly DocSection[] = [
  {
    eyebrow: 'Hot Updater route',
    title:
      'Keep Hot Updater as delivery, add native-safety verification before it.',
    body: [
      'This library does not replace Hot Updater. It verifies whether a feature module is eligible for OTA, then lets Hot Updater perform the deployment.',
      'Use this page as the routed setup guide for teams that already have Hot Updater or are adding it to a host app.',
    ],
    code: `import { defineReactNativeMicroFrontendConfig } from "@bunin/react-native-micro-frontend";

export default defineReactNativeMicroFrontendConfig({
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
  mfes: {},
});`,
  },
  {
    eyebrow: 'Adapter',
    title: 'Wrap the existing Hot Updater config with MFE metadata.',
    body: [
      'The adapter keeps the Hot Updater config readable while adding registry metadata used by verification and publish commands.',
      'Generated deployment commands are printed only after the CLI confirms that OTA is safe for the selected module.',
    ],
    code: `import { withReactNativeMicroFrontend } from "@bunin/react-native-micro-frontend-hot-updater-adapter";

export default withReactNativeMicroFrontend({
  hotUpdaterConfig: {
    // Keep your existing Hot Updater options here.
  },
  mfe: {
    name: "mfe-feature",
    version: "1.0.0",
    entry: "./src/index.tsx",
  },
});`,
  },
  {
    eyebrow: 'Publish',
    title: 'Verify first, deploy second.',
    body: [
      'Use the package-manager matrix when host teams use different tools. The safety rule is identical; only the command runner changes.',
    ],
    code: `rnm verify mfe-feature
rnm publish mfe-feature --package-manager bun --channel production

# Generated command after verification
bunx hot-updater deploy -p ios -c production`,
  },
];

export const nativeContractSections: readonly DocSection[] = [
  {
    eyebrow: 'Native contract',
    title: 'A native hash captures assumptions that JavaScript cannot change.',
    body: [
      'The native contract includes React Native version, Hermes, New Architecture, relevant package native dependencies, Podfile.lock pods, Gradle dependencies, AndroidManifest permissions, and selected Info.plist inputs.',
      'When a contract changes, OTA is blocked and a native release is required.',
    ],
    code: `nativeHash = hash(
  reactNativeVersion
  + hermes
  + newArchitecture
  + nativeDependencies
  + pods
  + gradle
  + androidManifest
  + infoPlist
)`,
  },
  {
    eyebrow: 'Decision rule',
    title: 'OTA is an optimization, not an escape hatch.',
    body: [
      'JS-only changes are eligible for OTA. Native ABI changes, dependency changes, runtime flag changes, and host/module native-hash mismatches require a store release.',
    ],
    code: `React Native version changed -> store release
Hermes changed -> store release
New Architecture changed -> store release
Native dependency changed -> store release
Native hash mismatch -> store release
Module blocked -> runtime blocked`,
  },
];

export type LocalizedGuide = {
  readonly title: string;
  readonly subtitle: string;
  readonly cards: readonly Feature[];
  readonly sections: readonly DocSection[];
  readonly gettingStartedSections: readonly DocSection[];
  readonly optionsSections: readonly DocSection[];
  readonly hotUpdaterSections: readonly DocSection[];
  readonly globalStateSections: readonly DocSection[];
  readonly nativeContractSections: readonly DocSection[];
};

const localizedGuidesShared = {
  koGlobalState: {
    eyebrow: '전역 상태',
    title: 'MFE 안에서 Host 전역 상태를 가져옵니다.',
    body: [
      'Host는 작은 typed sharedState snapshot을 MicroFrontendProvider에 전달하고, MFE는 useMicroFrontendSharedState<T>()로 읽습니다.',
      '같은 component가 Host shell과 MFE subtree 양쪽에서 실행될 수 있으면 useIsMfe()로 현재 위치를 구분합니다.',
      'session identity, locale, feature flag, tenant, experiment bucket, analytics context처럼 read-oriented 값에만 사용합니다. secret, 큰 cache, native-only handle은 넣지 않습니다.',
      'source of truth는 Host에 남깁니다. Feature module은 global store를 직접 소유하지 않고 host command, event, typed callback으로 변경을 요청해야 합니다.',
    ],
    code: globalStateSections[0]?.code ?? '',
  },
  zhGlobalState: {
    eyebrow: '全局状态',
    title: '在 MFE 内读取 Host 拥有的全局状态。',
    body: [
      'Host 将小型 typed sharedState snapshot 传给 MicroFrontendProvider，MFE 再通过 useMicroFrontendSharedState<T>() 读取。',
      '当共享 component 需要判断自己运行在 Host shell 还是 MFE subtree 中时，可使用 useIsMfe()。',
      '只用于 session identity、locale、feature flags、tenant、experiment bucket、analytics context 等只读值。不要放入 secret、大型 cache 或 native-only handle。',
      'Host 仍然是 source of truth。Feature module 不应直接拥有 global store，而应通过 host command、event 或 typed callback 请求变更。',
    ],
    code: globalStateSections[0]?.code ?? '',
  },
  jaGlobalState: {
    eyebrow: 'Global state',
    title: 'MFE 内で Host-owned global state を読み取ります。',
    body: [
      'Host は小さな typed sharedState snapshot を MicroFrontendProvider に渡し、MFE は useMicroFrontendSharedState<T>() で読み取ります。',
      '共有 component が Host shell と MFE subtree のどちらで動いているかを知る必要がある場合は、useIsMfe() を使います。',
      'session identity、locale、feature flags、tenant、experiment bucket、analytics context のような read-oriented value にだけ使います。secret、大きな cache、native-only handle は入れません。',
      'source of truth は Host に残します。Feature module は global store を直接所有せず、host command、event、typed callback で変更を依頼します。',
    ],
    code: globalStateSections[0]?.code ?? '',
  },
} as const;

export const localizedGuides = {
  ko: {
    title: '처음부터 배포까지: 검증 가능한 첫 MFE 만들기',
    subtitle:
      '설치, Host 설정, MFE 등록, runtime 로딩, Host-provided shared state, Hot Updater 배포까지 같은 정보 구조로 정리한 한국어 문서입니다.',
    cards: [
      {
        title: 'Getting Started',
        body: '처음 설치부터 첫 MFE 검증과 runtime 로딩까지 따라가는 시작 가이드입니다.',
      },
      {
        title: '쉬운 사용법',
        body: 'generic, bundle, OTA 세 가지 Easy Way 메뉴를 바로 비교합니다.',
      },
      {
        title: 'Options reference',
        body: 'Host config, MFE config, registry, runtime API의 가능한 옵션을 정리합니다.',
      },
      {
        title: 'Hot Updater 설정',
        body: '기존 Hot Updater를 유지하면서 native-safety check를 앞단에 둡니다.',
      },
      {
        title: 'Metro / bundle archive',
        body: 'withMfe로 Metro 공유 dependency를 자동 구성하고 rnm bundle로 필요한 파일만 archive합니다.',
      },
      {
        title: '패키지 매니저',
        body: 'Bun, npm, pnpm, Yarn, Deno에서 같은 workflow를 실행합니다.',
      },
      {
        title: 'Native contract',
        body: '어떤 변경이 Store release를 요구하는지 판단합니다.',
      },
      {
        title: '전역 상태',
        body: 'Host sharedState를 MFE에서 타입 안전하게 읽는 방법입니다.',
      },
    ],
    gettingStartedSections: [
      {
        eyebrow: '0단계',
        title: 'Host와 MFE의 역할을 먼저 이해합니다.',
        body: [
          '두 project를 만듭니다. Host App은 설치된 native binary, navigation, fallback UI, shared state, 실제 bundle loader를 소유합니다. MFE는 기능 하나를 별도 JavaScript bundle로 배포합니다.',
          'Host policy는 react-native-micro-frontend.config.ts에 두고, runtime module registration은 rnm add가 생성하는 rnm.registry.json에 둡니다. MFE entry file은 root component 하나를 default export합니다.',
          '이 라이브러리는 native-safety와 registry layer입니다. remote JavaScript를 자동 실행하지 않으므로 Host가 Hot Updater, embedded bundle, custom loader 중 하나를 연결해야 합니다.',
        ],
        code: gettingStartedSections[0]?.code ?? '',
      },
      {
        eyebrow: '1단계',
        title: 'Runtime과 CLI를 설치합니다.',
        body: [
          'Host App에는 runtime package를 설치하고 CLI는 dev dependency로 추가합니다. Repository는 Bun 우선이지만 배포된 package는 npm, pnpm, Yarn, Deno에서도 사용할 수 있습니다.',
          'Host App에서 init을 한 번 실행하면 native file을 몰래 patch하지 않고 review 가능한 config를 생성합니다.',
        ],
        code: gettingStartedSections[1]?.code ?? '',
      },
      {
        eyebrow: '2단계',
        title: 'Module을 추가하기 전에 Host policy를 선언합니다.',
        body: [
          'Host config는 OTA, package-manager, native-change, iOS, Android policy의 source of truth입니다. 일반 흐름에서는 module 등록 정보를 rnm.registry.json에 두므로 mfes는 비워 둡니다.',
          '처음에는 manual native integration과 nativeChangePolicy ask로 보수적으로 시작하는 것이 안전합니다.',
        ],
        code: gettingStartedSections[2]?.code ?? '',
      },
      {
        eyebrow: '3단계',
        title: '첫 MFE를 등록하고 검증한 뒤 배포합니다.',
        body: [
          'Feature module은 안정적인 name, entry file, version으로 등록합니다. rnm add는 Host App의 rnm.registry.json을 만들거나 갱신합니다.',
          '검증이 통과한 뒤에만 publish합니다. native contract check가 실패하면 OTA 대신 Store release를 진행해야 합니다.',
        ],
        code: gettingStartedSections[3]?.code ?? '',
      },
      {
        eyebrow: '4단계',
        title: 'default component를 export하고 Host resolver로 로드합니다.',
        body: [
          'MFE entry file은 root React component를 반드시 default export해야 합니다. named export는 Host loader가 명시적으로 mapping할 때만 사용합니다.',
          'runtime package는 registry safety gate를 담당합니다. 실제 bundle download, evaluation, component resolution은 Hot Updater, embedded bundle, custom loader 등 Host 구현에 맡깁니다.',
        ],
        code: gettingStartedSections[4]?.code ?? '',
      },
      {
        eyebrow: '5단계',
        title: 'runtime safety gate와 Host loader로 mount합니다.',
        body: [
          'runtime은 missing module, blocked module, native hash mismatch를 확인하지만 JavaScript bundle을 직접 download하거나 evaluation하지 않습니다.',
          'createMicroFrontendLoader()와 MicroFrontendComponent를 사용합니다. loader는 registry config를 먼저 읽고, loadOptions로 mount 지점별 값을 직접 줄 수 있습니다.',
        ],
        code: gettingStartedSections[5]?.code ?? '',
      },
      {
        eyebrow: '6단계',
        title: 'withMfe로 Metro config를 merge합니다.',
        body: [
          'Host App metro.config.js에 withMfe를 추가합니다. rnm.registry.json을 읽어 active MFE root를 watchFolders에 넣고 shared package를 Host node_modules로 자동 매핑합니다.',
          '기존 mergeConfig 결과를 withMfe에 넘기면 됩니다. 기존 resolver.extraNodeModules override는 보존되고 계속 우선합니다.',
        ],
        code: gettingStartedSections[6]?.code ?? '',
      },
      {
        eyebrow: '7단계',
        title: 'Host가 필요한 파일만 bundle로 묶습니다.',
        body: [
          'Hot-Updater-like archive가 필요하면 MFE project에서 rnm bundle을 실행합니다. React Native bundling을 실행하고 index.bundle, assets, manifest.json만 압축합니다.',
          '--host로 Host project에 복사하고 --update-registry로 rnm.registry.json의 bundleArchiveUrl을 설정합니다. download, verification, unpacking, JS evaluation은 custom loader가 담당합니다.',
        ],
        code: gettingStartedSections[7]?.code ?? '',
      },
      {
        eyebrow: 'Easy Way',
        title: 'generic, bundle, OTA 세 가지 메뉴 중 하나를 고릅니다.',
        body: [
          'Generic은 일반 TypeScript module처럼 쓰는 방식입니다. OTA를 끄고 등록한 뒤 withMfe를 metro.config.js에 추가하고 Host loader에서 static import map으로 연결합니다.',
          'Bundle은 portable archive 방식입니다. MFE project에서 rnm bundle을 실행해 index.bundle, assets, manifest.json, .tar.gz만 만들고 bundleArchiveUrl을 custom loader에 연결합니다.',
          'OTA는 원격 배포 방식입니다. hot-updater 또는 custom OTA metadata로 등록하고 publish 전에 verify를 실행하며, native-safety check 통과 후 OTA engine이 배포와 evaluation을 담당합니다.',
          'isMfe prop은 따로 넘길 필요가 없습니다. MicroFrontendComponent가 loaded subtree를 자동으로 MFE context로 표시합니다.',
        ],
        code: gettingStartedSections[8]?.code ?? '',
      },
    ],
    optionsSections: [
      {
        eyebrow: '옵션 맵',
        title: '어떤 파일이 어떤 옵션을 소유하는지 먼저 확인합니다.',
        body: [
          'Host policy는 react-native-micro-frontend.config.ts에, runtime module registration은 rnm.registry.json에, MFE-local assumption은 mfe.config.ts에 둡니다.',
          '정책, 등록 정보, feature bundle 설정을 분리하면 처음 보는 사람도 값의 영향 범위를 바로 알 수 있습니다.',
        ],
        code: localizedOptionCode.ko.map,
      },
      {
        eyebrow: 'Host config',
        title: 'react-native-micro-frontend.config.ts 옵션입니다.',
        body: [
          'Host App의 OTA provider, package-manager, native-change, iOS/Android integration policy를 설명합니다.',
          '처음 도입할 때는 mfes를 비우고 rnm add가 rnm.registry.json을 만들게 하는 흐름이 가장 명확합니다.',
        ],
        code: localizedOptionCode.ko.host,
      },
      {
        eyebrow: 'MFE config',
        title: 'mfe.config.ts 옵션입니다.',
        body: [
          'feature module 하나의 이름, 버전, entry, OTA 정책, native assumption을 설명합니다.',
          'entry file은 Host loader가 module.default로 렌더링할 root component를 default export해야 합니다.',
        ],
        code: localizedOptionCode.ko.mfe,
      },
      {
        eyebrow: 'Registry',
        title: 'rnm.registry.json runtime 옵션입니다.',
        body: [
          'Host runtime이 렌더링 전에 읽는 등록 정보입니다. active, blocked, disabled 상태와 native hash를 기준으로 safety gate를 통과시킵니다.',
          'rnm add가 기본 항목을 만들고 verify, sync, publish 흐름에서 native hash와 bundle metadata가 추가될 수 있습니다.',
        ],
        code: localizedOptionCode.ko.registry,
      },
      {
        eyebrow: 'Runtime',
        title: 'Provider, hook, screen 옵션입니다.',
        body: [
          'runtime API는 safety check와 Host-provided shared state를 제공합니다. 실제 bundle transport는 Host loader가 담당합니다.',
          '실제 loading flow를 연결할 때는 manifest와 status를 얻을 수 있는 useMicroFrontend()를 사용합니다.',
        ],
        code: localizedOptionCode.ko.runtime,
      },
    ],
    sections: [
      {
        eyebrow: '개발 상태',
        title: '0.x 라인은 아직 활발히 개발 중입니다.',
        body: [
          'runtime, CLI, native-contract check, Hot Updater adapter workflow를 계속 안정화하고 있습니다.',
          '프로덕션에서는 exact package version을 고정하고 CI에서 native compatibility check를 돌리는 것을 권장합니다. 실제 package license는 채택 장벽을 낮추기 위해 MIT로 유지합니다.',
        ],
        code: `status: active development
license: MIT
beerware spirit: appreciated`,
      },
      {
        eyebrow: '설정',
        title: '정책을 한 번 선언하고 CLI가 계속 검증하게 합니다.',
        body: [
          '설정 파일은 React Native 지원 범위, OTA provider, native-change policy, package-manager strategy, native integration mode 같은 Host policy를 설명합니다.',
          '일반 흐름에서는 mfes를 비우고 rnm add가 생성하는 rnm.registry.json에 runtime module registration을 둡니다.',
        ],
        code: docsSections[0]?.code ?? '',
      },
      {
        eyebrow: 'CLI 흐름',
        title: '초기화, 등록, 검증, 배포 순서로 진행합니다.',
        body: [
          'CLI는 review 가능한 integration file을 만들고, feature module을 등록하고, native contract를 비교한 뒤 OTA safety check가 통과할 때만 Hot Updater deploy command를 출력합니다.',
        ],
        code: docsSections[1]?.code ?? '',
      },
      {
        eyebrow: 'Runtime',
        title: '명시적인 runtime policy를 통해 feature module을 로드합니다.',
        body: [
          'Runtime은 registry를 읽고 blocked module, missing module, native-hash mismatch를 거부합니다. fallback UI와 실제 bundle loader는 Host가 소유합니다.',
        ],
        code: docsSections[2]?.code ?? '',
      },
      {
        eyebrow: '전역 상태',
        title: 'MFE 안에서 Host 전역 상태를 가져옵니다.',
        body: [
          'Host는 작은 typed sharedState snapshot을 MicroFrontendProvider에 전달하고, MFE는 useMicroFrontendSharedState<T>()로 읽습니다.',
          '같은 component가 Host shell과 MFE subtree 양쪽에서 실행될 수 있으면 useIsMfe()로 현재 위치를 구분합니다.',
          'session identity, locale, feature flag, tenant, experiment bucket, analytics context처럼 read-oriented 값에만 사용합니다. secret, 큰 cache, native-only handle은 넣지 않습니다.',
          'source of truth는 Host에 남깁니다. Feature module은 global store를 직접 소유하지 않고 host command, event, typed callback으로 변경을 요청해야 합니다.',
        ],
        code: docsSections[3]?.code ?? '',
      },
      {
        eyebrow: 'Easy Way',
        title: 'generic, bundle, OTA 메뉴로 사용 방식을 나눕니다.',
        body: [
          'Generic은 local/sibling project를 일반 TS module처럼 Metro로 바로 묶는 방식입니다.',
          'Bundle은 rnm bundle로 필요한 파일만 archive하고 bundleArchiveUrl과 custom loader로 연결하는 방식입니다.',
          'OTA는 verify를 통과한 뒤 Hot Updater 또는 custom OTA pipeline으로 원격 배포하는 방식입니다.',
        ],
        code: gettingStartedSections[8]?.code ?? '',
      },
    ],
    hotUpdaterSections: [
      {
        eyebrow: 'Hot Updater route',
        title:
          'Hot Updater는 delivery로 유지하고, 앞단에 native-safety verification을 추가합니다.',
        body: [
          '이 라이브러리는 Hot Updater를 대체하지 않습니다. feature module이 OTA 가능한지 먼저 검증하고, 실제 배포는 Hot Updater가 수행하게 합니다.',
          '이미 Hot Updater를 쓰는 팀이나 Host App에 새로 추가하는 팀 모두 이 route를 설정 가이드로 사용할 수 있습니다.',
        ],
        code: hotUpdaterSections[0]?.code ?? '',
      },
      {
        eyebrow: 'Adapter',
        title: '기존 Hot Updater config를 MFE metadata와 함께 감쌉니다.',
        body: [
          'Adapter는 Hot Updater config를 읽기 쉽게 유지하면서 verification과 publish command에 필요한 registry metadata를 추가합니다.',
          'CLI가 선택된 module의 OTA 안전성을 확인한 뒤에만 deploy command를 출력합니다.',
        ],
        code: hotUpdaterSections[1]?.code ?? '',
      },
      {
        eyebrow: 'Publish',
        title: '먼저 검증하고, 그 다음 배포합니다.',
        body: [
          'Host team이 서로 다른 package manager를 사용해도 safety rule은 같습니다. 달라지는 것은 command runner뿐입니다.',
        ],
        code: hotUpdaterSections[2]?.code ?? '',
      },
    ],
    globalStateSections: [localizedGuidesShared.koGlobalState],
    nativeContractSections: [
      {
        eyebrow: 'Native contract',
        title: 'native hash는 JavaScript가 바꿀 수 없는 가정을 캡처합니다.',
        body: [
          'native contract에는 React Native version, Hermes, New Architecture, native dependency, Podfile.lock pod, Gradle dependency, AndroidManifest permission, Info.plist 입력값이 포함됩니다.',
          'contract가 바뀌면 OTA를 차단하고 native release를 요구합니다.',
        ],
        code: nativeContractSections[0]?.code ?? '',
      },
      {
        eyebrow: '판단 규칙',
        title: 'OTA는 최적화이지 native release를 우회하는 수단이 아닙니다.',
        body: [
          'JS-only 변경은 OTA 후보가 될 수 있습니다. native ABI, dependency, runtime flag, host/module native-hash mismatch는 store release가 필요합니다.',
        ],
        code: nativeContractSections[1]?.code ?? '',
      },
    ],
  },
  zh: {
    title: '从安装到发布：创建可验证的第一个 MFE',
    subtitle:
      '这里用相同的信息结构说明安装、Host 配置、MFE 注册、runtime 加载、Host-provided shared state 与 Hot Updater 发布。',
    cards: [
      {
        title: 'Getting Started',
        body: '从安装到第一个 MFE 校验与 runtime 加载的入门指南。',
      },
      {
        title: '简单用法',
        body: '直接比较 generic、bundle、OTA 三种 Easy Way 菜单。',
      },
      {
        title: 'Options reference',
        body: '整理 Host config、MFE config、registry 与 runtime API 的所有可用选项。',
      },
      {
        title: 'Hot Updater 设置',
        body: '保留现有 Hot Updater，并在前面加入 native-safety check。',
      },
      {
        title: 'Metro / bundle archive',
        body: '用 withMfe 自动配置 Metro shared dependency，并用 rnm bundle 只 archive 必要文件。',
      },
      {
        title: '包管理器',
        body: '用 Bun、npm、pnpm、Yarn、Deno 执行同一套 workflow。',
      },
      { title: 'Native contract', body: '判断哪些变更必须走 Store release。' },
      { title: '全局状态', body: '在 MFE 中类型安全地读取 Host sharedState。' },
    ],
    gettingStartedSections: [
      {
        eyebrow: '步骤 0',
        title: '先理解 Host 与 MFE 的分工。',
        body: [
          '你会搭建两个 project。Host App 拥有已安装的 native binary、navigation、fallback UI、shared state 和真实 bundle loader；MFE 以独立 JavaScript bundle 发布一个 feature。',
          'Host policy 放在 react-native-micro-frontend.config.ts。runtime module registration 放在 rnm add 生成的 rnm.registry.json。MFE entry file default-exports 一个 root component。',
          '本库是 native-safety 与 registry layer，不会自动执行 remote JavaScript；Host 仍需接入 Hot Updater、embedded bundle 或 custom loader。',
        ],
        code: gettingStartedSections[0]?.code ?? '',
      },
      {
        eyebrow: '步骤 1',
        title: '安装 runtime 和 CLI。',
        body: [
          '在 Host App 中安装 runtime package，并把 CLI 加为 dev dependency。Repository 优先使用 Bun，但发布后的 package 也可用于 npm、pnpm、Yarn 和 Deno。',
          '在 Host App 中运行一次 init。它会生成可审查的 config，而不是静默修改 native files。',
        ],
        code: gettingStartedSections[1]?.code ?? '',
      },
      {
        eyebrow: '步骤 2',
        title: '添加 module 前先声明 Host policy。',
        body: [
          'Host config 是 OTA、package-manager、native-change、iOS 和 Android policy 的 source of truth。常规流程把 module registration 放在 rnm.registry.json 中，因此 mfes 保持为空。',
          '第一版建议保持保守：manual native integration，并在 native change 发生时先询问。',
        ],
        code: gettingStartedSections[2]?.code ?? '',
      },
      {
        eyebrow: '步骤 3',
        title: '注册、校验，然后发布第一个 MFE。',
        body: [
          '用稳定的 name、entry file 和 version 注册 feature module。rnm add 会在 Host App 中创建或更新 rnm.registry.json。',
          '只有校验通过后才发布。native contract check 失败时，应走 Store release，而不是推送不安全的 OTA。',
        ],
        code: gettingStartedSections[3]?.code ?? '',
      },
      {
        eyebrow: '步骤 4',
        title: 'default export component，并通过 Host resolver 加载。',
        body: [
          'MFE entry file 必须 default-export root React component。只有 Host loader 明确实现 mapping 时才使用 named export。',
          'runtime package 负责 registry safety gate。实际 bundle download、evaluation 与 component resolution 由 Host 实现，可接入 Hot Updater、embedded bundle 或 custom loader。',
        ],
        code: gettingStartedSections[4]?.code ?? '',
      },
      {
        eyebrow: '步骤 5',
        title: '通过 runtime safety gate 和 Host loader 挂载。',
        body: [
          'runtime 会检查 missing module、blocked module 和 native hash mismatch，但不会自己 download 或 evaluation JavaScript bundle。',
          '使用 createMicroFrontendLoader() 和 MicroFrontendComponent。loader 会优先读取 registry config，也可以用 loadOptions 为某个 mount 点直接传入 metadata。',
        ],
        code: gettingStartedSections[5]?.code ?? '',
      },
      {
        eyebrow: '步骤 6',
        title: '使用 withMfe merge Metro config。',
        body: [
          '在 Host App metro.config.js 中添加 withMfe。它读取 rnm.registry.json，把 active MFE root 加入 watchFolders，并自动把 shared package 映射到 Host node_modules。',
          '把现有 mergeConfig 结果传给 withMfe 即可。已有 resolver.extraNodeModules override 会被保留并继续优先。',
        ],
        code: gettingStartedSections[6]?.code ?? '',
      },
      {
        eyebrow: '步骤 7',
        title: '只 bundle Host 需要的文件。',
        body: [
          '需要 Hot-Updater-like archive 时，在 MFE project 中运行 rnm bundle。它执行 React Native bundling，只压缩 index.bundle、assets 和 manifest.json。',
          '用 --host 复制到 Host project，用 --update-registry 设置 rnm.registry.json 的 bundleArchiveUrl。download、verification、unpacking、JS evaluation 仍由 custom loader 负责。',
        ],
        code: gettingStartedSections[7]?.code ?? '',
      },
      {
        eyebrow: 'Easy Way',
        title: '在 generic、bundle、OTA 三个菜单中选择一个。',
        body: [
          'Generic 是像普通 TypeScript module 一样使用的方式。注册时关闭 OTA，在 metro.config.js 中加入 withMfe，并在 Host loader 中用 static import map 连接。',
          'Bundle 是 portable archive 方式。在 MFE project 中运行 rnm bundle，只生成 index.bundle、assets、manifest.json 和 .tar.gz，并通过 custom loader 使用 bundleArchiveUrl。',
          'OTA 是远程发布方式。使用 hot-updater 或 custom OTA metadata 注册，publish 前运行 verify，并在 native-safety check 通过后由 OTA engine 负责分发和 evaluation。',
          '不需要传 isMfe prop。MicroFrontendComponent 会自动把 loaded subtree 标记为 MFE context。',
        ],
        code: gettingStartedSections[8]?.code ?? '',
      },
    ],
    optionsSections: [
      {
        eyebrow: '选项地图',
        title: '先确认每个文件负责哪些选项。',
        body: [
          'Host policy 放在 react-native-micro-frontend.config.ts，runtime module registration 放在 rnm.registry.json，MFE-local assumptions 放在 mfe.config.ts。',
          '把 policy、registration 和 feature bundle 设置分开，新维护者就能快速判断一个值影响哪里。',
        ],
        code: localizedOptionCode.zh.map,
      },
      {
        eyebrow: 'Host config',
        title: 'react-native-micro-frontend.config.ts 选项。',
        body: [
          '这些选项描述 Host App 的 OTA provider、package-manager、native-change、iOS/Android integration policy。',
          '首次接入时，建议保持 mfes 为空，并让 rnm add 生成 rnm.registry.json。',
        ],
        code: localizedOptionCode.zh.host,
      },
      {
        eyebrow: 'MFE config',
        title: 'mfe.config.ts 选项。',
        body: [
          '这些选项描述单个 feature module 的 name、version、entry、OTA policy 与 native assumptions。',
          'entry file 必须 default export root component，Host loader 会把它作为 module.default 渲染。',
        ],
        code: localizedOptionCode.zh.mfe,
      },
      {
        eyebrow: 'Registry',
        title: 'rnm.registry.json runtime 选项。',
        body: [
          'Host runtime 渲染前会读取这个 registry，并根据 active、blocked、disabled status 与 native hash 执行 safety gate。',
          'rnm add 创建基础项，verify、sync、publish 流程可能继续添加 native hash 与 bundle metadata。',
        ],
        code: localizedOptionCode.zh.registry,
      },
      {
        eyebrow: 'Runtime',
        title: 'Provider、hook、screen 选项。',
        body: [
          'runtime API 提供 safety check 与 Host-provided shared state。实际 bundle transport 仍由 Host loader 负责。',
          '连接真实 loading flow 时，请使用能返回 manifest 与 status 的 useMicroFrontend()。',
        ],
        code: localizedOptionCode.zh.runtime,
      },
    ],
    sections: [
      {
        eyebrow: '开发状态',
        title: '0.x 版本线仍在积极开发中。',
        body: [
          'runtime、CLI、native-contract check 和 Hot Updater adapter workflow 仍在持续加固。',
          '生产使用前请固定精确 package version，并在 CI 中运行 native compatibility check。实际 package license 保持 MIT，以降低采用和合规成本。',
        ],
        code: `status: active development
license: MIT
beerware spirit: appreciated`,
      },
      {
        eyebrow: '配置',
        title: '只声明一次策略，然后让 CLI 持续校验。',
        body: [
          '配置文件描述 React Native 支持范围、OTA provider、native-change policy、package-manager strategy 和 native integration mode 等 Host policy。',
          '常规流程保持 mfes 为空，并把 runtime module registration 放在 rnm add 生成的 rnm.registry.json 中。',
        ],
        code: docsSections[0]?.code ?? '',
      },
      {
        eyebrow: 'CLI 流程',
        title: '按初始化、注册、校验、发布的顺序执行。',
        body: [
          'CLI 生成可审查的 integration file，注册 feature module，比较 native contract，并且只在 OTA safety check 通过后输出 Hot Updater deploy command。',
        ],
        code: docsSections[1]?.code ?? '',
      },
      {
        eyebrow: 'Runtime',
        title: '通过明确的 runtime policy 加载 feature modules。',
        body: [
          'Runtime 读取 registry，并拒绝 blocked module、missing module 和 native-hash mismatch。fallback UI 和实际 bundle loader 由 Host 负责。',
        ],
        code: docsSections[2]?.code ?? '',
      },
      {
        eyebrow: '全局状态',
        title: '在 MFE 内读取 Host 拥有的全局状态。',
        body: [
          'Host 将小型 typed sharedState snapshot 传给 MicroFrontendProvider，MFE 再通过 useMicroFrontendSharedState<T>() 读取。',
          '当共享 component 需要判断自己运行在 Host shell 还是 MFE subtree 中时，可使用 useIsMfe()。',
          '只用于 session identity、locale、feature flags、tenant、experiment bucket、analytics context 等只读值。不要放入 secret、大型 cache 或 native-only handle。',
          'Host 仍然是 source of truth。Feature module 不应直接拥有 global store，而应通过 host command、event 或 typed callback 请求变更。',
        ],
        code: docsSections[3]?.code ?? '',
      },
      {
        eyebrow: 'Easy Way',
        title: '按 generic、bundle、OTA 菜单区分使用方式。',
        body: [
          'Generic 是把 local/sibling project 像普通 TS module 一样交给 Metro 直接 bundle。',
          'Bundle 是用 rnm bundle 只 archive 必要文件，并通过 bundleArchiveUrl 与 custom loader 连接。',
          'OTA 是 verify 通过后，通过 Hot Updater 或 custom OTA pipeline 远程发布。',
        ],
        code: gettingStartedSections[8]?.code ?? '',
      },
    ],
    hotUpdaterSections: [
      {
        eyebrow: 'Hot Updater route',
        title:
          '保留 Hot Updater 作为 delivery，并在前面添加 native-safety verification。',
        body: [
          '本库不替代 Hot Updater。它先验证 feature module 是否可以 OTA，然后让 Hot Updater 执行实际发布。',
          '已经使用 Hot Updater 或准备在 Host App 中新增 Hot Updater 的团队，都可以使用这个 route 作为设置指南。',
        ],
        code: hotUpdaterSections[0]?.code ?? '',
      },
      {
        eyebrow: 'Adapter',
        title: '用 MFE metadata 包装现有 Hot Updater config。',
        body: [
          'Adapter 保持 Hot Updater config 易读，同时加入 verification 和 publish command 所需的 registry metadata。',
          '只有 CLI 确认所选 module 的 OTA 安全后，才会输出 deploy command。',
        ],
        code: hotUpdaterSections[1]?.code ?? '',
      },
      {
        eyebrow: 'Publish',
        title: '先校验，再发布。',
        body: [
          '即使 Host team 使用不同的 package manager，safety rule 也相同；变化的只有 command runner。',
        ],
        code: hotUpdaterSections[2]?.code ?? '',
      },
    ],
    globalStateSections: [localizedGuidesShared.zhGlobalState],
    nativeContractSections: [
      {
        eyebrow: 'Native contract',
        title: 'native hash 捕获 JavaScript 无法改变的假设。',
        body: [
          'native contract 包含 React Native version、Hermes、New Architecture、native dependency、Podfile.lock pods、Gradle dependencies、AndroidManifest permissions 和 Info.plist 输入。',
          'contract 发生变化时，OTA 会被阻止并要求 native release。',
        ],
        code: nativeContractSections[0]?.code ?? '',
      },
      {
        eyebrow: '判断规则',
        title: 'OTA 是优化，不是绕过 native release 的后门。',
        body: [
          'JS-only 变更可以成为 OTA 候选。native ABI、dependency、runtime flag、host/module native-hash mismatch 都需要 store release。',
        ],
        code: nativeContractSections[1]?.code ?? '',
      },
    ],
  },
  ja: {
    title: '導入から公開まで: 検証可能な最初の MFE を作る',
    subtitle:
      'install、Host 設定、MFE 登録、runtime loading、Host-provided shared state、Hot Updater publish まで同じ情報構造で整理した日本語ドキュメントです。',
    cards: [
      {
        title: 'Getting Started',
        body: 'install から最初の MFE verification と runtime loading まで進める入門ガイドです。',
      },
      {
        title: '簡単な使い方',
        body: 'generic、bundle、OTA の 3 つの Easy Way メニューをすぐ比較します。',
      },
      {
        title: 'Options reference',
        body: 'Host config、MFE config、registry、runtime API の使用可能な option を整理します。',
      },
      {
        title: 'Hot Updater 設定',
        body: '既存の Hot Updater を維持し、その前段に native-safety check を置きます。',
      },
      {
        title: 'Metro / bundle archive',
        body: 'withMfe で Metro shared dependency を自動設定し、rnm bundle で必要 files だけを archive します。',
      },
      {
        title: 'Package managers',
        body: 'Bun、npm、pnpm、Yarn、Deno で同じ workflow を実行します。',
      },
      {
        title: 'Native contract',
        body: 'どの変更が Store release を必要とするか判断します。',
      },
      {
        title: 'Global state',
        body: 'MFE 内で Host sharedState を type-safe に読み取る方法です。',
      },
    ],
    gettingStartedSections: [
      {
        eyebrow: 'Step 0',
        title: 'Host と MFE の分担を先に理解します。',
        body: [
          '2 つの project を作ります。Host App は install 済み native binary、navigation、fallback UI、shared state、実際の bundle loader を所有します。MFE は 1 つの feature を独立した JavaScript bundle として配布します。',
          'Host policy は react-native-micro-frontend.config.ts に置きます。runtime module registration は rnm add が生成する rnm.registry.json に置きます。MFE entry file は root component を 1 つ default export します。',
          'この library は native-safety と registry layer です。remote JavaScript を自動実行しないため、Host が Hot Updater、embedded bundle、custom loader のいずれかを接続します。',
        ],
        code: gettingStartedSections[0]?.code ?? '',
      },
      {
        eyebrow: 'Step 1',
        title: 'runtime と CLI を install します。',
        body: [
          'Host App に runtime package を install し、CLI は dev dependency として追加します。Repository は Bun 優先ですが、公開 package は npm、pnpm、Yarn、Deno でも使えます。',
          'Host App で init を一度実行します。native file を黙って patch せず、review 可能な config を生成します。',
        ],
        code: gettingStartedSections[1]?.code ?? '',
      },
      {
        eyebrow: 'Step 2',
        title: 'module を追加する前に Host policy を宣言します。',
        body: [
          'Host config は OTA、package-manager、native-change、iOS、Android policy の source of truth です。通常の flow では module registration を rnm.registry.json に置くため、mfes は空にします。',
          '最初は manual native integration と nativeChangePolicy ask で保守的に始めるのが安全です。',
        ],
        code: gettingStartedSections[2]?.code ?? '',
      },
      {
        eyebrow: 'Step 3',
        title: '最初の MFE を register、verify、publish します。',
        body: [
          'feature module は安定した name、entry file、version で登録します。rnm add は Host App の rnm.registry.json を作成または更新します。',
          'verification が通った場合だけ publish します。native contract check が失敗した場合は OTA ではなく Store release を行います。',
        ],
        code: gettingStartedSections[3]?.code ?? '',
      },
      {
        eyebrow: 'Step 4',
        title: 'default component を export し、Host resolver で load します。',
        body: [
          'MFE entry file は root React component を必ず default export します。named export は Host loader が明示的に mapping する場合だけ使います。',
          'runtime package は registry safety gate を担当します。実際の bundle download、evaluation、component resolution は Hot Updater、embedded bundle、custom loader など Host 実装に任せます。',
        ],
        code: gettingStartedSections[4]?.code ?? '',
      },
      {
        eyebrow: 'Step 5',
        title: 'runtime safety gate と Host loader で mount します。',
        body: [
          'runtime は missing module、blocked module、native hash mismatch を確認しますが、JavaScript bundle の download や evaluation は行いません。',
          'createMicroFrontendLoader() と MicroFrontendComponent を使います。loader は registry config を先に読み、loadOptions で mount ごとの metadata も直接渡せます。',
        ],
        code: gettingStartedSections[5]?.code ?? '',
      },
      {
        eyebrow: 'Step 6',
        title: 'withMfe で Metro config を merge します。',
        body: [
          'Host App metro.config.js に withMfe を追加します。rnm.registry.json を読み、active MFE root を watchFolders に追加し、shared package を Host node_modules に自動 map します。',
          '既存の mergeConfig result を withMfe に渡します。既存の resolver.extraNodeModules override は保持され、引き続き優先されます。',
        ],
        code: gettingStartedSections[6]?.code ?? '',
      },
      {
        eyebrow: 'Step 7',
        title: 'Host が必要な files だけを bundle します。',
        body: [
          'Hot-Updater-like archive が必要な場合は MFE project で rnm bundle を実行します。React Native bundling を実行し、index.bundle、assets、manifest.json だけを圧縮します。',
          '--host で Host project へ copy し、--update-registry で rnm.registry.json の bundleArchiveUrl を設定します。download、verification、unpacking、JS evaluation は custom loader が担当します。',
        ],
        code: gettingStartedSections[7]?.code ?? '',
      },
      {
        eyebrow: 'Easy Way',
        title: 'generic、bundle、OTA の 3 つのメニューから選びます。',
        body: [
          'Generic は通常の TypeScript module のように使う方式です。OTA を無効にして登録し、metro.config.js に withMfe を追加し、Host loader で static import map に接続します。',
          'Bundle は portable archive 方式です。MFE project で rnm bundle を実行し、index.bundle、assets、manifest.json、.tar.gz だけを作成して bundleArchiveUrl を custom loader に接続します。',
          'OTA は remote delivery 方式です。hot-updater または custom OTA metadata で登録し、publish 前に verify を実行し、native-safety check 通過後は OTA engine が配布と evaluation を担当します。',
          'isMfe prop を渡す必要はありません。MicroFrontendComponent が loaded subtree を自動で MFE context として mark します。',
        ],
        code: gettingStartedSections[8]?.code ?? '',
      },
    ],
    optionsSections: [
      {
        eyebrow: 'Options map',
        title: 'どの file がどの option を所有するか確認します。',
        body: [
          'Host policy は react-native-micro-frontend.config.ts、runtime module registration は rnm.registry.json、MFE-local assumptions は mfe.config.ts に置きます。',
          'policy、registration、feature bundle settings を分離すると、初めて見る人も値の影響範囲を判断しやすくなります。',
        ],
        code: localizedOptionCode.ja.map,
      },
      {
        eyebrow: 'Host config',
        title: 'react-native-micro-frontend.config.ts options。',
        body: [
          'Host App の OTA provider、package-manager、native-change、iOS/Android integration policy を説明します。',
          '初回導入では mfes を空にし、rnm add に rnm.registry.json を生成させる flow が最も明確です。',
        ],
        code: localizedOptionCode.ja.host,
      },
      {
        eyebrow: 'MFE config',
        title: 'mfe.config.ts options。',
        body: [
          '1 つの feature module の name、version、entry、OTA policy、native assumptions を説明します。',
          'entry file は Host loader が module.default として render する root component を default export します。',
        ],
        code: localizedOptionCode.ja.mfe,
      },
      {
        eyebrow: 'Registry',
        title: 'rnm.registry.json runtime options。',
        body: [
          'Host runtime が render 前に読む registration です。active、blocked、disabled status と native hash に基づいて safety gate を通します。',
          'rnm add が基本項目を作成し、verify、sync、publish flow で native hash と bundle metadata が追加されることがあります。',
        ],
        code: localizedOptionCode.ja.registry,
      },
      {
        eyebrow: 'Runtime',
        title: 'Provider、hook、screen options。',
        body: [
          'runtime API は safety check と Host-provided shared state を提供します。実際の bundle transport は Host loader が担当します。',
          '実際の loading flow を接続する場合は、manifest と status を得られる useMicroFrontend() を使います。',
        ],
        code: localizedOptionCode.ja.runtime,
      },
    ],
    sections: [
      {
        eyebrow: '開発ステータス',
        title: '0.x line はまだ活発に開発中です。',
        body: [
          'runtime、CLI、native-contract check、Hot Updater adapter workflow を継続的に harden しています。',
          'production 前には exact package version を pin し、CI で native compatibility check を実行してください。実際の package license は採用と compliance のため MIT にします。',
        ],
        code: `status: active development
license: MIT
beerware spirit: appreciated`,
      },
      {
        eyebrow: '設定',
        title: 'policy を一度宣言し、CLI に継続的に検証させます。',
        body: [
          'config file は React Native support、OTA provider、native-change policy、package-manager strategy、native integration mode などの Host policy を説明します。',
          '通常の flow では mfes を空にし、runtime module registration は rnm add が生成する rnm.registry.json に置きます。',
        ],
        code: docsSections[0]?.code ?? '',
      },
      {
        eyebrow: 'CLI flow',
        title: 'initialize、register、verify、publish の順で進めます。',
        body: [
          'CLI は review 可能な integration file を生成し、feature module を登録し、native contract を比較し、OTA safety check が通った場合だけ Hot Updater deploy command を出力します。',
        ],
        code: docsSections[1]?.code ?? '',
      },
      {
        eyebrow: 'Runtime',
        title: '明示的な runtime policy で feature modules をロードします。',
        body: [
          'Runtime は registry を読み、blocked module、missing module、native-hash mismatch を拒否します。fallback UI と実際の bundle loader は Host が所有します。',
        ],
        code: docsSections[2]?.code ?? '',
      },
      {
        eyebrow: 'Global state',
        title: 'MFE 内で Host-owned global state を読み取ります。',
        body: [
          'Host は小さな typed sharedState snapshot を MicroFrontendProvider に渡し、MFE は useMicroFrontendSharedState<T>() で読み取ります。',
          '共有 component が Host shell と MFE subtree のどちらで動いているかを知る必要がある場合は、useIsMfe() を使います。',
          'session identity、locale、feature flags、tenant、experiment bucket、analytics context のような read-oriented value にだけ使います。secret、大きな cache、native-only handle は入れません。',
          'source of truth は Host に残します。Feature module は global store を直接所有せず、host command、event、typed callback で変更を依頼します。',
        ],
        code: docsSections[3]?.code ?? '',
      },
      {
        eyebrow: 'Easy Way',
        title: 'generic、bundle、OTA メニューで使い方を分けます。',
        body: [
          'Generic は local/sibling project を通常の TS module のように Metro で直接 bundle する方式です。',
          'Bundle は rnm bundle で必要 files だけを archive し、bundleArchiveUrl と custom loader で接続する方式です。',
          'OTA は verify 通過後に Hot Updater または custom OTA pipeline で remote delivery する方式です。',
        ],
        code: gettingStartedSections[8]?.code ?? '',
      },
    ],
    hotUpdaterSections: [
      {
        eyebrow: 'Hot Updater route',
        title:
          'Hot Updater を delivery として維持し、その前段に native-safety verification を追加します。',
        body: [
          'このライブラリは Hot Updater を置き換えません。feature module が OTA 可能か先に検証し、実際の公開は Hot Updater に任せます。',
          'すでに Hot Updater を使っている team も、Host App にこれから追加する team も、この route を setup guide として使えます。',
        ],
        code: hotUpdaterSections[0]?.code ?? '',
      },
      {
        eyebrow: 'Adapter',
        title:
          '既存の Hot Updater config を MFE metadata と一緒に wrap します。',
        body: [
          'Adapter は Hot Updater config の読みやすさを保ちながら、verification と publish command に必要な registry metadata を追加します。',
          'CLI が選択 module の OTA safety を確認した後だけ deploy command を出力します。',
        ],
        code: hotUpdaterSections[1]?.code ?? '',
      },
      {
        eyebrow: 'Publish',
        title: '先に検証し、その後で公開します。',
        body: [
          'Host team が異なる package manager を使っても safety rule は同じです。変わるのは command runner だけです。',
        ],
        code: hotUpdaterSections[2]?.code ?? '',
      },
    ],
    globalStateSections: [localizedGuidesShared.jaGlobalState],
    nativeContractSections: [
      {
        eyebrow: 'Native contract',
        title:
          'native hash は JavaScript が変更できない前提を capture します。',
        body: [
          'native contract には React Native version、Hermes、New Architecture、native dependency、Podfile.lock pods、Gradle dependencies、AndroidManifest permissions、Info.plist inputs が含まれます。',
          'contract が変わると OTA はブロックされ、native release が必要になります。',
        ],
        code: nativeContractSections[0]?.code ?? '',
      },
      {
        eyebrow: 'Decision rule',
        title:
          'OTA は optimization であり、native release の抜け道ではありません。',
        body: [
          'JS-only change は OTA の候補になります。native ABI、dependency、runtime flag、host/module native-hash mismatch は store release が必要です。',
        ],
        code: nativeContractSections[1]?.code ?? '',
      },
    ],
  },
} as const satisfies Record<string, LocalizedGuide>;
