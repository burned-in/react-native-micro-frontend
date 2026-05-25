# @bunin/react-native-micro-frontend

**React Native를 위한 native-safe micro frontend 라이브러리.**

기능 모듈을 독립적으로 개발하고, native compatibility를 검증한 뒤, host binary가 안전하게 실행할 수 있는 경우에만 OTA로 배포합니다.

관련 문서: [공식 문서 홈](index.ko.md) · [패키지 매니저 매트릭스](package-managers.ko.md)

```txt
React Native Micro Frontend
  registry 기반 모듈 관리
  native contract 검증
  Metro bundle 생성
  Hot Updater 배포 연동
  runtime safety gate
```

## 개발 상태

이 프로젝트는 아직 활발히 개발 중입니다. public API는 실험과 초기 통합에 사용할 수 있지만, `0.x` 라인은 runtime, CLI, native-contract workflow가 안정화되는 동안 변경될 수 있습니다.

프로덕션에서는 정확한 package version을 고정하고 CI에서 native compatibility check를 직접 돌린 뒤 사용하는 것을 권장합니다.

## 개요

`@bunin/react-native-micro-frontend`는 React Native 팀이 native binary compatibility를 잃지 않으면서 feature module을 독립적으로 배포할 수 있게 해 주는 안전장치이자 통합 레이어입니다.

Hot Updater를 대체하지 않습니다. Hot Updater는 OTA delivery engine이고, 이 라이브러리는 그 전에 MFE를 안전하게 publish/load할 수 있는지 판단합니다.

## 주요 기능

| 기능 | 설명 |
| --- | --- |
| MFE registry | feature module, entry point, OTA policy, runtime status를 하나의 registry로 관리합니다. |
| Native contract | React Native version, Hermes, New Architecture, native dependency, Podfile, Gradle, AndroidManifest, Info.plist 관련 입력을 hash로 고정합니다. |
| OTA gate | native assumption이 host binary와 맞지 않으면 OTA를 차단합니다. |
| Runtime policy | blocked/incompatible MFE를 로드하지 않고 fallback을 보여 줍니다. |
| Metro integration | Re.Pack이나 Module Federation 없이 inspect 가능한 Metro bundle command를 생성합니다. |
| Hot Updater adapter | 기존 Hot Updater 배포 흐름을 그대로 재사용합니다. |
| Package manager support | Bun, npm, pnpm, Yarn, Deno consumer workflow를 지원합니다. |

## 빠른 시작

```bash
bun add @bunin/react-native-micro-frontend
bun add -d @bunin/react-native-micro-frontend-cli
bunx @bunin/react-native-micro-frontend-cli init
```

```ts
import { defineReactNativeMicroFrontendConfig } from "@bunin/react-native-micro-frontend";

export default defineReactNativeMicroFrontendConfig({
  ota: {
    enabled: true,
    provider: "hot-updater",
    mode: "manual",
  },

  nativeChangePolicy: "ask",

  packageManager: {
    supported: ["bun", "deno", "npm", "pnpm", "yarn"],
    strategy: "follow-host",
  },

  mfes: {},
});
```

## 문서 홈페이지

문서 홈페이지는 `apps/docs-site`에 있으며 Vite, Vike, Panda CSS, React, Three.js로 구성했습니다.

```bash
bun run docs:dev
bun run docs:typecheck
bun run docs:build
bun run docs:preview
```

의미:

- `/`는 Three.js module-network hero가 있는 홈페이지입니다.
- `/docs`는 처음 사용하는 사람을 위한 시작 경로입니다.
- `/docs/hot-updater`는 Hot Updater 설정 전용 route입니다.
- `/docs/package-managers`는 Bun, npm, pnpm, Yarn, Deno 명령을 정리합니다.
- `/docs/ko`, `/docs/zh-cn`, `/docs/ja`는 다국어 entry page입니다.

## 왜 필요한가?

React Native에는 OTA 가능한 영역과 반드시 앱스토어/플레이스토어 배포가 필요한 영역이 함께 있습니다.

```txt
JS / assets / styles / business logic
  -> 보통 OTA 가능

Pods / Gradle / AndroidManifest / Info.plist / RN version / Hermes / New Architecture
  -> 새 native binary 필요
```

이 라이브러리는 두 영역을 강제로 분리합니다. MFE마다 registry와 native contract를 만들고, 배포 전에 Host App 바이너리와 호환되는지 확인합니다.

