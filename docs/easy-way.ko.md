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

# Hot Updater 대신 Expo EAS Update 사용
rnm add mfe-feature --path ../mfe-feature --entry ./src/index.tsx --version 1.0.0 --ota-provider expo --ota-mode manual
rnm expo mfe-feature --channel production --platform all --non-interactive
```

```tsx
const loadMfeModule = createMicroFrontendLoader({
  hotUpdater: loadWithHotUpdater,
  custom: loadWithCustomOta,
});
```

native assumption이 바뀌어 verification이 실패하면 OTA 대신 Store release를 진행하세요.

## 4. Expo — managed 또는 prebuild Host App

Expo Host App도 지원합니다. Generic, Bundle, OTA 메뉴는 그대로 쓰고 RNM integration watcher가 native 추가 항목을 처리하게 하세요. MFE를 `--ota-provider expo`로 등록하면 `rnm add`가 `expo`, `expo-updates` 같은 Host 누락 패키지도 보여주고 적용할 수 있습니다.

```bash
rnm add mfe-feature --path ../mfe-feature
rnm all mfe-feature
# package -> AOS -> iOS
```

`ios/` 또는 `android/`가 아직 없는 Expo managed project에서는 RNM이 `rnm.expo-plugin.cjs`와 `rnm.expo-integration.json`을 만들고, 가능한 경우 `app.json`에 plugin을 추가합니다. 이후 Expo prebuild를 평소처럼 실행합니다.

```bash
npx expo prebuild

# RNM safety check 이후 Expo EAS Update로 배포
rnm expo mfe-feature --channel production --platform all --non-interactive
```

`rnm add`, `rnm bundle --host`, `rnm verify`, `rnm publish`, `rnm expo`도 integration watcher를 실행합니다. 비대화형 자동 적용은 `--yes`, watcher 생략은 `--skip-integration`을 사용하세요.
