# Metro / Bundle archive

Host が local development では Metro で MFE を含め、OTA publish なしでは portable `rnm bundle` archive で読み込む場合のガイドです。

## `withMfe` で Metro を merge

既存の `getDefaultConfig()` / `mergeConfig()` の後に `withMfe` を適用します。`rnm.registry.json` を読み、active MFE root を `watchFolders` に追加し、shared package を Host `node_modules` に自動 map します。

```js
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

既存の `resolver.extraNodeModules` は保持され、自動 alias より優先されます。

## OTA publish なしの Bundle archive

MFE project で `rnm bundle` を実行します。archive には `index.bundle`、`assets/`、`manifest.json` だけが含まれます。

```bash
rnm bundle mfe-feature --platform ios --host ../host-app
rnm bundle mfe-feature --platform android --host ../host-app
```

Host `rnm.registry.json` に `bundleArchiveUrl` を書き込む場合だけ `--update-registry` を追加してください。

## Host loader boundary

`bundleArchiveUrl` は custom loader を選択しますが、runtime が compressed JavaScript を直接実行するわけではありません。

```tsx
const loadMfeModule = createMicroFrontendLoader({
  custom: loadBundleArchive,
});
```

production `loadBundleArchive` は archive の read/download、integrity verification、`index.bundle` / `assets` / `manifest.json` の unpack、Host runtime または OTA engine による evaluation を担当します。この bundle path で MFE source import に戻さないでください。
