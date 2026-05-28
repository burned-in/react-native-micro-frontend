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
  readonly table?: {
    readonly headers: readonly string[];
    readonly rows: readonly (readonly string[])[];
  };
  readonly code?: string;
  readonly cards?: readonly Feature[];
};

export const navItems: readonly NavItem[] = [
  { label: 'Overview', href: '/' },
  { label: 'Docs', href: '/docs' },
  { label: 'Getting started', href: '/docs/getting-started' },
  { label: 'Easy Way', href: '/docs/easy-way' },
  { label: 'CLI', href: '/docs/package-managers' },
  { label: 'Expo', href: '/docs/getting-started#expo-host-apps' },
  { label: 'Options', href: '/docs/options' },
  { label: 'Hot Updater', href: '/docs/hot-updater' },
  { label: 'Metro / Bundle', href: '/docs/metro-bundle-archive' },
  { label: 'Package managers', href: '/docs/package-managers' },
  { label: 'Native contract', href: '/docs/native-contract' },
  { label: 'RNM vs Re.Pack', href: '/docs/repack-comparison' },
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

export const cliCommandSections: readonly DocSection[] = [
  {
    eyebrow: 'CLI reference',
    title: 'Ask for help from any RNM command.',
    body: [
      'Every command has a friendly English help page. Use it when you need the exact options supported by the installed CLI version.',
      'The short -h alias works the same as --help, and command names are normalized so AOS/android aliases route consistently.',
    ],
    code: `rnm --help
rnm help
rnm add --help
rnm all -h`,
  },
  {
    eyebrow: 'Host integration',
    title:
      'Add package, Android, and iOS integration separately or all at once.',
    body: [
      'Use rnm package to add missing JS/native package dependencies, rnm aos or rnm android for Gradle projects/dependencies/permissions, and rnm ios for Podfile additions.',
      'Use rnm all when you want the safe default order: package -> AOS -> iOS. Expo managed projects generate rnm.expo-plugin.cjs and rnm.expo-integration.json when native folders do not exist yet.',
      'Use rnm expo when you want Expo EAS Update deployment after the same integration watcher and OTA eligibility gate.',
    ],
    code: `rnm package mfe-feature --dry-run
rnm aos mfe-feature --yes
rnm android mfe-feature --yes
rnm ios mfe-feature --yes
rnm all mfe-feature --yes
rnm expo mfe-feature --channel production --platform all

# Backward-compatible explicit route
rnm integrate all mfe-feature --yes`,
  },
  {
    eyebrow: 'Watcher behavior',
    title:
      'add, bundle, verify, and publish watch for missing integration additions.',
    body: [
      'rnm add, rnm bundle --host, rnm verify, rnm publish, and rnm expo run the package -> AOS -> iOS watcher before continuing.',
      'In an interactive terminal RNM asks whether to apply detected additions. Use --yes for automation, --dry-run to inspect direct integration commands, or --skip-integration when you intentionally want only the original command.',
    ],
    code: `rnm add mfe-feature --path ../mfe-feature
rnm bundle mfe-feature --platform ios --host ../host-app
rnm verify mfe-feature
rnm publish mfe-feature --package-manager bun --channel production
rnm expo mfe-feature --channel production --platform all

# CI / scripted modes
rnm add mfe-feature --path ../mfe-feature --yes
rnm verify mfe-feature --skip-integration`,
  },
  {
    eyebrow: 'Expo support',
    title:
      'The same RNM CLI commands support Expo managed, prebuild, and bare Hosts.',
    body: [
      'In bare/prebuilt projects, RNM writes generated Podfile and Gradle include files. In managed projects without ios/android folders, RNM writes rnm.expo-plugin.cjs and rnm.expo-integration.json.',
      'After RNM applies the additions, run Expo prebuild normally. For Expo EAS Update delivery, register the MFE with --ota-provider expo; rnm add will also show missing Host packages such as expo and expo-updates before you use rnm expo or rnm publish --provider expo.',
    ],
    code: `rnm add mfe-feature --path ../mfe-feature --yes
rnm all mfe-feature --yes
npx expo prebuild

# Expo EAS Update after RNM safety checks
rnm add mfe-feature --path ../mfe-feature --ota-provider expo --ota-mode manual --yes
rnm expo mfe-feature --channel production --platform all --non-interactive
rnm publish mfe-feature --provider expo --channel production --platform all --non-interactive`,
  },
  {
    eyebrow: 'Lifecycle',
    title:
      'Use the remaining commands for build, safety checks, status, and recovery.',
    body: [
      'rnm init creates the host files, rnm build prints bundle commands, rnm diff compares native contracts, rnm sync records native-change decisions, and rnm rollback restores .bak files.',
      'rnm status and rnm doctor are read-only checks you can run before CI or while debugging a Host App setup.',
    ],
    code: `rnm init --dry-run
rnm build mfe-feature --platform ios --archive
rnm diff mfe-feature
rnm sync mfe-feature --block-native
rnm status
rnm doctor
rnm rollback --yes`,
  },
];

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
    title: 'Inspired by Hot Updater',
    body: 'RNM began with inspiration from Hot Updater by gronxb: https://github.com/gronxb/hot-updater. Thank you, gronxb, for proving self-hostable React Native OTA can be practical and open.',
  },
  {
    title: 'Metro auto wiring',
    body: 'withMfe reads rnm.registry.json, watches registered MFE roots, and maps shared packages to the Host node_modules automatically.',
  },
  {
    title: 'Re.Pack comparison',
    body: 'RNM keeps Metro as the default bundler and adds native-contract gates, registry loading, and bundle archives; Re.Pack replaces Metro with Rspack/Webpack and Module Federation runtime delivery.',
  },
  {
    title: 'Minimal bundle archives',
    body: 'rnm bundle runs React Native bundling, collects only referenced runtime assets, and archives index.bundle, manifest.json, and the verified asset files for Host copy or CDN delivery.',
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
    title: 'Expo supported',
    body: 'Expo managed, prebuild, and bare/prebuilt Host Apps use the same package, AOS, and iOS integration watcher; managed apps receive an Expo config plugin.',
  },
  {
    title: 'Reviewable integration',
    body: 'Generated Podfile, Gradle, and Metro include files are explicit artifacts; the CLI avoids silent native patching.',
  },
];

const splitExamplesCode = `examples/
  bundle/       # .tar.gz archive; createBundleArchiveLoader reads registered RN assets
  ota/          # Hot Updater/custom OTA SDK loader after rnm verify
  expo/         # Expo managed/prebuild Host + EAS Update route
  mfe-feature/  # shared sample MFE used by Bundle and OTA examples`;

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
    eyebrow: 'Acknowledgement',
    title: 'Started from admiration for Hot Updater.',
    body: [
      'This project began with strong inspiration from Hot Updater by gronxb. Hot Updater is a remarkable self-hostable OTA project for React Native, and RNM treats it as a first-class delivery engine rather than something to replace.',
      'RNM adds native-contract checks, registry policy, and microfrontend governance around that delivery seam. Thank you, gronxb, for the work that made this direction feel possible.',
    ],
    code: `Hot Updater:
  GitHub: https://github.com/gronxb/hot-updater
  Docs:   https://hot-updater.dev

Thank you:
  gronxb: https://github.com/gronxb`,
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
    eyebrow: 'CLI commands',
    title: 'Use direct commands for package, AOS, iOS, all, and watcher flows.',
    body: [
      'The CLI exposes first-class integration commands: rnm package, rnm aos/rnm android, rnm ios, and rnm all. The all command always runs package -> AOS -> iOS.',
      'rnm add, rnm bundle --host, rnm verify, rnm publish, and rnm expo automatically watch for missing integration additions. Use --yes to apply them in automation or --skip-integration to keep the original command only.',
    ],
    code: `rnm package mfe-feature --dry-run
rnm aos mfe-feature --yes
rnm ios mfe-feature --yes
rnm all mfe-feature --yes

rnm add mfe-feature --path ../mfe-feature --yes
rnm verify mfe-feature --skip-integration`,
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
    title: 'Pick the menu you need: bundle, Hot Updater/OTA, or Expo.',
    body: [
      'Bundle creates a portable archive containing index.bundle, manifest.json, and only referenced runtime assets, then can copy it to the Host and write bundleArchiveUrl.',
      'OTA keeps Hot Updater or your custom OTA engine in charge of distribution after native-safety verification passes.',
      'Expo uses the same safety checks with EAS Update through rnm expo.',
    ],
    code: `# 1. Bundle: portable archive
# in mfe-feature/
rnm bundle mfe-feature --platform ios --host ../host-app

# 2. OTA: verified remote delivery
rnm verify mfe-feature
rnm publish mfe-feature --package-manager bun --channel production

# 3. Expo EAS Update
rnm add mfe-feature --path ../mfe-feature --entry ./src/index.tsx --version 1.0.0 --ota-provider expo --ota-mode manual
rnm expo mfe-feature --channel production --platform all --non-interactive`,
  },
  {
    eyebrow: 'Expo',
    title: 'Expo managed, prebuild, and bare Hosts are supported.',
    body: [
      'Use the Bundle path for embedded archives or the OTA path with Expo EAS Update. package integration works through package.json, AOS/iOS integration uses generated native files when ios/android folders exist, and managed projects get an Expo config plugin.',
      'The integration watcher runs during rnm add, rnm bundle --host, rnm verify, rnm publish, and rnm expo. Apply detected additions, skip them interactively, use --yes for automation, or use --skip-integration when you only want the original command.',
    ],
    code: `rnm add mfe-feature --path ../mfe-feature
rnm all mfe-feature --yes
npx expo prebuild`,
  },
  {
    eyebrow: 'Latest baseline',
    title: 'Docs are aligned to RNM 0.7.0, React Native 0.85, and Re.Pack 5.x.',
    body: [
      'As of 2026-05-28, the published RNM packages are 0.7.0, the latest react-native npm version is 0.85.3, and @callstack/repack latest is 5.2.5.',
      'RNM still supports React Native 0.70+ at the package boundary, but the examples call out that current host projects should test against their exact React Native minor and pin package versions before production use.',
      'Re.Pack 5.x is now Rspack/Webpack based with Module Federation v2; this project intentionally stays Metro-first and treats Re.Pack as an alternative architecture, not a dependency.',
    ],
    code: `checked: 2026-05-28
@bunin/react-native-micro-frontend: 0.7.0
react-native: 0.85.3
@callstack/repack: 5.2.5`,
  },
  {
    eyebrow: 'Examples',
    title: 'Examples are split into bundle, OTA, and Expo folders.',
    body: [
      'Open examples/bundle when you want rnm bundle to produce a portable archive without OTA publish. The Host imports the generated archive registration and createBundleArchiveLoader reads the copied asset without importing MFE source.',
      'Open examples/ota when you want Hot Updater or another OTA SDK to download and evaluate JavaScript after rnm verify passes.',
      'Open examples/expo when you want an Expo managed/prebuild Host example with EAS Update and Bun-loaded mfe.config.mjs / .cjs support.',
    ],
    code: splitExamplesCode,
  },
  {
    eyebrow: 'Metro and bundles',
    title: 'Use withMfe for Metro, and rnm bundle for portable artifacts.',
    body: [
      'withMfe merges your Metro config with MFE watchFolders and shared-package aliases from rnm.registry.json, so manual extraNodeModules setup is no longer the default path.',
      'When you need a Hot-Updater-like artifact, run rnm bundle in the MFE project. It packages index.bundle, manifest.json, and only referenced runtime assets, copies the archive into the Host project, and can auto-import the generated React Native archive registration.',
    ],
    code: `// host-app/metro.config.js
const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");

module.exports = (async () => {
  const { withMfe } = await import("@bunin/react-native-micro-frontend/metro");
  const defaultConfig = getDefaultConfig(__dirname);

  return withMfe(__dirname, mergeConfig(defaultConfig, {}));
})();

# in mfe-feature/
rnm bundle mfe-feature --platform ios --host ../host-app --update-registry --yes`,
  },
];

