# Easy Way

Host App과 MFE를 연결하기 전에 세 가지 메뉴 중 하나를 먼저 고르세요.

## 1. Generic — 일반 TypeScript module 방식

Host와 MFE가 같은 workspace에 있고 Metro가 MFE source를 직접 bundle할 수 있을 때 사용합니다.

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

Host loader import는 static으로 유지합니다.

```tsx
const localModules = {
  "mfe-feature": () => import("../mfe-feature/src/index"),
};
```

## 2. Bundle — OTA publish 없는 archive

MFE가 portable archive를 만들지만 OTA로 publish하지 않아야 할 때 사용합니다.

```bash
rnm bundle mfe-feature --platform ios --host ../host-app
```

archive에는 아래 파일만 들어갑니다.

```txt
index.bundle
assets/
manifest.json
```

OTA 없는 bundle 방식에서는 registry의 OTA를 끄고 `bundleArchiveUrl` metadata만 유지합니다.

```json
{
  "bundleArchiveUrl": ".bundle/rnm/mfe-feature.ios.ota.tar.gz",
  "ota": { "enabled": false, "mode": "disabled", "provider": "none" }
}
```

## 3. OTA — Hot Updater 또는 custom delivery

native-safety verification 이후 원격 배포가 필요할 때 사용합니다.

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

native assumption이 바뀌어 verification이 실패하면 OTA 대신 Store release를 진행하세요.
