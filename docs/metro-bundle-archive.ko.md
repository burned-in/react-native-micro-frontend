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

MFE project에서 `rnm bundle`을 실행합니다. archive에는 `index.bundle`, `manifest.json`, 그리고 MFE bundle이 실제 참조한 runtime asset 파일만 들어갑니다.

```bash
rnm bundle mfe-feature --platform ios --host ../host-app
rnm bundle mfe-feature --platform android --host ../host-app
```

Host `rnm.registry.json`에 `bundleArchiveUrl`을 쓰려면 `--update-registry`를 추가하세요. `--host`를 사용하면 CLI가 `rnm.bundle-archives.ts`도 생성하고, 감지한 Host entry file에서 이 파일을 import할지 묻습니다. 자동 적용하려면 `--yes` 또는 `--register-archives`를 주고, 파일만 만들려면 `--no-register-archives`를 사용하세요.

## Runtime asset pipeline

`rnm bundle`은 `--no-bundle-assets`를 주지 않는 한 `rnm bundle-asset` 단계를 자동 실행합니다. 이 단계는 MFE entry file에서 시작해 TS/JS/TSX/JSX를 AST로 파싱하고, `require()` 또는 `import`로 참조한 runtime asset만 수집합니다.

```tsx
<Image source={require("./test.jpg")} />;
import logo from "./assets/logo.png";
import font from "./assets/fonts/Pretendard.ttf";
import animation from "./assets/lottie/loading.json";
```

`.ts`, `.tsx`, `.js`, `.d.ts`, `.map` 같은 source 파일은 제외하고, asset 폴더 안에 있어도 사용하지 않은 파일은 복사하지 않습니다. 생성된 `manifest.json`의 `assets` 배열에는 Metro가 emit한 경우 `httpServerLocation`, `scales`, `hash`, `width`, `height` 같은 `registerAsset(...)` metadata가 함께 들어갑니다.

수집 결과만 확인하거나 dynamic require fallback glob을 줄 때는 standalone command를 사용하세요:

```bash
rnm bundle-asset mfe-feature --platform ios --entry ./src/index.tsx
rnm bundle-asset mfe-feature --platform ios --asset-glob "src/assets/**/*"
```

## Host loader boundary

`bundleArchiveUrl`은 Host loader를 선택합니다. `createBundleArchiveLoader()`는 등록된 React Native archive asset을 읽고 gunzip/untar한 뒤, manifest asset을 deterministic cache에 extract하고 JavaScript evaluation 전에 asset resolver를 patch해서 MFE source import 없이 Metro entry module을 반환합니다.

CLI가 자동으로 patch하지 않았다면 Host entry file에서 생성된 등록 파일을 한 번 import하세요:

```ts
import './rnm.bundle-archives';
```

React Native에서는 `react-native-fs`, `react-native-blob-util`, Expo FileSystem 또는 custom native module 기반 `assetFileSystem` adapter를 넘겨 loader를 연결하세요:

```ts
const loadBundleArchive = createBundleArchiveLoader({
  runtime: 'react-native',
  assetFileSystem: hostAssetFileSystem,
});

const loadMfeModule = createMicroFrontendLoader({
  custom: loadBundleArchive,
});
```

Extracted asset은 `<cacheRoot>/rnm-assets/<mfeName>/<version>/<platform>/<bundleHash>/` 아래에 cache되고 `.rnm-assets-ready.json`이 있을 때만 재사용됩니다. 이 bundle path에서 MFE source import로 우회하지 마세요.