export const gettingStartedSections: readonly DocSection[] = [
  {
    eyebrow: 'Step 0',
    title: 'Understand the Host / MFE split first.',
    body: [
      'You are building two projects: a Host App that owns the installed native binary, navigation, fallback UI, shared state, and bundle loader; and an MFE that ships one feature as a separate JavaScript bundle.',
      'Host policy lives in react-native-micro-frontend.config.ts, .mjs, or .cjs. Runtime module registration lives in rnm.registry.json generated by rnm add. The MFE entry file default-exports one root component.',
      'This library is the native-safety and registry layer. Copied bundle archives can run through createBundleArchiveLoader; remote JavaScript delivery still needs Hot Updater, an embedded bundle, or a Host-owned loader.',
    ],
    code: `host-app/
  react-native-micro-frontend.config.ts / .mjs / .cjs  # Host policy
  rnm.registry.json                      # runtime MFE registry

mfe-feature/
  src/index.tsx                          # default component entry
  mfe.config.ts / .mjs / .cjs                          # MFE-local assumptions`,
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
      'react-native-micro-frontend.config.ts, .mjs, or .cjs describes host policy. Keep mfes empty for the normal flow; runtime module registration lives in rnm.registry.json generated by rnm add.',
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
      'Run rnm bundle inside the MFE project when you want a Hot-Updater-like archive. It executes React Native bundling, writes index.bundle, manifest.json, and the verified runtime asset set, then compresses only those files.',
      'Use --host to copy the archive into the Host project. The CLI generates rnm.bundle-archives.ts and asks whether to import it from the Host entry file; use --yes or --register-archives for automatic registration, and --update-registry to set bundleArchiveUrl.',
    ],
    code: `# in mfe-feature/
rnm bundle mfe-feature --platform ios --host ../host-app --update-registry

# output
# dist/rnm-bundles/mfe-feature/ios/index.bundle
# dist/rnm-bundles/mfe-feature/ios/assets/
# dist/rnm-bundles/mfe-feature/ios/manifest.json
# dist/rnm-bundles/mfe-feature/ios/mfe-feature.ios.ota.tar.gz`,
  },

  {
    eyebrow: 'Easy Way',
    title: 'Use bundle, Hot Updater/OTA, or Expo.',
    body: [
      'Bundle is the portable archive style. Run rnm bundle in the MFE project to produce index.bundle, manifest.json, verified runtime assets, and a .tar.gz; use bundleArchiveUrl with createBundleArchiveLoader and the generated archive registration.',
      'OTA is the remote delivery style. Register with hot-updater, Expo, or custom OTA metadata, run verify before publish, and let the OTA engine distribute and evaluate JavaScript only after native-safety checks pass.',
      'You do not need to pass an isMfe prop. MicroFrontendComponent automatically marks the loaded subtree as MFE context.',
    ],
    code: `# 1. Bundle: portable archive
# mfe-feature/
rnm bundle mfe-feature --platform ios --host ../host-app

const bundleLoader = createMicroFrontendLoader({
  custom: loadBundleArchive,
});

# 2. OTA: Hot Updater or custom OTA
# host-app/
rnm add mfe-feature --path ../mfe-feature --entry ./src/index.tsx --version 1.0.0 --ota-provider hot-updater --ota-mode manual
rnm verify mfe-feature
rnm publish mfe-feature --package-manager bun --channel production

# 3. Expo EAS Update route
rnm add mfe-feature --path ../mfe-feature --entry ./src/index.tsx --version 1.0.0 --ota-provider expo --ota-mode manual
rnm expo mfe-feature --channel production --platform all --non-interactive

const otaLoader = createMicroFrontendLoader({
  hotUpdater: loadWithHotUpdater,
  custom: loadWithCustomOta,
});`,
  },
];

export const easyWaySections: readonly DocSection[] = [
  {
    eyebrow: 'Menu 1',
    title: 'Bundle: create a portable archive without OTA publish.',
    body: [
      'Choose Bundle when the MFE project should produce an artifact that can be copied into the Host, attached to a release, or uploaded to your own storage.',
      'Run rnm bundle from the MFE project. The archive contains index.bundle, manifest.json, and only referenced runtime asset files.',
      'If you do not want OTA metadata, omit --update-registry. With --host, RNM still generates rnm.bundle-archives.ts; accept the prompt or pass --yes so the Host entry imports it.',
    ],
    code: `# mfe-feature/
rnm bundle mfe-feature --platform ios --host ../host-app

# Host registry for bundle without OTA
{
  "bundleArchiveUrl": ".bundle/rnm/mfe-feature.ios.ota.tar.gz",
  "ota": { "enabled": false, "mode": "disabled", "provider": "none" }
}

const loadMfeModule = createMicroFrontendLoader({
  custom: loadBundleArchive,
});`,
  },
  {
    eyebrow: 'Menu 2',
    title:
      'OTA: publish through Hot Updater, Expo EAS Update, or a custom OTA pipeline.',
    body: [
      'Choose OTA when the MFE should be delivered remotely after native-safety verification.',
      'The library verifies the native contract first. Hot Updater, Expo EAS Update, or your custom OTA engine still owns distribution, download, and JavaScript evaluation.',
      'If verification fails because native assumptions changed, ship a store release instead of pushing OTA.',
    ],
    code: `# host-app/
rnm add mfe-feature --path ../mfe-feature --entry ./src/index.tsx --version 1.0.0 --ota-provider hot-updater --ota-mode manual
rnm verify mfe-feature
rnm publish mfe-feature --package-manager bun --channel production

# Expo EAS Update instead
rnm add mfe-feature --path ../mfe-feature --entry ./src/index.tsx --version 1.0.0 --ota-provider expo --ota-mode manual
rnm expo mfe-feature --channel production --platform all --non-interactive

const loadMfeModule = createMicroFrontendLoader({
  hotUpdater: loadWithHotUpdater,
  custom: loadWithCustomOta,
});`,
  },
  {
    eyebrow: 'Menu 3',
    title: 'Expo: managed or prebuild Host Apps.',
    body: [
      'Expo Host Apps are supported for Bundle archives and OTA/EAS Update workflows. Run the same commands and let the RNM watcher handle package, AOS, and iOS additions.',
      'For Expo EAS Update delivery, use --ota-provider expo. During rnm add, the package watcher shows missing Host packages such as expo and expo-updates, then rnm expo prints the EAS Update command after safety checks pass.',
      'When ios/ or android/ already exists, RNM patches generated Podfile/Gradle include files. When those folders do not exist yet, RNM writes rnm.expo-plugin.cjs and rnm.expo-integration.json, then adds the plugin to app.json when possible.',
      'rnm add, rnm bundle --host, rnm verify, rnm publish, and rnm expo run the watcher automatically. Use --yes to apply in CI or --skip-integration to bypass it.',
    ],
    code: `# host-app/
rnm add mfe-feature --path ../mfe-feature
rnm all mfe-feature --yes

# Expo managed/prebuild
npx expo prebuild

# Expo EAS Update deployment
rnm expo mfe-feature --channel production --platform all --non-interactive`,
  },
];

export const metroBundleSections: readonly DocSection[] = [
  {
    eyebrow: 'Metro',
    title: 'Merge your existing Metro config with withMfe.',
    body: [
      'Use withMfe after getDefaultConfig/mergeConfig. It reads rnm.registry.json, adds active MFE roots to watchFolders, and maps shared dependencies to the Host node_modules automatically.',
      'Keep your existing Metro options in mergeConfig. User-defined resolver.extraNodeModules entries are preserved and take precedence over automatic shared-package aliases.',
    ],
    code: `// host-app/metro.config.js
const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");

module.exports = (async () => {
  const { withMfe } = await import("@bunin/react-native-micro-frontend/metro");
  const defaultConfig = getDefaultConfig(__dirname);

  const config = mergeConfig(defaultConfig, {
    resolver: {
      assetExts: [...defaultConfig.resolver.assetExts, "lottie"],
    },
  });

  return withMfe(__dirname, config);
})();`,
  },
  {
    eyebrow: 'Bundle archive',
    title: 'Create only the archive files the Host needs.',
    body: [
      'Run rnm bundle in the MFE project when you need a portable artifact without OTA publish. The archive contains index.bundle, manifest.json, and only referenced runtime asset files.',
      '--host copies the .tar.gz into <host>/.bundle/rnm/ and generates rnm.bundle-archives.ts. Accept the prompt, or pass --yes/--register-archives, so the Host entry imports the generated archive registration. Add --update-registry when you want bundleArchiveUrl in the Host registry.',
    ],
    code: `# in mfe-feature/
rnm bundle mfe-feature --platform ios --host ../host-app --yes
rnm bundle mfe-feature --platform android --host ../host-app --yes

# output copied to Host
# host-app/.bundle/rnm/mfe-feature.ios.ota.tar.gz
# host-app/.bundle/rnm/mfe-feature.android.ota.tar.gz`,
  },
  {
    eyebrow: 'Runtime assets',
    title: 'Bundle assets are collected automatically from require/import.',
    body: [
      'rnm bundle runs the bundle-asset step by default. It follows the MFE entry file, parses TypeScript/JavaScript with an AST, collects runtime assets referenced by require() and import, then writes them into manifest.json under assets.',
      'For OTA/archive delivery, the user device starts without MFE assets. The archive is the asset delivery unit: index.bundle, manifest.json, and referenced assets are downloaded or read together, then extracted before the JavaScript bundle is evaluated.',
      'Source files such as .ts, .tsx, .js, .d.ts, and .map are excluded. Unused files in asset folders are not copied. Metro registerAsset metadata is matched back into the manifest, and Metro-only assets are still included when they appear in the final bundle registry.',
      'Use rnm bundle-asset directly when you want to inspect the asset manifest. Use --asset-glob only for dynamic require patterns that cannot be resolved statically; use --no-bundle-assets only when you intentionally want the old asset-free path.',
    ],
    code: `// MFE source: no manual registration required
<Image source={require("./test.jpg")} />;
import logo from "./assets/logo.png";
import font from "./assets/fonts/Pretendard.ttf";
import animation from "./assets/lottie/loading.json";

# inspect asset collection directly
rnm bundle-asset mfe-feature --platform ios --entry ./src/index.tsx

# normal bundle runs the same step automatically
rnm bundle mfe-feature --platform ios --host ../host-app --yes`,
  },
  {
    eyebrow: 'Host loader',
    title: 'loadBundleArchive is the Host-owned evaluation boundary.',
    body: [
      'The runtime selects your Host loader when bundleArchiveUrl is present. createBundleArchiveLoader reads registered React Native archive assets, gunzips/untars them, extracts manifest assets into a deterministic cache, patches the asset resolver before evaluation, and returns the Metro entry module without importing MFE source.',
      'rnm init and rnm add pre-generate rnm.bundle-archives.ts and auto-import it from the Host entry. Later, rnm bundle --host regenerates the same file when the archive list changes. The generated file avoids requiring optional native file-system packages at startup; pass assetFileSystem manually only when you have a verified react-native-fs, Expo FileSystem, react-native-blob-util, or custom native module adapter.',
      'If no registered or explicit file-system adapter exists, RNM falls back to data:<mime>;base64,... URIs. Treat base64 as compatibility only; file-cache extraction is preferred for OTA, images, fonts, Lottie JSON, PDFs, and other large assets.',
      'The cache path is <cacheRoot>/rnm-assets/<mfeName>/<version>/<platform>/<bundleHash>/ and is reused only after .rnm-assets-ready.json exists. The generated registration also externalizes react-native/Libraries/Image/AssetRegistry so Metro numeric asset IDs can resolve to prepared asset URIs. For minitax-style Hosts, update/link RNM, confirm init/add imported the generated registration, and rerun rnm bundle --host --yes so the copied archive list is refreshed.',
    ],
    code: `import { createBundleArchiveLoader } from "@bunin/react-native-micro-frontend/bundle-archive";
import { createMicroFrontendLoader } from "@bunin/react-native-micro-frontend/runtime";

// Generated rnm.bundle-archives.ts is imported by the Host entry.
// It registers copied archive files and Host-owned external modules.
// Optional native file-system adapters are not required at startup.

const loadBundleArchive = createBundleArchiveLoader({
  runtime: "react-native",
});

const loadMfeModule = createMicroFrontendLoader({
  custom: loadBundleArchive,
});

<MicroFrontendComponent
  name="mfe-feature"
  load={loadMfeModule}
  loadOptions={{
    bundleArchiveUrl: ".bundle/rnm/mfe-feature.ios.ota.tar.gz",
  }}
/>`,
  },
];