## 패키지 구조

```txt
packages/
  core/
    public type, config helper, registry model, OTA 판단, package manager 감지

  cli/
    rnm CLI 명령어

  native-contract/
    package.json, Podfile.lock, Gradle, AndroidManifest, RN/Hermes/New Architecture 분석

  hot-updater-adapter/
    Hot Updater 감지, wrapper metadata, deploy command 생성

  metro-adapter/
    Metro 설정 감지, MFE bundle command 생성

  react-native-runtime/
    runtime registry, Provider, hook, screen fallback 정책

  integration/
    기존 Host App 분석, generated file, manual guide, safe patch, rollback helper

  config/
    CLI/CI용 JSON config loader
```

## 로컬 실행

```bash
bun install
bun test
bun run typecheck
bun run build
```

의미:

- `bun test`: OTA 판단, native hash, native diff, package manager 감지 회귀 테스트를 실행합니다.
- `bun run typecheck`: 모든 패키지의 TypeScript 타입을 검증합니다.
- `bun run build`: 각 패키지의 `dist/` 산출물과 declaration 파일을 생성합니다.


## 패키지 매니저 지원

이 프로젝트는 **Bun 우선**이지만 Bun 전용은 아닙니다.

“패키지 매니저 지원”은 두 가지 의미로 나뉩니다.

1. **사용자 프로젝트 지원**: host app 또는 MFE가 `bun`, `npm`, `pnpm`, `yarn`, `deno`로 패키지를 설치하고 CLI를 실행할 수 있습니다.
2. **저장소 배포 지원**: 이 monorepo의 실제 release engine은 Bun이고, `bun`, `npm`, `pnpm`, `yarn`, `deno task`에서 같은 release script를 호출할 수 있습니다.

### Runtime 패키지 설치

```bash
# Bun
bun add @bunin/react-native-micro-frontend

# npm
npm install @bunin/react-native-micro-frontend

# pnpm
pnpm add @bunin/react-native-micro-frontend

# Yarn
yarn add @bunin/react-native-micro-frontend

# Deno
deno add npm:@bunin/react-native-micro-frontend
```

의미:

- `@bunin/react-native-micro-frontend`에는 config helper, registry model, OTA gate, runtime export가 들어 있습니다.
- Deno는 npm registry 패키지에 `npm:` specifier를 사용합니다.
- React Native 자체는 host app에 이미 있어야 합니다.

### 전역 설치 없이 CLI 실행

```bash
# Bun
bunx @bunin/react-native-micro-frontend-cli init

# npm
npx @bunin/react-native-micro-frontend-cli init

# pnpm
pnpm dlx @bunin/react-native-micro-frontend-cli init

# Yarn 2+
yarn dlx @bunin/react-native-micro-frontend-cli init

# Deno
deno run -A npm:@bunin/react-native-micro-frontend-cli init
```

의미:

- 모든 명령은 같은 `rnm` CLI 패키지를 실행합니다.
- `init`은 generated integration file을 만들지만 native file을 몰래 수정하지 않습니다.
- Deno는 프로젝트 파일을 읽고 쓰기 때문에 `-A` 권한이 필요합니다.

### CLI를 devDependency로 설치

```bash
# Bun
bun add -d @bunin/react-native-micro-frontend-cli

# npm
npm install --save-dev @bunin/react-native-micro-frontend-cli

# pnpm
pnpm add -D @bunin/react-native-micro-frontend-cli

# Yarn
yarn add -D @bunin/react-native-micro-frontend-cli

# Deno
deno add --package-json --dev npm:@bunin/react-native-micro-frontend-cli
```

의미:

- CI에서 CLI 버전을 고정해야 할 때 devDependency 설치가 좋습니다.
- `deno add --package-json --dev`는 Deno 2.8+에서 CLI를 `package.json` devDependencies에 기록합니다.
- CLI binary 이름은 `rnm`입니다.
- package manager detection은 host project 설정과 lockfile을 기준으로 계속 동작합니다.

### 패키지 매니저 감지 순서

```txt
1. explicit --package-manager flag
2. MFE local config
3. host config
4. lockfiles: bun.lockb, bun.lock, deno.json, deno.jsonc, package-lock.json, npm-shrinkwrap.json, pnpm-lock.yaml, yarn.lock
5. packageManager field in package.json
6. npm fallback
```

의미:

