# Easy Way

Host App と MFE を接続する前に、3 つのメニューから 1 つを選びます。

## 1. Generic — 通常の TypeScript module 方式

Host と MFE が同じ workspace にあり、Metro が MFE source を直接 bundle できる場合に使います。

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

Host loader import は static に保ちます。

```tsx
const localModules = {
  "mfe-feature": () => import("../mfe-feature/src/index"),
};
```

## 2. Bundle — OTA publish なしの archive

MFE が portable archive を作るが OTA publish はしない場合に使います。

```bash
rnm bundle mfe-feature --platform ios --host ../host-app
```

archive には次の files だけが入ります。

```txt
index.bundle
assets/
manifest.json
```

OTA なしの bundle 方式では registry OTA を無効にし、`bundleArchiveUrl` metadata だけを保持します。

```json
{
  "bundleArchiveUrl": ".bundle/rnm/mfe-feature.ios.ota.tar.gz",
  "ota": { "enabled": false, "mode": "disabled", "provider": "none" }
}
```

## 3. OTA — Hot Updater または custom delivery

native-safety verification 後に remote delivery が必要な場合に使います。

```bash
rnm add mfe-feature --path ../mfe-feature --entry ./src/index.tsx --version 1.0.0 --ota-provider hot-updater --ota-mode manual
rnm verify mfe-feature
rnm publish mfe-feature --package-manager bun --channel production
```

```tsx
const loadMfeModule = createMicroFrontendLoader({
  hotUpdater: loadWithHotUpdater,
  custom: loadWithCustomOta,
});
```

native assumption が変わって verification が失敗した場合は、OTA ではなく Store release を行います。
