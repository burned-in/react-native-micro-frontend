# Easy Way

连接 Host App 与 MFE 之前，请先选择三种菜单之一。

## 1. Generic — 普通 TypeScript module 方式

当 Host 与 MFE 在同一个 workspace，且 Metro 可以直接 bundle MFE source 时使用。

```bash
rnm add mfe-feature --path ../mfe-feature --entry ./src/index.tsx --version 1.0.0 --no-ota --ota-provider none --ota-mode disabled
```

```js
const { getDefaultConfig, mergeConfig } = require("@react-native/metro-config");

module.exports = (async () => {
  const { withMfe } = await import("@bunin/react-native-micro-frontend/metro");
  return withMfe(__dirname, mergeConfig(getDefaultConfig(__dirname), {}));
})();
```

Host loader import 应保持 static。

```tsx
const localModules = {
  "mfe-feature": () => import("../mfe-feature/src/index"),
};
```

## 2. Bundle — 不进行 OTA publish 的 archive

当 MFE 需要生成 portable archive，但不应通过 OTA publish 时使用。

```bash
rnm bundle mfe-feature --platform ios --host ../host-app
```

archive 只包含以下文件。

```txt
index.bundle
assets/
manifest.json
```

无 OTA 的 bundle 方式应关闭 registry OTA，只保留 `bundleArchiveUrl` metadata。

```json
{
  "bundleArchiveUrl": ".bundle/rnm/mfe-feature.ios.ota.tar.gz",
  "ota": { "enabled": false, "mode": "disabled", "provider": "none" }
}
```

## 3. OTA — Hot Updater 或 custom delivery

当 native-safety verification 之后需要远程发布时使用。

```bash
rnm add mfe-feature --path ../mfe-feature --entry ./src/index.tsx --version 1.0.0 --ota-provider hot-updater --ota-mode manual
rnm verify mfe-feature
rnm publish mfe-feature --package-manager bun --channel production

# 使用 Expo EAS Update 代替 Hot Updater
rnm add mfe-feature --path ../mfe-feature --entry ./src/index.tsx --version 1.0.0 --ota-provider expo --ota-mode manual
rnm expo mfe-feature --channel production --platform all --non-interactive
```

```tsx
const loadMfeModule = createMicroFrontendLoader({
  hotUpdater: loadWithHotUpdater,
  custom: loadWithCustomOta,
});
```

如果 native assumption 变化导致 verification 失败，应走 Store release，而不是 OTA。

## 4. Expo — managed 或 prebuild Host App

Expo Host App 也受支持。Generic、Bundle、OTA 三种菜单保持不变，然后让 RNM integration watcher 处理 native additions。使用 `--ota-provider expo` 注册 MFE 时，`rnm add` 也会显示并可应用 Host 缺失的 `expo`、`expo-updates` 等包。

```bash
rnm add mfe-feature --path ../mfe-feature
rnm all mfe-feature
# package -> AOS -> iOS
```

对于还没有 `ios/` 或 `android/` 的 Expo managed project，RNM 会生成 `rnm.expo-plugin.cjs` 和 `rnm.expo-integration.json`，并在可行时把 plugin 加入 `app.json`。之后照常运行 Expo prebuild。

```bash
npx expo prebuild

# RNM safety check 后通过 Expo EAS Update 发布
rnm expo mfe-feature --channel production --platform all --non-interactive
```

`rnm add`、`rnm bundle --host`、`rnm verify`、`rnm publish`、`rnm expo` 也会运行 integration watcher。非交互自动应用使用 `--yes`，跳过 watcher 使用 `--skip-integration`。
