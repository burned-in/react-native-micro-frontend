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

Existing `resolver.extraNodeModules` entries are preserved and override automatic aliases.

## Bundle archive without OTA publish

Run `rnm bundle` in the MFE project. The archive contains only `index.bundle`, `assets/`, and `manifest.json`.

```bash
rnm bundle mfe-feature --platform ios --host ../host-app
rnm bundle mfe-feature --platform android --host ../host-app
```

Use `--update-registry` only when you intentionally want to write `bundleArchiveUrl` into the Host `rnm.registry.json`.

## Host loader boundary

`bundleArchiveUrl` selects your custom loader, but the runtime does not execute compressed JavaScript by itself.

```tsx
const loadMfeModule = createMicroFrontendLoader({
  custom: loadBundleArchive,
});
```

A production `loadBundleArchive` should read or download the archive, verify integrity, unpack `index.bundle` / `assets` / `manifest.json`, and evaluate the bundle through the Host runtime or OTA engine. Do not import MFE source from this bundle path.
