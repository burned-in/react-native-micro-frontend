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

MFE project で `rnm bundle` を実行します。archive には `index.bundle`、`manifest.json`、そして MFE bundle が実際に参照した runtime asset files だけが含まれます。

```bash
rnm bundle mfe-feature --platform ios --host ../host-app
rnm bundle mfe-feature --platform android --host ../host-app
```

Host `rnm.registry.json` に `bundleArchiveUrl` を書き込む場合は `--update-registry` を追加してください。`--host` を使うと CLI は `rnm.bundle-archives.ts` も生成し、検出した Host entry file から import するか確認します。自動適用する場合は `--yes` または `--register-archives`、file 生成だけにする場合は `--no-register-archives` を使います。

## Runtime asset pipeline

`--no-bundle-assets` を渡さない限り、`rnm bundle` は `rnm bundle-asset` step を自動実行します。この step は MFE entry file から始め、TS/JS/TSX/JSX を AST で解析し、`require()` または `import` で参照した runtime asset だけを収集します。

```tsx
<Image source={require("./test.jpg")} />;
import logo from "./assets/logo.png";
import font from "./assets/fonts/Pretendard.ttf";
import animation from "./assets/lottie/loading.json";
```

`.ts`、`.tsx`、`.js`、`.d.ts`、`.map` などの source files は除外され、asset folder 内でも未使用 file は copy されません。生成される `manifest.json` の `assets` array には、Metro が emit した場合 `httpServerLocation`、`scales`、`hash`、`width`、`height` などの `registerAsset(...)` metadata も入ります。

収集結果だけを確認する場合や dynamic require の fallback glob を渡す場合は standalone command を使います:

```bash
rnm bundle-asset mfe-feature --platform ios --entry ./src/index.tsx
rnm bundle-asset mfe-feature --platform ios --asset-glob "src/assets/**/*"
```

## Host loader boundary

`bundleArchiveUrl` は Host loader を選択します。`createBundleArchiveLoader()` は登録済み React Native archive asset を読み、gunzip/untar し、manifest asset を deterministic cache に extract し、JavaScript evaluation 前に asset resolver を patch して、MFE source を import せず Metro entry module を返します。

CLI が自動 patch していない場合は、Host entry file で生成された registration を 1 回 import してください:

```ts
import './rnm.bundle-archives';
```

React Native では `react-native-fs`、`react-native-blob-util`、Expo FileSystem、または custom native module を使う `assetFileSystem` adapter を渡してください:

```ts
const loadBundleArchive = createBundleArchiveLoader({
  runtime: 'react-native',
  assetFileSystem: hostAssetFileSystem,
});

const loadMfeModule = createMicroFrontendLoader({
  custom: loadBundleArchive,
});
```

Extracted asset は `<cacheRoot>/rnm-assets/<mfeName>/<version>/<platform>/<bundleHash>/` に cache され、`.rnm-assets-ready.json` がある場合だけ再利用されます。この bundle path で MFE source import に戻さないでください。
