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

OTA または archive delivery では、ユーザー端末は archive を読む前に MFE asset を持っていません。archive が asset delivery unit であり、`index.bundle`、`manifest.json`、参照された asset を一緒に download/read し、Host loader が JavaScript bundle を evaluate する前にそれらを cache へ extract します。

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

`rnm init` と `rnm add` は Host に必要な `rnm.bundle-archives.ts` を事前生成し、Host entry から自動 import します。その後 `rnm bundle --host` は archive list が変わったときに同じ file を再生成します。Host package に `react-native-blob-util` がある場合、generated file は default file-system adapter も登録します:

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

この generated registration を import していれば、Host loader は最小構成のままで使えます:

```ts
const loadBundleArchive = createBundleArchiveLoader({ runtime: 'react-native' });

const loadMfeModule = createMicroFrontendLoader({
  custom: loadBundleArchive,
});
```

`react-native-fs`、Expo FileSystem、または custom native module を使う場合は、`createBundleArchiveLoader()` に `assetFileSystem` adapter を直接渡してください。registered/explicit file-system adapter がどちらもない場合だけ、RNM は `data:<mime>;base64,...` URI に fallback します。base64 は互換 fallback であり、OTA、画像、font、Lottie JSON、PDF、大きな asset では file-cache extract が推奨です。

Extracted asset は `<cacheRoot>/rnm-assets/<mfeName>/<version>/<platform>/<bundleHash>/` に cache され、`.rnm-assets-ready.json` がある場合だけ再利用されるため partial extract を避けられます。生成される registration は `react-native/Libraries/Image/AssetRegistry` も externalize するので、Metro numeric asset ID は Host AssetRegistry 経由で extracted `file://` URI に resolve されます。この bundle path で MFE source import に戻さないでください。

`minitax` のような Host に適用する場合:

1. これらの bundle-archive export を含む RNM package に Host dependency を update/link/publish します。
2. default の効率的な file-cache path を使うなら `react-native-blob-util` を維持します。
3. `rnm init` または `rnm add` が generated registration を自動 import したことを確認します。entry patch を避けたい場合だけ `--no-register-archives` を使います。
4. `rnm bundle <mfe-name> --platform ios|android --host ../host --yes` を再実行し、copy 済み archive asset list を含む `rnm.bundle-archives.ts` を再生成します。
5. Host 側の asset 別 mapping も、MFE 側の手動 asset export も不要です。
