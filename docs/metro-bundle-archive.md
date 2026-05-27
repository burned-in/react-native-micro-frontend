# Metro / Bundle archive

Use this page when the Host should load an MFE through Metro during local development, or through a portable `rnm bundle` archive without OTA publishing.

## Metro with `withMfe`

Add `withMfe` after your existing `getDefaultConfig()` / `mergeConfig()` call. It reads `rnm.registry.json`, adds active MFE roots to `watchFolders`, and maps shared packages to the Host `node_modules` automatically.

```js
// host-app/metro.config.js
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
})();
```

Existing `resolver.extraNodeModules` entries are preserved and override automatic aliases. `withMfe` also adds `gz`, `tgz`, and `tar` to Metro asset extensions so copied archive assets can be bundled by React Native.

## Bundle archive without OTA publish

Run `rnm bundle` in the MFE project. The archive contains `index.bundle`, `manifest.json`, and only the runtime asset files that were actually referenced by the MFE bundle.

```bash
rnm bundle mfe-feature --platform ios --host ../host-app
rnm bundle mfe-feature --platform android --host ../host-app
```

Use `--update-registry` when you want to write `bundleArchiveUrl` into the Host `rnm.registry.json`. When `--host` is used, the CLI also generates `rnm.bundle-archives.ts` and asks whether to import it from the detected Host entry file. Pass `--yes` or `--register-archives` to apply that import automatically, or `--no-register-archives` to only generate the file.

## Runtime asset pipeline

`rnm bundle` runs `rnm bundle-asset` automatically unless `--no-bundle-assets` is passed. The asset step starts from the MFE entry file, parses TS/JS/TSX/JSX with an AST, and collects runtime assets referenced by `require()` or `import`.

```tsx
<Image source={require("./test.jpg")} />;
import logo from "./assets/logo.png";
import font from "./assets/fonts/Pretendard.ttf";
import animation from "./assets/lottie/loading.json";
```

Source files (`.ts`, `.tsx`, `.js`, `.d.ts`, `.map`) are excluded, and unused files in asset folders are not copied. The generated `manifest.json` gets an `assets` array with Metro `registerAsset(...)` metadata such as `httpServerLocation`, `scales`, `hash`, `width`, and `height` when Metro emits it.

Use the standalone command to inspect the result or to provide a fallback glob for dynamic require patterns:

```bash
rnm bundle-asset mfe-feature --platform ios --entry ./src/index.tsx
rnm bundle-asset mfe-feature --platform ios --asset-glob "src/assets/**/*"
```

## Host loader boundary

`bundleArchiveUrl` selects the Host loader. `createBundleArchiveLoader()` can read the registered React Native archive asset, gunzip/untar it, extract manifest assets into a deterministic cache, patch the asset resolver before JavaScript evaluation, and return the Metro entry module without importing MFE source.

Import the generated registration once from the Host entry file if the CLI did not patch it for you:

```ts
import './rnm.bundle-archives';
```

Then wire the loader. In React Native, provide an `assetFileSystem` adapter backed by `react-native-fs`, `react-native-blob-util`, Expo FileSystem, or a custom native module:

```ts
const loadBundleArchive = createBundleArchiveLoader({
  runtime: 'react-native',
  assetFileSystem: hostAssetFileSystem,
});

const loadMfeModule = createMicroFrontendLoader({
  custom: loadBundleArchive,
});
```

Extracted assets are cached under `<cacheRoot>/rnm-assets/<mfeName>/<version>/<platform>/<bundleHash>/` and reused only after `.rnm-assets-ready.json` exists. Do not import MFE source from this bundle path.