- CLI에서 직접 지정한 값이 항상 우선합니다.
- lockfile은 `packageManager` 문자열보다 강한 증거로 봅니다.
- host/MFE 패키지 매니저가 달라도 허용하지만 integration risk로 보고합니다.

### `rnm publish`가 생성하는 OTA 배포 명령

```bash
rnm publish mfe-feature --package-manager bun
rnm publish mfe-feature --package-manager npm
rnm publish mfe-feature --package-manager pnpm
rnm publish mfe-feature --package-manager yarn
rnm publish mfe-feature --package-manager deno
```

생성되는 Hot Updater 명령:

```bash
bunx hot-updater deploy -p ios -c production
npx hot-updater deploy -p ios -c production
pnpm dlx hot-updater deploy -p ios -c production
yarn dlx hot-updater deploy -p ios -c production
deno run -A npm:hot-updater deploy -p ios -c production
```

의미:

- `rnm publish`는 먼저 OTA safety gate를 통과해야 합니다.
- native contract mismatch가 있으면 배포 명령을 출력하기 전에 OTA를 막습니다.
- package manager는 Hot Updater를 실행하는 방식만 바꿉니다.

### 저장소 release script 동일 명령

```bash
# Bun, 권장
bun run release:dry-run
bun run release:publish

# npm
npm run release:dry-run
npm run release:publish

# pnpm
pnpm release:dry-run
pnpm release:publish

# Yarn
yarn release:dry-run
yarn release:publish

# Deno task
deno task release:dry-run
deno task release:publish
```

의미:

- 모든 진입점은 같은 release workflow를 호출합니다.
- workflow 내부는 test, build, pack, publish 모두 Bun을 사용합니다.
- CI에서 외부 명령을 `npm`, `pnpm`, `yarn`, `deno task`로 실행해도 Bun은 설치되어 있어야 합니다.
- `pnpm-workspace.yaml`과 `.npmrc`가 있어서 repository의 preferred `packageManager`가 Bun이어도 pnpm을 사용할 수 있습니다.

## CLI 예제

### 1. Host App 초기화

```bash
rnm init
```

의미:

- `react-native-micro-frontend.config.ts` 생성
- `rnm.registry.json` 생성
- `rnm.native-contract.json` 생성
- `ios/Podfile.rnm.generated.rb` 같은 generated include 파일 생성
- 기존 Podfile, Gradle, Metro 파일은 조용히 수정하지 않음

Dry-run:

```bash
rnm init --dry-run
```

의미:

- 어떤 파일이 필요한지만 출력
- 아무 파일도 쓰지 않음
- 첫 도입 전 안전 점검에 사용

### 2. MFE 등록

```bash
rnm add mfe-feature \
  --path ../mfe-feature \
  --entry ./src/index.tsx \
  --version 1.0.0 \
  --ota-mode manual \
  --ota-provider hot-updater
```

의미:

- `mfe-feature`를 `rnm.registry.json`에 등록합니다.
- `entry`는 Metro bundle 시작점입니다.
- OTA는 켜져 있어도 native contract가 맞지 않으면 나중에 차단됩니다.

### 3. OTA 가능 여부 검증

```bash
rnm verify mfe-feature
```

의미:

- registry 상태 확인
- MFE blocked 상태 확인
- `nativeHash`가 Host와 다른지 확인
- OTA가 안전하지 않으면 non-zero exit code 반환

### 4. Native contract 비교

```bash
rnm diff mfe-feature
```

의미:

- Host의 `rnm.native-contract.json` 읽기
- MFE의 `../mfe-feature/rnm.native-contract.json` 읽기
- native 변경사항 출력
- Store release 필요 여부 출력

### 5. Native 변경 처리

Native 변경을 반영한 것으로 표시하고 OTA를 끄는 경우:

```bash
rnm sync mfe-feature --apply-native
```

의미:

- MFE를 active 상태로 둡니다.
- 이 MFE 버전의 OTA를 비활성화합니다.
- “OTA DISABLED” 경고 박스를 출력합니다.

Native 변경을 거부하고 MFE를 막는 경우:

```bash
rnm sync mfe-feature --block-native
```

의미:

- MFE를 blocked 상태로 표시합니다.
- Runtime load 차단
- OTA publish 차단

### 6. Metro bundle command 생성

```bash
rnm build mfe-feature \
  --platform ios \
  --type ota \
  --entry ./src/index.tsx
```

의미:

