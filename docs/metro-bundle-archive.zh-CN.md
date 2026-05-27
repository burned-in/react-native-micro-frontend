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

在 MFE project 中运行 `rnm bundle`。archive 只包含 `index.bundle`、`assets/` 和 `manifest.json`。

```bash
rnm bundle mfe-feature --platform ios --host ../host-app
rnm bundle mfe-feature --platform android --host ../host-app
```

如果要把 `bundleArchiveUrl` 写入 Host `rnm.registry.json`，请添加 `--update-registry`。使用 `--host` 时，CLI 还会生成 `rnm.bundle-archives.ts`，并询问是否从检测到的 Host entry file 导入它。用 `--yes` 或 `--register-archives` 可自动应用导入；用 `--no-register-archives` 只生成文件。

## Host loader boundary

`bundleArchiveUrl` 会选择 Host loader。`createBundleArchiveLoader()` 可以读取已注册的 React Native archive asset，执行 gunzip/untar，并在不导入 MFE source 的情况下返回 Metro entry module。

```tsx
const loadMfeModule = createMicroFrontendLoader({
  custom: loadBundleArchive,
});
```

如果 CLI 没有自动 patch，请在 Host entry file 中导入生成的注册文件一次：

```ts
import './rnm.bundle-archives';
```

然后正常连接 loader：

```ts
const loadBundleArchive = createBundleArchiveLoader();
```

不要在这个 bundle path 中改为 import MFE source。
