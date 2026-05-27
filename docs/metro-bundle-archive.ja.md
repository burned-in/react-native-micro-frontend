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

既存の `resolver.extraNodeModules` は保持され、自動 alias より優先されます。`withMfe` は React Native が copy 済み archive asset を bundle できるように、`gz`、`tgz`、`tar` も Metro asset extension に追加します。

## OTA publish なしの Bundle archive

MFE project で `rnm bundle` を実行します。archive には `index.bundle`、`assets/`、`manifest.json` だけが含まれます。

```bash
rnm bundle mfe-feature --platform ios --host ../host-app
rnm bundle mfe-feature --platform android --host ../host-app
```

Host `rnm.registry.json` に `bundleArchiveUrl` を書き込む場合は `--update-registry` を追加してください。`--host` を使うと CLI は `rnm.bundle-archives.ts` も生成し、検出した Host entry file から import するか確認します。自動適用する場合は `--yes` または `--register-archives`、file 生成だけにする場合は `--no-register-archives` を使います。

## Host loader boundary

`bundleArchiveUrl` は Host loader を選択します。`createBundleArchiveLoader()` は登録済み React Native archive asset を読み、gunzip/untar して、MFE source を import せず Metro entry module を返せます。

```tsx
const loadMfeModule = createMicroFrontendLoader({
  custom: loadBundleArchive,
});
```

CLI が自動 patch しなかった場合は、Host entry file で生成された登録 file を 1 回 import してください:

```ts
import './rnm.bundle-archives';
```

その後 loader を通常通り接続します:

```ts
const loadBundleArchive = createBundleArchiveLoader();
```

この bundle path で MFE source import に迂回しないでください。
