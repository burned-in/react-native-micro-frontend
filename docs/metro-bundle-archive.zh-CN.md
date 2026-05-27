# Metro / Bundle archive

当 Host 在本地开发中通过 Metro 包含 MFE，或在不做 OTA publish 的情况下通过 portable `rnm bundle` archive 加载 MFE 时，使用本页。

## 使用 `withMfe` merge Metro

在现有 `getDefaultConfig()` / `mergeConfig()` 之后应用 `withMfe`。它读取 `rnm.registry.json`，把 active MFE root 加入 `watchFolders`，并自动把 shared package 映射到 Host `node_modules`。

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

已有的 `resolver.extraNodeModules` 会被保留，并优先于自动 alias。`withMfe` 也会把 `gz`、`tgz`、`tar` 加到 Metro asset 扩展名中，让 React Native 能打包复制过来的 archive asset。

## 无 OTA publish 的 Bundle archive

在 MFE project 中运行 `rnm bundle`。archive 包含 `index.bundle`、`manifest.json`，以及 MFE bundle 实际引用的 runtime asset 文件。

```bash
rnm bundle mfe-feature --platform ios --host ../host-app
rnm bundle mfe-feature --platform android --host ../host-app
```

如果要把 `bundleArchiveUrl` 写入 Host `rnm.registry.json`，请添加 `--update-registry`。使用 `--host` 时，CLI 还会生成 `rnm.bundle-archives.ts`，并询问是否从检测到的 Host entry file 导入它。用 `--yes` 或 `--register-archives` 可自动应用导入；用 `--no-register-archives` 只生成文件。

## Runtime asset pipeline

除非传入 `--no-bundle-assets`，`rnm bundle` 会自动运行 `rnm bundle-asset`。该步骤从 MFE entry file 开始，用 AST 解析 TS/JS/TSX/JSX，并只收集 `require()` 或 `import` 引用的 runtime asset。

```tsx
<Image source={require("./test.jpg")} />;
import logo from "./assets/logo.png";
import font from "./assets/fonts/Pretendard.ttf";
import animation from "./assets/lottie/loading.json";
```

`.ts`、`.tsx`、`.js`、`.d.ts`、`.map` 等 source 文件会被排除；asset 文件夹里未使用的文件也不会复制。生成的 `manifest.json` 的 `assets` 数组会在 Metro emit 时包含 `httpServerLocation`、`scales`、`hash`、`width`、`height` 等 `registerAsset(...)` metadata。

对于 OTA 或 archive delivery，用户设备在读取 archive 之前没有 MFE asset。archive 本身就是 asset delivery unit：`index.bundle`、`manifest.json` 和被引用的 asset 会一起下载/读取，然后 Host loader 会在 evaluate JavaScript bundle 之前把这些 asset extract 到 cache。

如果只想检查收集结果，或为 dynamic require 提供 fallback glob，请使用 standalone command：

```bash
rnm bundle-asset mfe-feature --platform ios --entry ./src/index.tsx
rnm bundle-asset mfe-feature --platform ios --asset-glob "src/assets/**/*"
```

## Host loader boundary

`bundleArchiveUrl` 选择 Host loader。`createBundleArchiveLoader()` 可以读取已注册的 React Native archive asset，gunzip/untar，把 manifest asset extract 到 deterministic cache，在 JavaScript evaluation 前 patch asset resolver，然后在不 import MFE source 的情况下返回 Metro entry module。

如果 CLI 没有自动 patch，请在 Host entry file 中 import 一次生成的注册文件：

```ts
import './rnm.bundle-archives';
```

`rnm init` 和 `rnm add` 会预先生成 Host 所需的 `rnm.bundle-archives.ts`，并自动从 Host entry 导入它。之后 `rnm bundle --host` 会在 archive 列表变化时重新生成同一个文件。如果 Host package 中有 `react-native-blob-util`，generated file 也会注册默认 file-system adapter：

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

导入该 generated registration 后，Host loader 可以保持最小配置：

```ts
const loadBundleArchive = createBundleArchiveLoader({ runtime: 'react-native' });

const loadMfeModule = createMicroFrontendLoader({
  custom: loadBundleArchive,
});
```

如果使用 `react-native-fs`、Expo FileSystem 或 custom native module，请直接把 `assetFileSystem` adapter 传给 `createBundleArchiveLoader()`。当没有 registered 或 explicit file-system adapter 时，RNM 才 fallback 到 `data:<mime>;base64,...` URI。base64 只是兼容 fallback；OTA、图片、字体、Lottie JSON、PDF 和较大的 asset 推荐使用 file-cache extract。

Extracted asset 会缓存到 `<cacheRoot>/rnm-assets/<mfeName>/<version>/<platform>/<bundleHash>/`，只有 `.rnm-assets-ready.json` 存在时才复用，从而避免 partial extract。生成的 registration 也会 externalize `react-native/Libraries/Image/AssetRegistry`，因此 Metro numeric asset ID 会通过 Host AssetRegistry resolve 到 extracted `file://` URI。不要在这个 bundle path 中 import MFE source。

在 `minitax` 这样的 Host 中应用时：

1. 将 Host dependency update/link/publish 到包含这些 bundle-archive export 的 RNM package。
2. 如果要使用默认高效的 file-cache 路径，保留 `react-native-blob-util`。
3. 确认 `rnm init` 或 `rnm add` 已自动 import generated registration。需要跳过 entry patch 时使用 `--no-register-archives`。
4. 重新运行 `rnm bundle <mfe-name> --platform ios|android --host ../host --yes`，让 `rnm.bundle-archives.ts` 包含复制后的 archive asset 列表。
5. Host 不需要写 per-asset mapping，MFE 也不需要手动 export asset。