- Metro 기반 `react-native bundle` 명령을 출력합니다.
- Re.Pack을 사용하지 않습니다.
- 실행과 command 생성을 분리해 CI에서 검토할 수 있게 합니다.

### 7. Hot Updater publish command 생성

```bash
rnm publish mfe-feature \
  --package-manager pnpm \
  --channel production
```

의미:

- 먼저 OTA eligibility gate를 실행합니다.
- nativeHash mismatch 또는 blocked 상태면 실패합니다.
- 안전할 때만 Hot Updater deploy command를 출력합니다.

## 설정 예제

```ts
import { defineReactNativeMicroFrontendConfig } from "@bunin/react-native-micro-frontend";

export default defineReactNativeMicroFrontendConfig({
  reactNative: {
    minVersion: "0.70.0",
    hermes: "required",
    newArchitecture: "supported",
  },

  ota: {
    enabled: true,
    provider: "hot-updater",
    mode: "manual",
    existingHotUpdater: {
      strategy: "reuse",
      configPath: "./hot-updater.config.ts",
    },
  },

  nativeChangePolicy: "ask",

  packageManager: {
    supported: ["bun", "deno", "npm", "pnpm", "yarn"],
    strategy: "follow-host",
  },

  package: {
    sync: "manual",
    sharedStrategy: "strict-singleton",
  },

  ios: {
    pods: "manual",
  },

  android: {
    integration: "manual",
  },

  mfes: {},
});
```

의미:

- React Native `0.70+`를 최소 기준으로 둡니다.
- Hermes와 New Architecture는 native contract에 포함됩니다.
- Hot Updater는 재사용하고, 이 라이브러리가 대체하지 않습니다.
- package manager 전략을 명시합니다.
- native 통합은 generated file과 수동 확인을 우선합니다.

## Runtime 예제

```tsx
import {
  MicroFrontendProvider,
  MicroFrontendScreen,
} from "@bunin/react-native-micro-frontend/runtime";

export function App({ registry }) {
  return (
    <MicroFrontendProvider registry={registry}>
      <MicroFrontendScreen
        name="mfe-feature"
        fallback={<Loading />}
      />
    </MicroFrontendProvider>
  );
}
```

의미:

- Host App이 registry를 어디서 읽을지 결정합니다.
- runtime은 blocked 또는 nativeHash mismatch MFE를 거부합니다.
- 안전하지 않거나 아직 로드할 수 없으면 fallback을 보여줍니다.


## Host 제공 전역 상태 가져오기

Host에서 MFE로 session identity, locale, feature flag, tenant, experiment bucket, analytics context처럼 작은 read-oriented 상태를 내려줄 때는 `sharedState`를 사용합니다.

패턴은 두 단계입니다.

1. Host가 typed snapshot을 `MicroFrontendProvider`에 전달합니다.
2. MFE가 `useMicroFrontendSharedState<T>()`로 그 snapshot을 읽습니다.

```tsx
import {
  MicroFrontendProvider,
  useMicroFrontendSharedState,
} from "@bunin/react-native-micro-frontend/runtime";

export type HostSharedState = {
  readonly session?: {
    readonly userId: string;
  };
  readonly locale: "en-US" | "ko-KR" | "zh-CN" | "ja-JP";
  readonly featureFlags: Readonly<Record<string, boolean>>;
  readonly tenant?: {
    readonly id: string;
  };
};

const sharedState: HostSharedState = {
  session: {
    userId: "user_123",
  },
  locale: "ko-KR",
  featureFlags: {
    checkoutV2: true,
    profileMfe: true,
  },
  tenant: {
    id: "bunin",
  },
};

export function HostRoot({ registry }) {
  return (
    <MicroFrontendProvider
      registry={registry}
      sharedState={sharedState}
    >
      <FeatureShell />
    </MicroFrontendProvider>
  );
}

export function FeatureModuleHeader() {
  const host = useMicroFrontendSharedState<HostSharedState>();
  const userId = host.session?.userId ?? "guest";
  const checkoutV2 = host.featureFlags.checkoutV2 ?? false;

  return (
    <Text>
      {host.locale} · {userId} · checkoutV2={String(checkoutV2)}
    </Text>
  );
}
```

의미:

