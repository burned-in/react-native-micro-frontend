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

기존 `resolver.extraNodeModules`는 보존되며 자동 alias보다 우선합니다. `withMfe`는 React Native가 복사된 archive asset을 bundle할 수 있도록 `gz`, `tgz`, `tar`도 Metro asset 확장자에 추가합니다.

## OTA publish 없는 Bundle archive

MFE project에서 `rnm bundle`을 실행합니다. archive에는 `index.bundle`, `assets/`, `manifest.json`만 들어갑니다.

```bash
rnm bundle mfe-feature --platform ios --host ../host-app
rnm bundle mfe-feature --platform android --host ../host-app
```

Host `rnm.registry.json`에 `bundleArchiveUrl`을 쓰려면 `--update-registry`를 추가하세요. `--host`를 사용하면 CLI가 `rnm.bundle-archives.ts`도 생성하고, 감지한 Host entry file에서 이 파일을 import할지 묻습니다. 자동 적용하려면 `--yes` 또는 `--register-archives`를 주고, 파일만 만들려면 `--no-register-archives`를 사용하세요.

## Host loader boundary

`bundleArchiveUrl`은 Host loader를 선택합니다. `createBundleArchiveLoader()`는 등록된 React Native archive asset을 읽고 gunzip/untar한 뒤 MFE source import 없이 Metro entry module을 반환할 수 있습니다.

```tsx
const loadMfeModule = createMicroFrontendLoader({
  custom: loadBundleArchive,
});
```

CLI가 자동으로 patch하지 않았다면 Host entry file에서 생성된 등록 파일을 한 번 import하세요:

```ts
import './rnm.bundle-archives';
```

그리고 loader는 일반적으로 이렇게 연결합니다:

```ts
const loadBundleArchive = createBundleArchiveLoader();
```

이 bundle path에서 MFE source import로 우회하지 마세요.
