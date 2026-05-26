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

已有的 `resolver.extraNodeModules` 会被保留，并优先于自动 alias。

## 无 OTA publish 的 Bundle archive

在 MFE project 中运行 `rnm bundle`。archive 只包含 `index.bundle`、`assets/` 和 `manifest.json`。

```bash
rnm bundle mfe-feature --platform ios --host ../host-app
rnm bundle mfe-feature --platform android --host ../host-app
```

只有明确要把 `bundleArchiveUrl` 写入 Host `rnm.registry.json` 时才添加 `--update-registry`。

## Host loader boundary

`bundleArchiveUrl` 会选择 custom loader，但 runtime 不会自行执行压缩后的 JavaScript。

```tsx
const loadMfeModule = createMicroFrontendLoader({
  custom: loadBundleArchive,
});
```

production `loadBundleArchive` 应负责读取/下载 archive、校验 integrity、解压 `index.bundle` / `assets` / `manifest.json`，并通过 Host runtime 或 OTA engine evaluate。不要在这个 bundle path 中退回到 import MFE source。