- source of truth는 Host에 남깁니다.
- MFE는 Host store를 직접 import하지 않고 runtime hook으로 전역 상태를 가져옵니다.
- Host와 MFE가 함께 import할 수 있는 작은 shared contract package 또는 file에 `HostSharedState` type을 둡니다.
- 변경은 Host command, callback, event로 되돌려 보내는 구조가 안전합니다.
- 큰 cache, secret, native-only handle은 `sharedState`에 넣지 않습니다.

## Hot Updater 설정 페이지

문서 사이트의 `/docs/hot-updater` route에서 Hot Updater 설정 방법을 따로 설명합니다. 기존 Hot Updater를 OTA delivery engine으로 유지하고, `withReactNativeMicroFrontend`로 metadata를 감싼 뒤, native safety check가 통과할 때만 publish command를 생성하는 흐름입니다.

## OTA 판단 규칙

```txt
if ota.enabled === false
  -> OTA 차단

else if React Native version changed
  -> OTA 차단
  -> Store release 필요

else if Hermes setting changed
  -> OTA 차단
  -> Store release 필요

else if New Architecture setting changed
  -> OTA 차단
  -> Store release 필요

else if native files/dependencies changed
  -> OTA 차단
  -> Store release 필요

else if nativeHash mismatched
  -> OTA 차단
  -> Store release 필요

else if MFE is blocked
  -> OTA 차단
  -> runtime load 차단

else
  -> OTA 가능
```

## nativeHash 구성요소

```txt
nativeHash = hash(
  package native dependencies
  + Podfile.lock relevant pods
  + Gradle projects and dependencies
  + AndroidManifest permissions
  + Info.plist keys
  + React Native version
  + Hermes flag
  + New Architecture flag
)
```

의미:

- JS-only 변경은 OTA 가능할 수 있습니다.
- native ABI 또는 native dependency 변경은 JS 교체만으로 해결할 수 없습니다.
- nativeHash mismatch는 Host binary와 MFE bundle의 native 가정이 다르다는 뜻입니다.

## Re.Pack 정책

Re.Pack은 사용하지 않습니다.

```txt
허용:
  Metro bundle generation
  Hot Updater OTA delivery
  native contract verification
  runtime registry loading

금지:
  @callstack/repack
  Webpack Module Federation
  Re.Pack remote chunk runtime
```

## 한 번에 버전 관리하고 배포하기

publish 대상 패키지는 모두 같은 버전으로 관리합니다. 각 패키지의 `package.json`을 직접 따로 수정하지 말고 루트 스크립트를 사용합니다.

### 모든 패키지 버전 지정 또는 bump

아래 예시는 Bun을 먼저 보여줍니다. 이 프로젝트의 권장 workflow가 Bun이기 때문입니다. 같은 release script는 `npm`, `pnpm`, `yarn`, `deno task`로도 호출할 수 있습니다.

```bash
bun run version:all 0.2.0
bun run version:all patch
bun run version:all minor
bun run version:all major
```

동일한 명령:

```bash
npm run version:all -- 0.2.0
pnpm version:all 0.2.0
yarn version:all 0.2.0
deno task version:all 0.2.0
```


의미:

- 루트 버전 변경
- 모든 `packages/*/package.json` 버전 변경
- 내부 패키지 의존성 버전도 함께 변경
- 패키지는 나뉘어 있어도 하나의 release version으로 관리

### 전체 검증과 pack

```bash
bun run release:check
```

의미:

- 테스트 실행
- TypeScript typecheck 실행
- 전체 빌드 실행
- `bun pm pack`으로 `.npm-pack/`에 npm 호환 tarball 생성

### 전체 registry publish dry-run

```bash
bun run release:dry-run
```

의미:

- 전체 release check 실행
- 모든 패키지에 대해 `bun publish --dry-run` 실행
- 실제 npm registry 배포는 하지 않음

### 실제 배포

```bash
# 먼저 ~/.npmrc 토큰 등 npm registry 인증을 설정하세요.
bun run release:publish
```

의미:

- 전체 release check를 다시 실행
- 의존성 순서대로 모든 패키지를 npm registry에 publish
- publish 스크립트는 `bun publish --cwd <package>`를 사용하며 기본 옵션은 `--access public --tag latest`

## 라이선스

MIT.

Beerware 감성은 좋지만 실제 package license는 npm 사용자, 회사, 자동 compliance tool이 부담 없이 채택할 수 있도록 MIT로 유지합니다. 그래도 이 라이브러리가 release를 구했다면 맥주 한 잔 사주는 마음은 언제나 환영입니다.
