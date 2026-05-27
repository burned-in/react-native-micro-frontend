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

Run `rnm bundle` in the MFE project. The archive contains only `index.bundle`, `assets/`, and `manifest.json`.

```bash
rnm bundle mfe-feature --platform ios --host ../host-app
rnm bundle mfe-feature --platform android --host ../host-app
```

Use `--update-registry` when you want to write `bundleArchiveUrl` into the Host `rnm.registry.json`. When `--host` is used, the CLI also generates `rnm.bundle-archives.ts` and asks whether to import it from the detected Host entry file. Pass `--yes` or `--register-archives` to apply that import automatically, or `--no-register-archives` to only generate the file.

## Host loader boundary

`bundleArchiveUrl` selects the Host loader. `createBundleArchiveLoader()` can now read the registered React Native archive asset, gunzip/untar it, and return the Metro entry module without importing MFE source.

```tsx
const loadMfeModule = createMicroFrontendLoader({
  custom: loadBundleArchive,
});
```

Import the generated registration once from the Host entry file if the CLI did not patch it for you:

```ts
import './rnm.bundle-archives';
```

Then wire the loader normally:

```ts
const loadBundleArchive = createBundleArchiveLoader();
```

Do not import MFE source from this bundle path.