export const optionsSections: readonly DocSection[] = [
  {
    eyebrow: 'Options map',
    title: 'Know which file owns each option.',
    body: [
      'Host policy options live in react-native-micro-frontend.config.ts, .mjs, .cjs, or .json. Runtime module options live in rnm.registry.json. MFE-local assumptions live in mfe.config.ts, mfe.config.mjs, or mfe.config.cjs.',
      'Keep host policy and runtime registration separate so a new maintainer can tell whether a value changes app policy, module registration, or one feature bundle.',
    ],
    code: `host-app/react-native-micro-frontend.config.ts / .mjs / .cjs / .json
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

mfe-feature/mfe.config.ts / .mjs / .cjs
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
    title: 'react-native-micro-frontend.config.ts / .mjs / .cjs options.',
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

ota.provider: "hot-updater" | "expo" | "none" | "custom"
  OTA provider integration selected by the Host.

ota.mode: "auto" | "manual" | "disabled"
  How publish commands should be produced or gated.

ota.existingHotUpdater.strategy:
  "reuse" | "wrap" | "separate" | "disable" | "manual"
  How to handle an existing Hot Updater config.

ota.existingHotUpdater.configPath?: string
  Path to an existing hot-updater.config.ts, .mjs, .cjs, or .js.

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
    title: 'mfe.config.ts / .mjs / .cjs options.',
    body: [
      'These options describe one feature module and the native assumptions it was built with. The CLI loads mfe.config.ts, mfe.config.mjs, and mfe.config.cjs through Bun when rnm bundle needs defaults.',
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

ota.provider?: "hot-updater" | "expo" | "none" | "custom"
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

MfeManifest.ota.provider: "hot-updater" | "expo" | "none" | "custom"
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
    map: `host-app/react-native-micro-frontend.config.ts / .mjs / .cjs / .json
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

mfe-feature/mfe.config.ts / .mjs / .cjs
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

ota.provider: "hot-updater" | "expo" | "none" | "custom"
  Host가 선택한 OTA provider integration입니다.

ota.mode: "auto" | "manual" | "disabled"
  publish command를 자동 생성할지, manual gate로 둘지, 비활성화할지 정합니다.

ota.existingHotUpdater.strategy:
  "reuse" | "wrap" | "separate" | "disable" | "manual"
  기존 Hot Updater config를 어떻게 처리할지 정합니다.

ota.existingHotUpdater.configPath?: string
  기존 hot-updater.config.ts, .mjs, .cjs 또는 .js 경로입니다.

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

ota.provider?: "hot-updater" | "expo" | "none" | "custom"
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

MfeManifest.ota.provider: "hot-updater" | "expo" | "none" | "custom"
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
    map: `host-app/react-native-micro-frontend.config.ts / .mjs / .cjs / .json
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

mfe-feature/mfe.config.ts / .mjs / .cjs
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

ota.provider: "hot-updater" | "expo" | "none" | "custom"
  Host 选择的 OTA provider integration。

ota.mode: "auto" | "manual" | "disabled"
  publish command 是自动生成、手动 gate，还是禁用。

ota.existingHotUpdater.strategy:
  "reuse" | "wrap" | "separate" | "disable" | "manual"
  如何处理已有 Hot Updater config。

ota.existingHotUpdater.configPath?: string
  已有 hot-updater.config.ts、.mjs、.cjs 或 .js 的路径。

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

ota.provider?: "hot-updater" | "expo" | "none" | "custom"
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

MfeManifest.ota.provider: "hot-updater" | "expo" | "none" | "custom"
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
    map: `host-app/react-native-micro-frontend.config.ts / .mjs / .cjs / .json
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

mfe-feature/mfe.config.ts / .mjs / .cjs
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

ota.provider: "hot-updater" | "expo" | "none" | "custom"
  Host が選択する OTA provider integration です。

ota.mode: "auto" | "manual" | "disabled"
  publish command を自動生成、manual gate、無効のどれにするか指定します。

ota.existingHotUpdater.strategy:
  "reuse" | "wrap" | "separate" | "disable" | "manual"
  既存 Hot Updater config の扱い方です。

ota.existingHotUpdater.configPath?: string
  既存 hot-updater.config.ts、.mjs、.cjs または .js の path です。

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

ota.provider?: "hot-updater" | "expo" | "none" | "custom"
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

MfeManifest.ota.provider: "hot-updater" | "expo" | "none" | "custom"
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
    eyebrow: 'Re.Pack comparison',
    title:
      'Use RNM when you want Metro-first native safety; use Re.Pack when you want Module Federation runtime chunks.',
    body: [
      'RNM is a registry, native-contract, Metro helper, and Host loader boundary. It does not install @callstack/repack or require Webpack/Rspack in the host app.',
      'Re.Pack is a modern React Native bundler that replaces Metro with Rspack or Webpack and provides mobile microfrontends through Module Federation v2, remote chunks, and the Re.Pack script runtime.',
      'Both can support independently delivered features, but they optimize different seams: RNM guards native binary compatibility around Metro/OTA artifacts; Re.Pack changes bundling/runtime composition to Module Federation.',
    ],
    code: `RNM: Metro + native contract + registry + Host-owned loader
Re.Pack: Rspack/Webpack + Module Federation v2 + remote chunk runtime

RNM bundle archive: index.bundle + manifest.json + referenced assets
Re.Pack remote: federated module/chunks downloaded on demand`,
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
  {
    eyebrow: 'Acknowledgement',
    title: 'Hot Updater is an inspiration and a first-class delivery engine.',
    body: [
      'RNM began with admiration for Hot Updater by gronxb. Hot Updater showed that React Native OTA can be self-hostable, practical, and open to infrastructure ownership.',
      'This project does not try to replace that work. It adds native-contract checks, registry policy, and microfrontend governance around delivery. Thank you, gronxb.',
    ],
    code: `Hot Updater:
  GitHub: https://github.com/gronxb/hot-updater
  Docs:   https://hot-updater.dev

Thank you:
  gronxb: https://github.com/gronxb`,
  },
];

const globalStateSection = docsSections[4];

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
      'RNM began with inspiration from Hot Updater by gronxb: https://github.com/gronxb/hot-updater. Thank you, gronxb, for showing a practical self-hostable path for React Native OTA.',
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

export const repackComparisonSections: readonly DocSection[] = [
  {
    eyebrow: 'Quick comparison',
    title: 'Start with a compact table; read the detailed overview below.',
    body: [
      'Use this table for the first decision pass. The following sections explain the baselines, architecture trade-offs, and operational costs in detail.',
    ],
    table: {
      headers: ['Question', 'Choose RNM when...', 'Choose Re.Pack when...'],
      rows: [
        [
          'Bundler seam',
          'You want to stay Metro-first.',
          'You want Rspack/Webpack as the app bundler.',
        ],
        [
          'Microfrontend model',
          'A registry plus Host-owned loader is enough.',
          'Module Federation v2 remotes/chunks are required.',
        ],
        [
          'OTA safety',
          'Native-contract gates must block unsafe JS delivery.',
          'The app/team owns native compatibility rules.',
        ],
        [
          'Operations',
          'You prefer fewer runtime moving parts.',
          'You accept remote chunk/cache/CDN/federation operations.',
        ],
        [
          'Best fit',
          'Native-safe OTA or archives around Metro artifacts.',
          'Runtime composition and code-splitting are core architecture.',
        ],
      ],
    },
  },
  {
    eyebrow: 'Current baseline',
    title:
      'Compare against the current Re.Pack 5.x architecture, not old Re.Pack 3 notes.',
    body: [
      'Checked on 2026-05-28: RNM is published as 0.7.0, react-native latest on npm is 0.85.3, and @callstack/repack latest on npm is 5.2.5.',
      'The Re.Pack website labels 5.x as latest and describes Re.Pack as a modern React Native build tool powered by Rspack or Webpack, with Module Federation v2 for mobile microfrontends.',
      'Because both React Native and Re.Pack release quickly, pin exact versions in application repos and rerun native-contract checks in CI before promoting an OTA or archive artifact.',
    ],
    code: `checkedAt: 2026-05-28
rnm: 0.7.0
react-native: 0.85.3
@callstack/repack: 5.2.5
repack-docs-track: 5.x latest`,
  },
  {
    eyebrow: 'Architecture',
    title:
      'RNM is Metro-first safety and delivery orchestration; Re.Pack is a bundler/runtime replacement.',
    body: [
      'RNM keeps the default React Native Metro workflow. withMfe only augments Metro with watchFolders and shared-package aliases, while rnm bundle produces portable index.bundle + manifest.json + referenced asset archives.',
      'Re.Pack replaces Metro with Rspack or Webpack. Its microfrontend story is Module Federation v2: split JavaScript or Hermes bytecode into remote chunks and download them on demand.',
      'RNM has no @callstack/repack dependency and does not execute Webpack Module Federation remotes. The Host owns the actual loader: Hot Updater, Expo EAS Update, embedded bundle, bundle archive, or custom CDN/runtime.',
    ],
    code: `Concern                RNM                         Re.Pack
Bundler                Metro + withMfe helper        Rspack or Webpack
Runtime split          Registry + Host loader        Module Federation v2
Artifact               Bundle archive / OTA URL      Remote chunks / containers
Native safety          Native contract gate          App-owned validation
Default dependency     @bunin/* packages             @callstack/repack`,
  },
  {
    eyebrow: 'Balanced critique',
    title:
      'Re.Pack is the React Native microfrontend standard-bearer, but the Webpack/Rspack layer has a cost.',
    body: [
      'Re.Pack deserves credit: it has been the practical standard for React Native microfrontends and is a remarkable engineering achievement. It brought Module Federation-style composition, remote chunk loading, and a mature bundler ecosystem into mobile React Native.',
      'The trade-off is that teams must accept an additional Rspack/Webpack layer: another build model, another runtime loading model, Module Federation shared-dependency policy, remote chunk/cache operations, and another debugging surface next to native release risk.',
      'If the product requirement is Module Federation, that power is often worth it. If the team only needs native-safe OTA gates around Metro artifacts, RNM deliberately avoids that extra architecture weight.',
    ],
    code: `Re.Pack brings:
  + Module Federation standard practice
  + remote chunks and runtime composition
  + Rspack/Webpack ecosystem power

Re.Pack also asks teams to own:
  + bundler/runtime replacement
  + shared dependency policy
  + chunk cache and CDN operations
  + native compatibility for remote code`,
  },
  {
    eyebrow: 'Decision guide',
    title: 'Choose by the seam you want to own.',
    body: [
      'Choose RNM when you want to preserve Metro, add native binary compatibility gates, keep integration files reviewable, and let the Host select Hot Updater, Expo, bundle archive, or a custom loader.',
      'Choose Re.Pack when your main requirement is Module Federation, code-splitting, tree-shaking, Webpack/Rspack plugins, or web-style remote module composition in React Native.',
      'Do not mix the two casually. Combining RNM native-contract gates with a Re.Pack runtime is possible only as a custom Host loader architecture, and the Host team must own remote chunk integrity, cache invalidation, signing, and native compatibility checks.',
    ],
    code: `Use RNM when:
  - Metro compatibility is a constraint
  - OTA must be blocked on native-contract mismatch
  - Host wants explicit registry/runtime policy

Use Re.Pack when:
  - Module Federation is required
  - Rspack/Webpack plugin ecosystem matters
  - remote chunks and dynamic imports are core architecture`,
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
  readonly easyWaySections: readonly DocSection[];
  readonly metroBundleSections: readonly DocSection[];
  readonly optionsSections: readonly DocSection[];
  readonly hotUpdaterSections: readonly DocSection[];
  readonly cliCommandSections: readonly DocSection[];
  readonly globalStateSections: readonly DocSection[];
  readonly nativeContractSections: readonly DocSection[];
  readonly repackComparisonSections: readonly DocSection[];
};

const localizedGuidesShared = {
  koRepackComparison: [
    {
      eyebrow: '빠른 비교',
      title: '먼저 간단한 표로 판단하고, 상세 개요는 아래에서 읽습니다.',
      body: [
        '첫 판단은 이 표로 시작하세요. 아래 섹션에서 기준 version, architecture trade-off, 운영 비용을 자세히 설명합니다.',
      ],
      table: {
        headers: ['질문', 'RNM을 선택할 때', 'Re.Pack을 선택할 때'],
        rows: [
          [
            'Bundler seam',
            'Metro-first를 유지하고 싶을 때.',
            'Rspack/Webpack을 app bundler로 쓰고 싶을 때.',
          ],
          [
            'Microfrontend model',
            'Registry + Host-owned loader로 충분할 때.',
            'Module Federation v2 remotes/chunks가 필요할 때.',
          ],
          [
            'OTA safety',
            'Native-contract gate로 unsafe JS delivery를 막아야 할 때.',
            'App/team이 native compatibility rule을 직접 소유할 때.',
          ],
          [
            'Operations',
            'Runtime moving parts를 줄이고 싶을 때.',
            'Remote chunk/cache/CDN/federation 운영을 받아들일 때.',
          ],
          [
            'Best fit',
            'Metro artifact 주변의 native-safe OTA/archive.',
            'Runtime composition과 code-splitting이 core architecture일 때.',
          ],
        ],
      },
    },
    {
      eyebrow: '최신 기준',
      title:
        'Re.Pack 3 시절 설명이 아니라 현재 Re.Pack 5.x 기준으로 비교합니다.',
      body: [
        '2026-05-28 기준 RNM은 0.7.0, react-native 최신 npm version은 0.85.3, @callstack/repack 최신 npm version은 5.2.5입니다.',
        'Re.Pack 5.x는 Rspack/Webpack 기반의 React Native build tool이며 Module Federation v2로 mobile microfrontend와 on-demand remote chunk를 제공합니다.',
        '두 도구 모두 release가 빠르므로 app repo에서는 exact version을 pin하고 CI에서 native-contract check를 다시 실행해야 합니다.',
      ],
      code: repackComparisonSections[1]?.code ?? '',
    },
    {
      eyebrow: '아키텍처 차이',
      title:
        'RNM은 Metro-first safety/delivery orchestration이고, Re.Pack은 bundler/runtime replacement입니다.',
      body: [
        'RNM은 기본 React Native Metro workflow를 유지합니다. withMfe는 Metro watchFolders와 shared-package alias만 보강하고, rnm bundle은 index.bundle, manifest.json, 참조된 asset archive를 만듭니다.',
        'Re.Pack은 Metro를 Rspack 또는 Webpack으로 대체합니다. microfrontend는 Module Federation v2, remote chunk, Re.Pack script runtime이 중심입니다.',
        'RNM은 @callstack/repack에 의존하지 않고 Webpack Module Federation remote를 실행하지 않습니다. 실제 loader는 Host가 Hot Updater, Expo, embedded bundle, bundle archive, custom CDN/runtime 중에서 소유합니다.',
      ],
      code: repackComparisonSections[2]?.code ?? '',
    },
    {
      eyebrow: '균형 잡힌 평가',
      title:
        'Re.Pack은 React Native microfrontend의 표준으로 자리 잡은 훌륭한 기술이지만, Webpack/Rspack 계층에는 비용이 있습니다.',
      body: [
        'Re.Pack은 분명히 인정받아야 할 기술입니다. 지금까지 React Native microfrontend 영역에서 사실상 표준으로 자리 잡아온 선택지였고, Module Federation 스타일 composition과 remote chunk loading을 mobile React Native에 가져온 대단한 engineering achievement입니다.',
        '다만 그 강력함의 대가는 Rspack/Webpack 계층을 추가로 받아들이는 것입니다. 이는 또 하나의 build model, runtime loading model, Module Federation shared-dependency policy, remote chunk/cache 운영, native release risk 옆의 추가 debugging surface를 뜻합니다.',
        'Module Federation이 제품 요구사항이라면 그 힘은 충분히 가치가 있습니다. 반대로 필요한 것이 Metro artifact에 대한 native-safe OTA gate뿐이라면 RNM은 그 architecture weight를 의도적으로 피합니다.',
      ],
      code: repackComparisonSections[3]?.code ?? '',
    },
    {
      eyebrow: '선택 기준',
      title: '팀이 소유하려는 seam에 따라 선택합니다.',
      body: [
        'Metro를 유지하면서 native binary compatibility gate, reviewable integration file, Host-owned loader policy가 필요하면 RNM을 선택합니다.',
        'Module Federation, code-splitting, tree-shaking, Webpack/Rspack plugin, web-style remote module composition이 핵심이면 Re.Pack을 선택합니다.',
        '두 방식을 섞을 수는 있지만 custom Host loader architecture가 되므로 remote chunk integrity, cache invalidation, signing, native compatibility check를 Host team이 직접 소유해야 합니다.',
      ],
      code: repackComparisonSections[4]?.code ?? '',
    },
  ],
  zhRepackComparison: [
    {
      eyebrow: '快速对比',
      title: '先用简表判断，再阅读下方详细概览。',
      body: [
        '先用这张表完成第一轮判断。下面的章节会详细说明版本基线、architecture trade-off 与运营成本。',
      ],
      table: {
        headers: ['问题', '选择 RNM 的场景', '选择 Re.Pack 的场景'],
        rows: [
          [
            'Bundler seam',
            '希望保持 Metro-first。',
            '希望用 Rspack/Webpack 作为 app bundler。',
          ],
          [
            'Microfrontend model',
            'Registry + Host-owned loader 已足够。',
            '需要 Module Federation v2 remotes/chunks。',
          ],
          [
            'OTA safety',
            '需要 native-contract gate 阻止 unsafe JS delivery。',
            'App/team 自行负责 native compatibility rules。',
          ],
          [
            'Operations',
            '希望减少 runtime moving parts。',
            '可以接受 remote chunk/cache/CDN/federation operations。',
          ],
          [
            'Best fit',
            '围绕 Metro artifact 的 native-safe OTA/archive。',
            'Runtime composition 与 code-splitting 是核心架构。',
          ],
        ],
      },
    },
    {
      eyebrow: '当前基线',
      title: '按当前 Re.Pack 5.x 架构比较，而不是旧版 Re.Pack 3 说明。',
      body: [
        '截至 2026-05-28，RNM 发布版本为 0.7.0，react-native npm 最新版本为 0.85.3，@callstack/repack npm 最新版本为 5.2.5。',
        'Re.Pack 5.x 是基于 Rspack/Webpack 的 React Native build tool，并通过 Module Federation v2 提供 mobile microfrontend 和 on-demand remote chunk。',
        '两个项目发布都很快，因此应用仓库应固定 exact version，并在 CI 中重新运行 native-contract check。',
      ],
      code: repackComparisonSections[1]?.code ?? '',
    },
    {
      eyebrow: '架构差异',
      title:
        'RNM 是 Metro-first safety/delivery orchestration；Re.Pack 是 bundler/runtime replacement。',
      body: [
        'RNM 保留默认 React Native Metro workflow。withMfe 只增强 Metro watchFolders 与 shared-package alias，rnm bundle 生成 index.bundle、manifest.json 与被引用 asset archive。',
        'Re.Pack 用 Rspack 或 Webpack 替代 Metro。其 microfrontend 方案以 Module Federation v2、remote chunks 与 Re.Pack script runtime 为核心。',
        'RNM 不依赖 @callstack/repack，也不执行 Webpack Module Federation remote。实际 loader 由 Host 在 Hot Updater、Expo、embedded bundle、bundle archive 或 custom CDN/runtime 中选择并负责。',
      ],
      code: repackComparisonSections[2]?.code ?? '',
    },
    {
      eyebrow: '平衡评价',
      title:
        'Re.Pack 是 React Native microfrontend 的标准代表，但 Webpack/Rspack 层也有成本。',
      body: [
        'Re.Pack 值得被肯定。到目前为止，它一直是 React Native microfrontend 领域接近事实标准的选择，也是把 Module Federation 风格 composition 与 remote chunk loading 带入 mobile React Native 的出色工程成果。',
        '但这种强大能力的代价，是额外接受一层 Rspack/Webpack：另一套 build model、runtime loading model、Module Federation shared-dependency policy、remote chunk/cache operations，以及 native release risk 旁边的额外 debugging surface。',
        '如果 Module Federation 是产品需求，这种能力通常值得采用。反之，如果团队只需要围绕 Metro artifact 的 native-safe OTA gate，RNM 会有意避开这部分 architecture weight。',
      ],
      code: repackComparisonSections[3]?.code ?? '',
    },
    {
      eyebrow: '选择指南',
      title: '按你想拥有的边界来选择。',
      body: [
        '如果要保留 Metro、增加 native binary compatibility gate、保持 integration files 可审查，并让 Host 选择 loader policy，请选择 RNM。',
        '如果核心需求是 Module Federation、code-splitting、tree-shaking、Webpack/Rspack plugins 或 web-style remote module composition，请选择 Re.Pack。',
        '不要随意混用。把 RNM native-contract gates 与 Re.Pack runtime 结合会变成 custom Host loader architecture，Host 团队必须自己负责 remote chunk integrity、cache invalidation、signing 与 native compatibility checks。',
      ],
      code: repackComparisonSections[4]?.code ?? '',
    },
  ],
  jaRepackComparison: [
    {
      eyebrow: 'Quick comparison',
      title: 'まず簡潔な表で判断し、詳細 overview は下で読みます。',
      body: [
        '最初の判断はこの表から始めます。下の section で version baseline、architecture trade-off、運用コストを詳しく説明します。',
      ],
      table: {
        headers: ['Question', 'RNM を選ぶ場合', 'Re.Pack を選ぶ場合'],
        rows: [
          [
            'Bundler seam',
            'Metro-first を維持したい。',
            'Rspack/Webpack を app bundler にしたい。',
          ],
          [
            'Microfrontend model',
            'Registry + Host-owned loader で十分。',
            'Module Federation v2 remotes/chunks が必要。',
          ],
          [
            'OTA safety',
            'Native-contract gate で unsafe JS delivery を止めたい。',
            'App/team が native compatibility rules を所有する。',
          ],
          [
            'Operations',
            'Runtime moving parts を減らしたい。',
            'Remote chunk/cache/CDN/federation operations を受け入れる。',
          ],
          [
            'Best fit',
            'Metro artifact 周辺の native-safe OTA/archive。',
            'Runtime composition と code-splitting が core architecture。',
          ],
        ],
      },
    },
    {
      eyebrow: '現在の基準',
      title:
        '古い Re.Pack 3 ではなく現在の Re.Pack 5.x architecture と比較します。',
      body: [
        '2026-05-28 時点で RNM は 0.7.0、react-native の npm latest は 0.85.3、@callstack/repack の npm latest は 5.2.5 です。',
        'Re.Pack 5.x は Rspack/Webpack powered な React Native build tool で、Module Federation v2 により mobile microfrontend と on-demand remote chunk を提供します。',
        'どちらも release が速いため、app repo では exact version を pin し、CI で native-contract check を再実行してください。',
      ],
      code: repackComparisonSections[1]?.code ?? '',
    },
    {
      eyebrow: 'Architecture difference',
      title:
        'RNM は Metro-first safety/delivery orchestration、Re.Pack は bundler/runtime replacement です。',
      body: [
        'RNM は標準 React Native Metro workflow を維持します。withMfe は Metro watchFolders と shared-package alias を補強し、rnm bundle は index.bundle、manifest.json、参照 asset archive を生成します。',
        'Re.Pack は Metro を Rspack または Webpack に置き換えます。microfrontend は Module Federation v2、remote chunks、Re.Pack script runtime が中心です。',
        'RNM は @callstack/repack に依存せず、Webpack Module Federation remote を実行しません。実際の loader は Host が Hot Updater、Expo、embedded bundle、bundle archive、custom CDN/runtime から選んで所有します。',
      ],
      code: repackComparisonSections[2]?.code ?? '',
    },
    {
      eyebrow: 'Balanced critique',
      title:
        'Re.Pack は React Native microfrontend の標準を担う優れた技術ですが、Webpack/Rspack layer にはコストがあります。',
      body: [
        'Re.Pack は正当に評価されるべき技術です。これまで React Native microfrontend の実質的な標準に近い選択肢であり、Module Federation style の composition と remote chunk loading を mobile React Native に持ち込んだ優れた engineering achievement です。',
        '一方で、その強力さの代償として追加の Rspack/Webpack layer を受け入れる必要があります。これはもう一つの build model、runtime loading model、Module Federation shared-dependency policy、remote chunk/cache operations、native release risk の横にある追加 debugging surface を意味します。',
        'Module Federation が product requirement なら、その力には十分な価値があります。逆に必要なのが Metro artifact に対する native-safe OTA gate だけなら、RNM はその architecture weight を意図的に避けます。',
      ],
      code: repackComparisonSections[3]?.code ?? '',
    },
    {
      eyebrow: 'Decision guide',
      title: '所有したい seam によって選びます。',
      body: [
        'Metro を維持し、native binary compatibility gate、reviewable integration file、Host-owned loader policy が必要なら RNM を選びます。',
        'Module Federation、code-splitting、tree-shaking、Webpack/Rspack plugins、web-style remote module composition が主目的なら Re.Pack を選びます。',
        '安易に混在させないでください。RNM native-contract gates と Re.Pack runtime を組み合わせる場合は custom Host loader architecture になり、remote chunk integrity、cache invalidation、signing、native compatibility checks を Host team が所有します。',
      ],
      code: repackComparisonSections[4]?.code ?? '',
    },
  ],
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
        body: 'bundle, Hot Updater/OTA, Expo Easy Way 메뉴를 바로 비교합니다.',
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
        body: 'Bun, npm, pnpm, Yarn, Deno 실행법과 RNM CLI command를 정리합니다.',
      },
      {
        title: 'Native contract',
        body: '어떤 변경이 Store release를 요구하는지 판단합니다.',
      },
      {
        title: 'Re.Pack 비교',
        body: 'RNM의 Metro-first native-safety 방식과 Re.Pack 5.x Module Federation 방식을 비교합니다.',
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
          'Host policy는 react-native-micro-frontend.config.ts, .mjs, 또는 .cjs에 두고, runtime module registration은 rnm add가 생성하는 rnm.registry.json에 둡니다. MFE entry file은 root component 하나를 default export합니다.',
          '이 라이브러리는 native-safety와 registry layer입니다. 복사된 bundle archive는 createBundleArchiveLoader로 실행할 수 있고, remote JavaScript 배포는 Hot Updater, embedded bundle, Host-owned loader 중 하나로 연결합니다.',
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
          'runtime package는 registry safety gate를 담당합니다. 복사된 archive는 createBundleArchiveLoader가 읽고, remote download/evaluation은 Hot Updater, embedded bundle, Host-owned loader 등 Host 구현에 맡깁니다.',
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
          'Hot-Updater-like archive가 필요하면 MFE project에서 rnm bundle을 실행합니다. React Native bundling을 실행하고 index.bundle, manifest.json, 검증된 runtime asset set만 압축합니다.',
          '--host로 Host project에 복사합니다. CLI는 rnm.bundle-archives.ts를 생성하고 Host entry import 여부를 묻습니다. 자동 등록하려면 --yes 또는 --register-archives를 사용하고, rnm.registry.json의 bundleArchiveUrl을 설정하려면 --update-registry를 추가합니다.',
        ],
        code: gettingStartedSections[7]?.code ?? '',
      },
      {
        eyebrow: 'Easy Way',
        title: 'bundle, Hot Updater/OTA, Expo 메뉴 중 하나를 고릅니다.',
        body: [
          'Bundle은 portable archive 방식입니다. MFE project에서 rnm bundle을 실행해 index.bundle, manifest.json, 검증된 runtime assets, .tar.gz를 만들고 bundleArchiveUrl을 createBundleArchiveLoader 및 생성된 archive registration에 연결합니다.',
          'OTA는 원격 배포 방식입니다. hot-updater 또는 custom OTA metadata로 등록하고 publish 전에 verify를 실행하며, native-safety check 통과 후 OTA engine이 배포와 evaluation을 담당합니다.',
          'isMfe prop은 따로 넘길 필요가 없습니다. MicroFrontendComponent가 loaded subtree를 자동으로 MFE context로 표시합니다.',
        ],
        code: gettingStartedSections[8]?.code ?? '',
      },
    ],
    easyWaySections: [
      {
        eyebrow: '메뉴 1',
        title: 'Bundle: OTA publish 없이 portable archive를 만듭니다.',
        body: [
          'MFE project에서 Host로 복사하거나 release artifact/storage에 올릴 archive가 필요할 때 선택합니다.',
          'MFE project에서 rnm bundle을 실행하면 index.bundle, manifest.json, 실제 참조된 runtime asset만 archive에 들어갑니다.',
          'OTA metadata를 원하지 않으면 --update-registry를 빼세요. --host를 쓰면 RNM은 그래도 rnm.bundle-archives.ts를 생성하므로 prompt를 수락하거나 --yes로 Host entry import까지 적용하세요.',
        ],
        code: easyWaySections[0]?.code ?? '',
      },
      {
        eyebrow: '메뉴 2',
        title:
          'OTA: Hot Updater, Expo EAS Update 또는 custom OTA pipeline으로 배포합니다.',
        body: [
          'native-safety verification을 통과한 MFE를 원격 배포해야 할 때 선택합니다.',
          '이 라이브러리는 native contract를 먼저 검증하고, 실제 distribution/download/evaluation은 Hot Updater, Expo EAS Update 또는 custom OTA engine이 담당합니다.',
          'native assumption이 바뀌어 검증이 실패하면 OTA 대신 Store release를 진행합니다.',
        ],
        code: easyWaySections[1]?.code ?? '',
      },
      {
        eyebrow: '메뉴 3',
        title: 'Expo: managed 또는 prebuild Host App입니다.',
        body: [
          'Expo Host App은 Bundle archive와 OTA/EAS Update workflow를 지원합니다. 같은 명령을 실행하고 RNM watcher가 package, AOS, iOS 추가 항목을 처리하게 하세요. `--ota-provider expo`로 등록하면 `rnm add`가 `expo`, `expo-updates` 같은 Host 누락 패키지도 보여줍니다.',
          'ios/ 또는 android/가 이미 있으면 generated Podfile/Gradle include 파일을 patch합니다. 아직 없으면 rnm.expo-plugin.cjs와 rnm.expo-integration.json을 만들고 가능한 경우 app.json에 plugin을 추가합니다.',
          'rnm add, rnm bundle --host, rnm verify, rnm publish, rnm expo는 watcher를 자동 실행합니다. Expo EAS Update 배포는 --ota-provider expo 등록 후 rnm expo를 사용하세요. CI에서는 --yes, 생략하려면 --skip-integration을 사용합니다.',
        ],
        code: `# host-app/
rnm add mfe-feature --path ../mfe-feature
rnm all mfe-feature --yes

# Expo managed/prebuild
npx expo prebuild`,
      },
    ],
    metroBundleSections: [
      {
        eyebrow: 'Metro',
        title: 'withMfe로 기존 Metro config를 merge합니다.',
        body: [
          'getDefaultConfig/mergeConfig 뒤에 withMfe를 적용합니다. rnm.registry.json을 읽어 active MFE root를 watchFolders에 추가하고 shared dependency를 Host node_modules로 자동 매핑합니다.',
          '기존 Metro option은 mergeConfig 안에 그대로 두세요. 직접 지정한 resolver.extraNodeModules는 자동 alias보다 우선합니다.',
        ],
        code: metroBundleSections[0]?.code ?? '',
      },
      {
        eyebrow: 'Bundle archive',
        title: 'Host가 필요한 archive 파일만 만듭니다.',
        body: [
          'OTA publish 없이 portable artifact가 필요하면 MFE project에서 rnm bundle을 실행합니다. archive에는 index.bundle, manifest.json, 실제 참조된 runtime asset만 들어갑니다.',
          '--host는 .tar.gz를 <host>/.bundle/rnm/로 복사하고 rnm.bundle-archives.ts를 생성합니다. prompt를 수락하거나 --yes/--register-archives를 주면 Host entry가 생성된 archive registration을 import합니다. Host registry에 bundleArchiveUrl을 쓰려면 --update-registry를 추가하세요.',
        ],
        code: metroBundleSections[1]?.code ?? '',
      },
      {
        eyebrow: 'Runtime assets',
        title: 'require/import asset은 bundle 시 자동 수집됩니다.',
        body: [
          'rnm bundle은 기본적으로 bundle-asset 단계를 실행합니다. MFE entry에서 TypeScript/JavaScript AST를 따라가며 require()와 import로 참조된 runtime asset만 모으고, manifest.json의 assets 필드에 기록합니다.',
          'OTA/archive delivery에서는 사용자 기기가 처음부터 MFE asset을 갖고 있지 않습니다. archive가 asset delivery unit이며 index.bundle, manifest.json, 참조된 asset을 함께 다운로드/읽은 뒤 JS bundle evaluate 전에 extract합니다.',
          '.ts, .tsx, .js, .d.ts, .map 같은 source 파일은 제외합니다. asset 폴더에 있어도 실제 참조되지 않은 파일은 복사하지 않습니다. 최종 Metro bundle에 나타난 registerAsset metadata도 manifest와 매칭하며, Metro registry에만 나타난 asset도 포함합니다.',
          '수집 결과만 확인하려면 rnm bundle-asset을 직접 실행하세요. 정적 해석이 불가능한 dynamic require에는 --asset-glob을 fallback으로 사용하고, 자동 수집을 끄려면 --no-bundle-assets를 명시합니다.',
        ],
        code: metroBundleSections[2]?.code ?? '',
      },
      {
        eyebrow: 'Host loader',
        title: 'loadBundleArchive가 Host-owned evaluation boundary입니다.',
        body: [
          'bundleArchiveUrl이 있으면 runtime은 Host loader를 선택합니다. createBundleArchiveLoader는 등록된 React Native archive asset을 읽고 gunzip/untar한 뒤, manifest asset을 deterministic cache에 extract하고 JS evaluate 전에 asset resolver를 patch해서 MFE source import 없이 Metro entry module을 반환합니다.',
          'rnm init과 rnm add는 Host에 필요한 rnm.bundle-archives.ts를 미리 생성하고 Host entry에 자동 import합니다. 이후 rnm bundle --host는 archive 목록이 바뀔 때 같은 파일을 다시 생성합니다. generated file은 앱 시작 시 optional native file-system package를 require하지 않습니다. 검증된 react-native-fs, Expo FileSystem, react-native-blob-util, custom native module adapter가 있을 때만 assetFileSystem을 직접 넘기면 됩니다.',
          '등록/명시 FS adapter가 없을 때만 RNM은 data:<mime>;base64,... URI로 fallback합니다. base64는 호환용 fallback이고, OTA/이미지/폰트/Lottie JSON/PDF/큰 asset에는 file-cache extract가 권장됩니다.',
          'cache path는 <cacheRoot>/rnm-assets/<mfeName>/<version>/<platform>/<bundleHash>/이며 .rnm-assets-ready.json marker가 있을 때만 재사용합니다. 생성된 registration은 react-native/Libraries/Image/AssetRegistry도 externalize하므로 Metro numeric asset ID가 준비된 asset URI로 resolve될 수 있습니다. minitax 같은 Host는 RNM package update/link, init/add의 generated registration 자동 import 확인, rnm bundle --host --yes 재실행만 확인하면 됩니다.',
        ],
        code: metroBundleSections[3]?.code ?? '',
      },
    ],
    cliCommandSections: [
      {
        eyebrow: 'CLI reference',
        title: '모든 RNM command에서 help를 확인합니다.',
        body: [
          '설치된 CLI version이 지원하는 정확한 option은 각 command의 help에서 확인할 수 있습니다.',
          '-h는 --help와 동일하며, AOS/android alias처럼 command name은 일관되게 route됩니다.',
        ],
        code: cliCommandSections[0]?.code ?? '',
      },
      {
        eyebrow: 'Host integration',
        title:
          'package, Android, iOS integration을 따로 또는 한 번에 추가합니다.',
        body: [
          'rnm package는 누락된 JS/native package dependency를 추가하고, rnm aos 또는 rnm android는 Gradle project/dependency/permission을, rnm ios는 Podfile addition을 처리합니다.',
          'rnm all은 안전한 기본 순서인 package -> AOS -> iOS로 실행합니다. Expo managed project에서 native folder가 아직 없으면 rnm.expo-plugin.cjs와 rnm.expo-integration.json을 생성합니다.',
        ],
        code: cliCommandSections[1]?.code ?? '',
      },
      {
        eyebrow: 'Watcher behavior',
        title: 'add, bundle, verify, publish는 누락 integration을 감시합니다.',
        body: [
          'rnm add, rnm bundle --host, rnm verify, rnm publish, rnm expo는 원래 작업을 계속하기 전에 package -> AOS -> iOS watcher를 실행합니다.',
          '대화형 terminal에서는 적용 여부를 묻습니다. 자동화에서는 --yes, 직접 integration command에서는 --dry-run, watcher를 빼려면 --skip-integration을 사용합니다.',
        ],
        code: cliCommandSections[2]?.code ?? '',
      },
      {
        eyebrow: 'Expo 지원',
        title:
          '같은 RNM CLI 명령어가 Expo managed, prebuild, bare Host를 지원합니다.',
        body: [
          'bare/prebuilt project에서는 generated Podfile/Gradle include file을 작성합니다. ios/android folder가 없는 managed project에서는 rnm.expo-plugin.cjs와 rnm.expo-integration.json을 만듭니다.',
          'RNM이 추가 항목을 적용한 뒤 Expo prebuild를 평소처럼 실행하세요. add, bundle --host, verify, publish watcher 동작은 동일합니다.',
        ],
        code: cliCommandSections[3]?.code ?? '',
      },
      {
        eyebrow: 'Lifecycle',
        title:
          '나머지 command로 build, safety check, 상태 확인, 복구를 처리합니다.',
        body: [
          'rnm init은 host file을 만들고, rnm build는 bundle command를 출력하며, rnm diff는 native contract를 비교하고, rnm sync는 native-change decision을 기록합니다.',
          'rnm status와 rnm doctor는 읽기 전용 점검 command이고, rnm rollback은 .bak file을 복구합니다.',
        ],
        code: cliCommandSections[4]?.code ?? '',
      },
    ],
    optionsSections: [
      {
        eyebrow: '옵션 맵',
        title: '어떤 파일이 어떤 옵션을 소유하는지 먼저 확인합니다.',
        body: [
          'Host policy는 react-native-micro-frontend.config.ts / .mjs / .cjs / .json에, runtime module registration은 rnm.registry.json에, MFE-local assumption은 mfe.config.ts / .mjs / .cjs에 둡니다.',
          '정책, 등록 정보, feature bundle 설정을 분리하면 처음 보는 사람도 값의 영향 범위를 바로 알 수 있습니다.',
        ],
        code: localizedOptionCode.ko.map,
      },
      {
        eyebrow: 'Host config',
        title:
          'react-native-micro-frontend.config.ts / .mjs / .cjs 옵션입니다.',
        body: [
          'Host App의 OTA provider, package-manager, native-change, iOS/Android integration policy를 설명합니다.',
          '처음 도입할 때는 mfes를 비우고 rnm add가 rnm.registry.json을 만들게 하는 흐름이 가장 명확합니다.',
        ],
        code: localizedOptionCode.ko.host,
      },
      {
        eyebrow: 'MFE config',
        title: 'mfe.config.ts / .mjs / .cjs 옵션입니다.',
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
        eyebrow: 'Acknowledgement',
        title: 'Hot Updater에 대한 존경에서 시작했습니다.',
        body: [
          '이 프로젝트는 gronxb의 Hot Updater에서 큰 영감을 받아 시작했습니다. Hot Updater는 React Native를 위한 훌륭한 self-hostable OTA project이며, RNM은 이를 대체하지 않고 first-class delivery engine으로 존중합니다.',
          'RNM은 그 delivery seam 주변에 native-contract check, registry policy, microfrontend governance를 더합니다. 이 방향이 가능하다는 것을 보여준 gronxb에게 진심으로 감사합니다.',
        ],
        code: `Hot Updater:
  GitHub: https://github.com/gronxb/hot-updater
  Docs:   https://hot-updater.dev

Thank you:
  gronxb: https://github.com/gronxb`,
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
        title: 'bundle, Hot Updater/OTA, Expo 메뉴로 사용 방식을 나눕니다.',
        body: [
          'Bundle은 rnm bundle로 필요한 파일만 archive하고 bundleArchiveUrl, rnm.bundle-archives.ts, createBundleArchiveLoader로 연결하는 방식입니다.',
          'OTA는 verify를 통과한 뒤 Hot Updater 또는 custom OTA pipeline으로 원격 배포하는 방식입니다.',
        ],
        code: gettingStartedSections[8]?.code ?? '',
      },
      {
        eyebrow: 'Expo',
        title: 'Expo managed, prebuild, bare Host App을 지원합니다.',
        body: [
          'Expo에서는 embedded archive는 Bundle 경로를, 원격 배포는 Expo EAS Update OTA 경로를 사용합니다. package는 package.json으로, AOS/iOS는 native folder 존재 여부에 따라 generated file 또는 Expo config plugin으로 통합합니다.',
          'rnm add, rnm bundle --host, rnm verify, rnm publish, rnm expo가 누락된 추가 항목을 감시합니다. 적용, 건너뛰기, --yes 자동 적용, --skip-integration 생략을 선택할 수 있습니다.',
        ],
        code: `rnm add mfe-feature --path ../mfe-feature
rnm all mfe-feature --yes
npx expo prebuild`,
      },
      {
        eyebrow: 'Examples',
        title: 'examples 폴더를 bundle, OTA, Expo로 분리했습니다.',
        body: [
          'examples/bundle은 OTA publish 없이 rnm bundle archive를 만들고 생성된 archive registration과 createBundleArchiveLoader로 실제 로드하는 예제입니다.',
          'examples/ota는 rnm verify 통과 후 Hot Updater 또는 custom OTA SDK가 download/evaluation을 담당하는 예제입니다.',
          'examples/expo는 Expo managed/prebuild Host, EAS Update, Bun 기반 mfe.config.mjs / .cjs 로딩 예제입니다.',
        ],
        code: splitExamplesCode,
      },
    ],
    hotUpdaterSections: [
      {
        eyebrow: 'Hot Updater route',
        title:
          'Hot Updater는 delivery로 유지하고, 앞단에 native-safety verification을 추가합니다.',
        body: [
          '이 라이브러리는 Hot Updater를 대체하지 않습니다. feature module이 OTA 가능한지 먼저 검증하고, 실제 배포는 Hot Updater가 수행하게 합니다.',
          'RNM은 gronxb의 Hot Updater에서 큰 영감을 받아 시작했습니다: https://github.com/gronxb/hot-updater. React Native OTA의 실용적인 self-hostable path를 보여준 gronxb에게 감사합니다.',
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
    repackComparisonSections: localizedGuidesShared.koRepackComparison,
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
        body: '直接比较 bundle、Hot Updater/OTA、Expo Easy Way 菜单。',
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
        body: '整理 Bun、npm、pnpm、Yarn、Deno 的运行方式和 RNM CLI command。',
      },
      { title: 'Native contract', body: '判断哪些变更必须走 Store release。' },
      {
        title: 'Re.Pack 对比',
        body: '比较 RNM 的 Metro-first native-safety 方式与 Re.Pack 5.x Module Federation 方式。',
      },
      { title: '全局状态', body: '在 MFE 中类型安全地读取 Host sharedState。' },
    ],
    gettingStartedSections: [
      {
        eyebrow: '步骤 0',
        title: '先理解 Host 与 MFE 的分工。',
        body: [
          '你会搭建两个 project。Host App 拥有已安装的 native binary、navigation、fallback UI、shared state 和真实 bundle loader；MFE 以独立 JavaScript bundle 发布一个 feature。',
          'Host policy 放在 react-native-micro-frontend.config.ts、.mjs 或 .cjs。runtime module registration 放在 rnm add 生成的 rnm.registry.json。MFE entry file default-exports 一个 root component。',
          '本库是 native-safety 与 registry layer。复制进 Host 的 bundle archive 可通过 createBundleArchiveLoader 运行；remote JavaScript delivery 仍需接入 Hot Updater、embedded bundle 或 Host-owned loader。',
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
          'runtime package 负责 registry safety gate。复制进 Host 的 archive 由 createBundleArchiveLoader 读取；remote download/evaluation 仍由 Host 在 Hot Updater、embedded bundle 或 Host-owned loader 中选择。',
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
          '需要 Hot-Updater-like archive 时，在 MFE project 中运行 rnm bundle。它执行 React Native bundling，只压缩 index.bundle、manifest.json 和已验证的 runtime asset set。',
          '用 --host 复制到 Host project。CLI 会生成 rnm.bundle-archives.ts，并询问是否导入到 Host entry。要自动注册请使用 --yes 或 --register-archives；要设置 rnm.registry.json 的 bundleArchiveUrl 请添加 --update-registry。',
        ],
        code: gettingStartedSections[7]?.code ?? '',
      },
      {
        eyebrow: 'Easy Way',
        title: '在 bundle、Hot Updater/OTA、Expo 菜单中选择一个。',
        body: [
          'Bundle 是 portable archive 方式。在 MFE project 中运行 rnm bundle，生成 index.bundle、manifest.json、已验证的 runtime assets 和 .tar.gz，并通过 createBundleArchiveLoader 与生成的 archive registration 使用 bundleArchiveUrl。',
          'OTA 是远程发布方式。使用 hot-updater 或 custom OTA metadata 注册，publish 前运行 verify，并在 native-safety check 通过后由 OTA engine 负责分发和 evaluation。',
          '不需要传 isMfe prop。MicroFrontendComponent 会自动把 loaded subtree 标记为 MFE context。',
        ],
        code: gettingStartedSections[8]?.code ?? '',
      },
    ],
    easyWaySections: [
      {
        eyebrow: '菜单 1',
        title: 'Bundle：不做 OTA publish，只创建 portable archive。',
        body: [
          '当 MFE project 需要生成可复制到 Host、附加到 release 或上传到自有 storage 的 artifact 时选择 Bundle。',
          '在 MFE project 中运行 rnm bundle，archive 包含 index.bundle、manifest.json 和实际引用的 runtime asset。',
          '如果不需要 OTA metadata，就不要传 --update-registry。使用 --host 时 RNM 仍会生成 rnm.bundle-archives.ts；请接受提示或传 --yes，让 Host entry 导入它。',
        ],
        code: easyWaySections[0]?.code ?? '',
      },
      {
        eyebrow: '菜单 2',
        title:
          'OTA：通过 Hot Updater、Expo EAS Update 或 custom OTA pipeline 发布。',
        body: [
          '当 MFE 通过 native-safety verification 后需要远程交付时选择 OTA。',
          '本库先验证 native contract；实际 distribution、download 和 JavaScript evaluation 仍由 Hot Updater、Expo EAS Update 或 custom OTA engine 负责。',
          '如果 verification 因 native assumptions 改变而失败，应发布 Store release，而不是继续推 OTA。',
        ],
        code: easyWaySections[1]?.code ?? '',
      },
      {
        eyebrow: '菜单 3',
        title: 'Expo：managed 或 prebuild Host App。',
        body: [
          'Expo Host App 支持 Bundle archive 和 OTA/EAS Update workflow。运行对应命令，让 RNM watcher 处理 package、AOS、iOS additions。使用 `--ota-provider expo` 注册时，`rnm add` 也会显示 Host 缺失的 `expo`、`expo-updates` 等包。',
          '如果 ios/ 或 android/ 已存在，RNM 会 patch generated Podfile/Gradle include files。还不存在时，RNM 会生成 rnm.expo-plugin.cjs 和 rnm.expo-integration.json，并在可行时加入 app.json。',
          'rnm add、rnm bundle --host、rnm verify、rnm publish、rnm expo 会自动运行 watcher。Expo EAS Update 发布请先用 --ota-provider expo 注册，然后运行 rnm expo。CI 中使用 --yes，想跳过则使用 --skip-integration。',
        ],
        code: `# host-app/
rnm add mfe-feature --path ../mfe-feature
rnm all mfe-feature --yes

# Expo managed/prebuild
npx expo prebuild`,
      },
    ],
    metroBundleSections: [
      {
        eyebrow: 'Metro',
        title: '使用 withMfe merge 现有 Metro config。',
        body: [
          '在 getDefaultConfig/mergeConfig 之后应用 withMfe。它读取 rnm.registry.json，把 active MFE root 加入 watchFolders，并自动把 shared dependency 映射到 Host node_modules。',
          '保留你现有的 Metro options。手动设置的 resolver.extraNodeModules 会被保留，并优先于自动 alias。',
        ],
        code: metroBundleSections[0]?.code ?? '',
      },
      {
        eyebrow: 'Bundle archive',
        title: '只创建 Host 需要的 archive 文件。',
        body: [
          '如果需要不做 OTA publish 的 portable artifact，请在 MFE project 中运行 rnm bundle。archive 包含 index.bundle、manifest.json 和实际引用的 runtime asset。',
          '--host 会把 .tar.gz 复制到 <host>/.bundle/rnm/ 并生成 rnm.bundle-archives.ts。接受提示，或传 --yes/--register-archives，让 Host entry 导入生成的 archive registration。需要把 bundleArchiveUrl 写入 Host registry 时添加 --update-registry。',
        ],
        code: metroBundleSections[1]?.code ?? '',
      },
      {
        eyebrow: 'Runtime assets',
        title: 'require/import asset 会在 bundle 时自动收集。',
        body: [
          'rnm bundle 默认运行 bundle-asset 阶段。它从 MFE entry 出发，用 TypeScript/JavaScript AST 追踪 require() 与 import 引用的 runtime asset，并写入 manifest.json 的 assets 字段。',
          '对于 OTA/archive delivery，用户设备最初没有 MFE asset。archive 是 asset delivery unit：index.bundle、manifest.json 和被引用的 asset 会一起下载/读取，并在 evaluate JS bundle 前 extract。',
          '.ts、.tsx、.js、.d.ts、.map 等 source 文件会被排除。即使文件位于 asset 目录，只要没有实际引用就不会复制。最终 Metro bundle 中的 registerAsset metadata 也会回填到 manifest，只有 Metro registry 中出现的 asset 也会被包含。',
          '如果只想检查收集结果，可直接运行 rnm bundle-asset。无法静态解析的 dynamic require 使用 --asset-glob 作为 fallback；如需关闭自动收集，显式传 --no-bundle-assets。',
        ],
        code: metroBundleSections[2]?.code ?? '',
      },
      {
        eyebrow: 'Host loader',
        title: 'loadBundleArchive 是 Host-owned evaluation boundary。',
        body: [
          '存在 bundleArchiveUrl 时 runtime 会选择 Host loader。createBundleArchiveLoader 会读取已注册的 React Native archive asset，gunzip/untar，把 manifest asset extract 到 deterministic cache，并在 JS evaluate 前 patch asset resolver，然后在不导入 MFE source 的情况下返回 Metro entry module。',
          'rnm init 和 rnm add 会预先生成 rnm.bundle-archives.ts 并自动从 Host entry 导入；之后 rnm bundle --host 会在 archive 列表变化时重新生成同一文件。generated file 不会在 app 启动时 require optional native file-system package。只有使用已验证的 react-native-fs、Expo FileSystem、react-native-blob-util 或 custom native module adapter 时，才需要手动传 assetFileSystem。',
          '没有 registered/explicit FS adapter 时，RNM 才 fallback 到 data:<mime>;base64,... URI。base64 只是兼容 fallback；OTA、图片、字体、Lottie JSON、PDF 和大 asset 推荐使用 file-cache extract。',
          'cache path 为 <cacheRoot>/rnm-assets/<mfeName>/<version>/<platform>/<bundleHash>/，只有 .rnm-assets-ready.json marker 存在时才复用。生成的 registration 也会 externalize react-native/Libraries/Image/AssetRegistry，因此 Metro numeric asset ID 可以 resolve 到准备好的 asset URI。minitax 类 Host 只需更新/link RNM package、确认 init/add 已自动 import generated registration，并重新运行 rnm bundle --host --yes。',
        ],
        code: metroBundleSections[3]?.code ?? '',
      },
    ],
    cliCommandSections: [
      {
        eyebrow: 'CLI reference',
        title: '可在任何 RNM command 中查看 help。',
        body: [
          '每个 command 都有英文 help 页面，可查看当前安装的 CLI version 支持的准确 options。',
          '-h 与 --help 等效，AOS/android alias 等 command name 会被一致 route。',
        ],
        code: cliCommandSections[0]?.code ?? '',
      },
      {
        eyebrow: 'Host integration',
        title: '分别或一次性添加 package、Android、iOS integration。',
        body: [
          'rnm package 添加缺失的 JS/native package dependency；rnm aos 或 rnm android 处理 Gradle project/dependency/permission；rnm ios 处理 Podfile addition。',
          '需要默认安全顺序时使用 rnm all：package -> AOS -> iOS。Expo managed project 没有 native folders 时会生成 rnm.expo-plugin.cjs 和 rnm.expo-integration.json。',
        ],
        code: cliCommandSections[1]?.code ?? '',
      },
      {
        eyebrow: 'Watcher behavior',
        title: 'add、bundle、verify、publish 会监视缺失 integration。',
        body: [
          'rnm add、rnm bundle --host、rnm verify、rnm publish、rnm expo 会在继续原本任务前运行 package -> AOS -> iOS watcher。',
          '交互式 terminal 会询问是否应用。自动化使用 --yes，直接 integration command 可用 --dry-run，想跳过 watcher 则使用 --skip-integration。',
        ],
        code: cliCommandSections[2]?.code ?? '',
      },
      {
        eyebrow: 'Expo 支持',
        title: '同一套 RNM CLI 命令支持 Expo managed、prebuild、bare Host。',
        body: [
          'bare/prebuilt project 中 RNM 会写入 generated Podfile/Gradle include files。没有 ios/android folders 的 managed project 中，RNM 会生成 rnm.expo-plugin.cjs 和 rnm.expo-integration.json。',
          'RNM 应用 additions 后照常运行 Expo prebuild。add、bundle --host、verify、publish 的 watcher 行为一致。',
        ],
        code: cliCommandSections[3]?.code ?? '',
      },
      {
        eyebrow: 'Lifecycle',
        title: '其余 command 负责 build、safety check、状态查看与恢复。',
        body: [
          'rnm init 创建 host files，rnm build 输出 bundle command，rnm diff 比较 native contracts，rnm sync 记录 native-change decision。',
          'rnm status 和 rnm doctor 是只读检查 command，rnm rollback 用于恢复 .bak files。',
        ],
        code: cliCommandSections[4]?.code ?? '',
      },
    ],
    optionsSections: [
      {
        eyebrow: '选项地图',
        title: '先确认每个文件负责哪些选项。',
        body: [
          'Host policy 放在 react-native-micro-frontend.config.ts / .mjs / .cjs / .json，runtime module registration 放在 rnm.registry.json，MFE-local assumptions 放在 mfe.config.ts / .mjs / .cjs。',
          '把 policy、registration 和 feature bundle 设置分开，新维护者就能快速判断一个值影响哪里。',
        ],
        code: localizedOptionCode.zh.map,
      },
      {
        eyebrow: 'Host config',
        title: 'react-native-micro-frontend.config.ts / .mjs / .cjs 选项。',
        body: [
          '这些选项描述 Host App 的 OTA provider、package-manager、native-change、iOS/Android integration policy。',
          '首次接入时，建议保持 mfes 为空，并让 rnm add 生成 rnm.registry.json。',
        ],
        code: localizedOptionCode.zh.host,
      },
      {
        eyebrow: 'MFE config',
        title: 'mfe.config.ts / .mjs / .cjs 选项。',
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
        eyebrow: 'Acknowledgement',
        title: '源于对 Hot Updater 的敬意。',
        body: [
          '本项目最初深受 gronxb 的 Hot Updater 启发。Hot Updater 是面向 React Native 的优秀 self-hostable OTA project；RNM 不替代它，而是把它作为 first-class delivery engine 来尊重。',
          'RNM 在这个 delivery seam 周围增加 native-contract check、registry policy 与 microfrontend governance。感谢 gronxb 让这个方向变得清晰可行。',
        ],
        code: `Hot Updater:
  GitHub: https://github.com/gronxb/hot-updater
  Docs:   https://hot-updater.dev

Thank you:
  gronxb: https://github.com/gronxb`,
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
        title: '按 bundle、Hot Updater/OTA、Expo 菜单区分使用方式。',
        body: [
          'Bundle 是用 rnm bundle 只 archive 必要文件，并通过 bundleArchiveUrl、rnm.bundle-archives.ts 与 createBundleArchiveLoader 连接。',
          'OTA 是 verify 通过后，通过 Hot Updater 或 custom OTA pipeline 远程发布。',
        ],
        code: gettingStartedSections[8]?.code ?? '',
      },
      {
        eyebrow: 'Examples',
        title: 'examples 已分成 bundle、OTA、Expo 三个目录。',
        body: [
          'examples/bundle 展示不做 OTA publish 的 rnm bundle archive，并通过生成的 archive registration 与 createBundleArchiveLoader 实际加载。',
          'examples/ota 展示 rnm verify 通过后由 Hot Updater 或 custom OTA SDK 负责 download/evaluation。',
          'examples/expo 展示 Expo managed/prebuild Host、EAS Update，以及基于 Bun 的 mfe.config.mjs / .cjs 加载。',
        ],
        code: splitExamplesCode,
      },
    ],
    hotUpdaterSections: [
      {
        eyebrow: 'Hot Updater route',
        title:
          '保留 Hot Updater 作为 delivery，并在前面添加 native-safety verification。',
        body: [
          '本库不替代 Hot Updater。它先验证 feature module 是否可以 OTA，然后让 Hot Updater 执行实际发布。',
          'RNM 最初深受 gronxb 的 Hot Updater 启发：https://github.com/gronxb/hot-updater。感谢 gronxb 展示了 React Native OTA 实用的 self-hostable path。',
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
    repackComparisonSections: localizedGuidesShared.zhRepackComparison,
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
        body: 'bundle、Hot Updater/OTA、Expo の Easy Way メニューをすぐ比較します。',
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
        body: 'Bun、npm、pnpm、Yarn、Deno の実行方法と RNM CLI command を整理します。',
      },
      {
        title: 'Native contract',
        body: 'どの変更が Store release を必要とするか判断します。',
      },
      {
        title: 'Re.Pack 比較',
        body: 'RNM の Metro-first native-safety approach と Re.Pack 5.x Module Federation approach を比較します。',
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
          'Host policy は react-native-micro-frontend.config.ts、.mjs、または .cjs に置きます。runtime module registration は rnm add が生成する rnm.registry.json に置きます。MFE entry file は root component を 1 つ default export します。',
          'この library は native-safety と registry layer です。Host に copy された bundle archive は createBundleArchiveLoader で実行できます。remote JavaScript delivery は Hot Updater、embedded bundle、Host-owned loader のいずれかに接続します。',
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
          'runtime package は registry safety gate を担当します。copy 済み archive は createBundleArchiveLoader が読み、remote download/evaluation は Hot Updater、embedded bundle、Host-owned loader など Host 実装に任せます。',
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
          'Hot-Updater-like archive が必要な場合は MFE project で rnm bundle を実行します。React Native bundling を実行し、index.bundle、manifest.json、検証済み runtime asset set だけを圧縮します。',
          '--host で Host project へ copy します。CLI は rnm.bundle-archives.ts を生成し、Host entry に import するか確認します。自動登録は --yes または --register-archives、rnm.registry.json の bundleArchiveUrl 設定は --update-registry を追加します。',
        ],
        code: gettingStartedSections[7]?.code ?? '',
      },
      {
        eyebrow: 'Easy Way',
        title: 'bundle、Hot Updater/OTA、Expo のメニューから選びます。',
        body: [
          'Bundle は portable archive 方式です。MFE project で rnm bundle を実行し、index.bundle、manifest.json、検証済み runtime assets、.tar.gz を作成して bundleArchiveUrl を createBundleArchiveLoader と生成された archive registration に接続します。',
          'OTA は remote delivery 方式です。hot-updater または custom OTA metadata で登録し、publish 前に verify を実行し、native-safety check 通過後は OTA engine が配布と evaluation を担当します。',
          'isMfe prop を渡す必要はありません。MicroFrontendComponent が loaded subtree を自動で MFE context として mark します。',
        ],
        code: gettingStartedSections[8]?.code ?? '',
      },
    ],
    easyWaySections: [
      {
        eyebrow: 'メニュー 1',
        title: 'Bundle: OTA publish なしで portable archive を作ります。',
        body: [
          'MFE project から Host に copy したり、release artifact/storage に upload する artifact が必要な場合に Bundle を選びます。',
          'MFE project で rnm bundle を実行すると、archive には index.bundle、manifest.json、実際に参照された runtime asset だけが入ります。',
          'OTA metadata が不要なら --update-registry を外します。--host を使うと RNM は rnm.bundle-archives.ts を生成するため、prompt を受け入れるか --yes で Host entry import まで適用してください。',
        ],
        code: easyWaySections[0]?.code ?? '',
      },
      {
        eyebrow: 'メニュー 2',
        title:
          'OTA: Hot Updater、Expo EAS Update または custom OTA pipeline で配布します。',
        body: [
          'native-safety verification を通過した MFE を remote delivery する必要がある場合に OTA を選びます。',
          'この library は native contract を先に検証します。実際の distribution、download、JavaScript evaluation は Hot Updater、Expo EAS Update または custom OTA engine が担当します。',
          'native assumptions が変わって verification が失敗した場合は、OTA ではなく Store release を行います。',
        ],
        code: easyWaySections[1]?.code ?? '',
      },
      {
        eyebrow: 'メニュー 3',
        title: 'Expo: managed または prebuild Host App です。',
        body: [
          'Expo Host App は Bundle archive と OTA/EAS Update workflow をサポートします。対応する command を実行し、RNM watcher に package、AOS、iOS additions を処理させます。`--ota-provider expo` で登録すると、`rnm add` は `expo`、`expo-updates` など Host に不足している package も表示します。',
          'ios/ または android/ が既にある場合は generated Podfile/Gradle include files を patch します。まだ無い場合は rnm.expo-plugin.cjs と rnm.expo-integration.json を生成し、可能なら app.json に plugin を追加します。',
          'rnm add、rnm bundle --host、rnm verify、rnm publish、rnm expo は watcher を自動実行します。Expo EAS Update 配信は --ota-provider expo で登録し、rnm expo を使います。CI では --yes、スキップする場合は --skip-integration を使います。',
        ],
        code: `# host-app/
rnm add mfe-feature --path ../mfe-feature
rnm all mfe-feature --yes

# Expo managed/prebuild
npx expo prebuild`,
      },
    ],
    metroBundleSections: [
      {
        eyebrow: 'Metro',
        title: 'withMfe で既存の Metro config を merge します。',
        body: [
          'getDefaultConfig/mergeConfig の後に withMfe を適用します。rnm.registry.json を読み、active MFE root を watchFolders に追加し、shared dependency を Host node_modules に自動 map します。',
          '既存の Metro options は mergeConfig に残してください。手動の resolver.extraNodeModules は保持され、自動 alias より優先されます。',
        ],
        code: metroBundleSections[0]?.code ?? '',
      },
      {
        eyebrow: 'Bundle archive',
        title: 'Host が必要な archive files だけを作成します。',
        body: [
          'OTA publish なしの portable artifact が必要な場合は、MFE project で rnm bundle を実行します。archive には index.bundle、manifest.json、実際に参照された runtime asset だけが含まれます。',
          '--host は .tar.gz を <host>/.bundle/rnm/ に copy し、rnm.bundle-archives.ts を生成します。prompt を受け入れるか --yes/--register-archives を渡すと、Host entry が生成された archive registration を import します。Host registry に bundleArchiveUrl を書く場合は --update-registry を追加してください。',
        ],
        code: metroBundleSections[1]?.code ?? '',
      },
      {
        eyebrow: 'Runtime assets',
        title: 'require/import asset は bundle 時に自動収集されます。',
        body: [
          'rnm bundle は既定で bundle-asset step を実行します。MFE entry から TypeScript/JavaScript AST をたどり、require() と import で参照された runtime asset だけを集め、manifest.json の assets field に書き込みます。',
          'OTA/archive delivery では、ユーザー端末は最初 MFE asset を持っていません。archive が asset delivery unit であり、index.bundle、manifest.json、参照 asset を一緒に download/read し、JS bundle evaluate 前に extract します。',
          '.ts、.tsx、.js、.d.ts、.map などの source file は除外します。asset folder 内でも実際に参照されない file は copy しません。最終 Metro bundle の registerAsset metadata も manifest に matching し、Metro registry にだけ現れた asset も含めます。',
          '収集結果だけを確認する場合は rnm bundle-asset を直接実行してください。静的解析できない dynamic require には --asset-glob を fallback として使い、自動収集を切る場合は --no-bundle-assets を明示します。',
        ],
        code: metroBundleSections[2]?.code ?? '',
      },
      {
        eyebrow: 'Host loader',
        title: 'loadBundleArchive が Host-owned evaluation boundary です。',
        body: [
          'bundleArchiveUrl がある場合、runtime は Host loader を選択します。createBundleArchiveLoader は登録済み React Native archive asset を読み、gunzip/untar し、manifest asset を deterministic cache に extract し、JS evaluate 前に asset resolver を patch して、MFE source を import せず Metro entry module を返します。',
          'rnm init と rnm add は rnm.bundle-archives.ts を事前生成し、Host entry から自動 import します。その後 rnm bundle --host は archive list が変わったときに同じ file を再生成します。generated file は app startup 時に optional native file-system package を require しません。検証済みの react-native-fs、Expo FileSystem、react-native-blob-util、custom native module adapter を使う場合だけ assetFileSystem を手動で渡します。',
          'registered/explicit FS adapter がない場合だけ、RNM は data:<mime>;base64,... URI に fallback します。base64 は互換 fallback であり、OTA、画像、font、Lottie JSON、PDF、大きな asset では file-cache extract を推奨します。',
          'cache path は <cacheRoot>/rnm-assets/<mfeName>/<version>/<platform>/<bundleHash>/ で、.rnm-assets-ready.json marker がある場合だけ再利用します。生成 registration は react-native/Libraries/Image/AssetRegistry も externalize するため、Metro numeric asset ID は準備済み asset URI に resolve できます。minitax のような Host では RNM package update/link、init/add の generated registration 自動 import 確認、rnm bundle --host --yes 再実行だけ確認してください。',
        ],
        code: metroBundleSections[3]?.code ?? '',
      },
    ],
    cliCommandSections: [
      {
        eyebrow: 'CLI reference',
        title: 'どの RNM command でも help を確認できます。',
        body: [
          '各 command には英語の help page があり、install 済み CLI version が対応する正確な options を確認できます。',
          '-h は --help と同じです。AOS/android alias などの command name も一貫して route されます。',
        ],
        code: cliCommandSections[0]?.code ?? '',
      },
      {
        eyebrow: 'Host integration',
        title:
          'package、Android、iOS integration を個別または一括で追加します。',
        body: [
          'rnm package は不足している JS/native package dependency を追加し、rnm aos または rnm android は Gradle project/dependency/permission を、rnm ios は Podfile addition を処理します。',
          '安全な既定順序が必要な場合は rnm all を使います: package -> AOS -> iOS。Expo managed project で native folders がまだ無い場合は rnm.expo-plugin.cjs と rnm.expo-integration.json を生成します。',
        ],
        code: cliCommandSections[1]?.code ?? '',
      },
      {
        eyebrow: 'Watcher behavior',
        title: 'add、bundle、verify、publish は不足 integration を監視します。',
        body: [
          'rnm add、rnm bundle --host、rnm verify、rnm publish、rnm expo は元の処理を続ける前に package -> AOS -> iOS watcher を実行します。',
          'interactive terminal では適用するか確認します。automation では --yes、直接 integration command では --dry-run、watcher を省く場合は --skip-integration を使います。',
        ],
        code: cliCommandSections[2]?.code ?? '',
      },
      {
        eyebrow: 'Expo support',
        title:
          '同じ RNM CLI command が Expo managed、prebuild、bare Host をサポートします。',
        body: [
          'bare/prebuilt project では generated Podfile/Gradle include files を書きます。ios/android folders が無い managed project では rnm.expo-plugin.cjs と rnm.expo-integration.json を生成します。',
          'RNM が additions を適用した後は、通常どおり Expo prebuild を実行してください。add、bundle --host、verify、publish の watcher behavior は同じです。',
        ],
        code: cliCommandSections[3]?.code ?? '',
      },
      {
        eyebrow: 'Lifecycle',
        title:
          'その他の command で build、safety check、状態確認、復旧を行います。',
        body: [
          'rnm init は host files を作成し、rnm build は bundle command を出力し、rnm diff は native contracts を比較し、rnm sync は native-change decision を記録します。',
          'rnm status と rnm doctor は read-only check command で、rnm rollback は .bak files を復旧します。',
        ],
        code: cliCommandSections[4]?.code ?? '',
      },
    ],
    optionsSections: [
      {
        eyebrow: 'Options map',
        title: 'どの file がどの option を所有するか確認します。',
        body: [
          'Host policy は react-native-micro-frontend.config.ts / .mjs / .cjs / .json、runtime module registration は rnm.registry.json、MFE-local assumptions は mfe.config.ts / .mjs / .cjs に置きます。',
          'policy、registration、feature bundle settings を分離すると、初めて見る人も値の影響範囲を判断しやすくなります。',
        ],
        code: localizedOptionCode.ja.map,
      },
      {
        eyebrow: 'Host config',
        title: 'react-native-micro-frontend.config.ts / .mjs / .cjs options。',
        body: [
          'Host App の OTA provider、package-manager、native-change、iOS/Android integration policy を説明します。',
          '初回導入では mfes を空にし、rnm add に rnm.registry.json を生成させる flow が最も明確です。',
        ],
        code: localizedOptionCode.ja.host,
      },
      {
        eyebrow: 'MFE config',
        title: 'mfe.config.ts / .mjs / .cjs options。',
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
        eyebrow: 'Acknowledgement',
        title: 'Hot Updater への敬意から始まりました。',
        body: [
          'この project は gronxb の Hot Updater から大きな inspiration を受けて始まりました。Hot Updater は React Native 向けの優れた self-hostable OTA project であり、RNM はそれを置き換えず first-class delivery engine として尊重します。',
          'RNM はその delivery seam の周辺に native-contract check、registry policy、microfrontend governance を加えます。この方向を可能にした gronxb に心から感謝します。',
        ],
        code: `Hot Updater:
  GitHub: https://github.com/gronxb/hot-updater
  Docs:   https://hot-updater.dev

Thank you:
  gronxb: https://github.com/gronxb`,
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
        title: 'bundle、Hot Updater/OTA、Expo メニューで使い方を分けます。',
        body: [
          'Bundle は rnm bundle で必要 files だけを archive し、bundleArchiveUrl、rnm.bundle-archives.ts、createBundleArchiveLoader で接続する方式です。',
          'OTA は verify 通過後に Hot Updater または custom OTA pipeline で remote delivery する方式です。',
        ],
        code: gettingStartedSections[8]?.code ?? '',
      },
      {
        eyebrow: 'Examples',
        title: 'examples を bundle、OTA、Expo の folders に分けました。',
        body: [
          'examples/bundle は OTA publish なしの rnm bundle archive を生成し、archive registration と createBundleArchiveLoader で実際に load する例です。',
          'examples/ota は rnm verify 通過後に Hot Updater または custom OTA SDK が download/evaluation を担当する例です。',
          'examples/expo は Expo managed/prebuild Host、EAS Update、Bun による mfe.config.mjs / .cjs 読み込みの例です。',
        ],
        code: splitExamplesCode,
      },
    ],
    hotUpdaterSections: [
      {
        eyebrow: 'Hot Updater route',
        title:
          'Hot Updater を delivery として維持し、その前段に native-safety verification を追加します。',
        body: [
          'このライブラリは Hot Updater を置き換えません。feature module が OTA 可能か先に検証し、実際の公開は Hot Updater に任せます。',
          'RNM は gronxb の Hot Updater から大きな inspiration を受けて始まりました: https://github.com/gronxb/hot-updater。React Native OTA の practical な self-hostable path を示した gronxb に感謝します。',
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
    repackComparisonSections: localizedGuidesShared.jaRepackComparison,
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
