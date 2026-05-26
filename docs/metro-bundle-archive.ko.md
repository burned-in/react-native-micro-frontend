# Metro / Bundle archive

Host가 local development에서는 Metro로 MFE를 포함하고, OTA publish 없이 portable `rnm bundle` archive로 로드해야 할 때 사용하는 문서입니다.

## `withMfe`로 Metro merge

기존 `getDefaultConfig()` / `mergeConfig()` 뒤에 `withMfe`를 적용하세요. `rnm.registry.json`을 읽어 active MFE root를 `watchFolders`에 추가하고 shared package를 Host `node_modules`로 자동 매핑합니다.

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

기존 `resolver.extraNodeModules`는 보존되며 자동 alias보다 우선합니다.

## OTA publish 없는 Bundle archive

MFE project에서 `rnm bundle`을 실행합니다. archive에는 `index.bundle`, `assets/`, `manifest.json`만 들어갑니다.

```bash
rnm bundle mfe-feature --platform ios --host ../host-app
rnm bundle mfe-feature --platform android --host ../host-app
```

Host `rnm.registry.json`에 `bundleArchiveUrl`을 쓰려는 경우에만 `--update-registry`를 추가하세요.

## Host loader boundary

`bundleArchiveUrl`은 custom loader를 선택하게 하지만 runtime이 압축된 JavaScript를 직접 실행하지는 않습니다.

```tsx
const loadMfeModule = createMicroFrontendLoader({
  custom: loadBundleArchive,
});
```

production `loadBundleArchive`는 archive 읽기/download, integrity 검증, `index.bundle` / `assets` / `manifest.json` 압축 해제, Host runtime 또는 OTA engine을 통한 evaluation을 담당해야 합니다. 이 bundle path에서 MFE source import로 우회하지 마세요.
