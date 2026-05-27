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

For OTA or archive delivery, the user device does not have MFE assets before the archive is read. The archive is the asset delivery unit: `index.bundle`, `manifest.json`, and the referenced assets are downloaded or read together, then the Host loader extracts those assets before evaluating the JavaScript bundle.

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

Then wire the loader. `rnm init` and `rnm add` pre-generate `rnm.bundle-archives.ts` and auto-import it from the Host entry. Later, `rnm bundle --host` regenerates the same file when the archive list changes. If the Host package has `react-native-blob-util`, the generated file also registers the default file-system adapter:

```ts
import ReactNativeBlobUtil from 'react-native-blob-util';
import {
  createReactNativeBlobUtilAssetFileSystem,
  registerBundleArchiveAssetFileSystem,
} from '@bunin/react-native-micro-frontend/bundle-archive';

registerBundleArchiveAssetFileSystem(
  createReactNativeBlobUtilAssetFileSystem(ReactNativeBlobUtil),
);
```

With that generated registration imported, the loader can stay minimal:

```ts
const loadBundleArchive = createBundleArchiveLoader({ runtime: 'react-native' });

const loadMfeModule = createMicroFrontendLoader({
  custom: loadBundleArchive,
});
```

If you use `react-native-fs`, Expo FileSystem, or a custom native module instead, pass an `assetFileSystem` adapter directly to `createBundleArchiveLoader()`. When no registered or explicit file-system adapter exists, RNM falls back to `data:<mime>;base64,...` URIs. Treat base64 as a compatibility fallback; file-cache extraction is preferred for OTA, images, fonts, Lottie JSON, PDFs, and other large assets.

Extracted assets are cached under `<cacheRoot>/rnm-assets/<mfeName>/<version>/<platform>/<bundleHash>/` and reused only after `.rnm-assets-ready.json` exists, which prevents partial extracts from being reused. The generated registration also externalizes `react-native/Libraries/Image/AssetRegistry`, so Metro numeric asset IDs resolve through the Host AssetRegistry to the extracted `file://` URI. Do not import MFE source from this bundle path.

For a Host such as `minitax`, the application-side checklist is:

1. Update, link, or publish the Host to a RNM package version that includes these bundle-archive exports.
2. Keep `react-native-blob-util` installed when you want the default efficient file-cache path.
3. Confirm `rnm init` or `rnm add` imported the generated registration. Use `--no-register-archives` only when you intentionally want to skip that entry patch.
4. Re-run `rnm bundle <mfe-name> --platform ios|android --host ../host --yes` so `rnm.bundle-archives.ts` is regenerated with the copied archive asset list.
5. No per-asset mapping is needed in Host code, and the MFE does not need to export assets manually.
