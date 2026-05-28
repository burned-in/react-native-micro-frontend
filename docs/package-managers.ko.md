# 패키지 매니저와 CLI 명령어

이 프로젝트는 Bun 우선이며 사용자 workflow에서 `bun`, `npm`, `pnpm`, `yarn`, `deno`를 지원합니다. 이 문서는 integration, watcher, bundle, verify, publish 흐름에 추가된 RNM CLI 명령어도 모두 정리합니다.

## 패키지 설치

| 도구 | Runtime 패키지 | CLI 패키지 |
| --- | --- | --- |
| Bun | `bun add @bunin/react-native-micro-frontend` | `bun add -d @bunin/react-native-micro-frontend-cli` |
| npm | `npm install @bunin/react-native-micro-frontend` | `npm install --save-dev @bunin/react-native-micro-frontend-cli` |
| pnpm | `pnpm add @bunin/react-native-micro-frontend` | `pnpm add -D @bunin/react-native-micro-frontend-cli` |
| Yarn | `yarn add @bunin/react-native-micro-frontend` | `yarn add -D @bunin/react-native-micro-frontend-cli` |
| Deno | `deno add npm:@bunin/react-native-micro-frontend` | `deno add --package-json --dev npm:@bunin/react-native-micro-frontend-cli` |

## 전역 설치 없이 CLI 실행

| 도구 | 명령 |
| --- | --- |
| Bun | `bunx @bunin/react-native-micro-frontend-cli init` |
| npm | `npx @bunin/react-native-micro-frontend-cli init` |
| pnpm | `pnpm dlx @bunin/react-native-micro-frontend-cli init` |
| Yarn 2+ | `yarn dlx @bunin/react-native-micro-frontend-cli init` |
| Deno | `deno run -A npm:@bunin/react-native-micro-frontend-cli init` |

## 저장소 release 명령

| 작업 | Bun | npm | pnpm | Yarn | Deno task |
| --- | --- | --- | --- | --- | --- |
| 전체 버전 변경 | `bun run version:all 0.7.0` | `npm run version:all -- 0.7.0` | `pnpm version:all 0.7.0` | `yarn version:all 0.7.0` | `deno task version:all 0.7.0` |
| 검증 | `bun run release:check` | `npm run release:check` | `pnpm release:check` | `yarn release:check` | `deno task release:check` |
| 배포 dry-run | `bun run release:dry-run` | `npm run release:dry-run` | `pnpm release:dry-run` | `yarn release:dry-run` | `deno task release:dry-run` |
| 실제 배포 | `bun run release:publish` | `npm run release:publish` | `pnpm release:publish` | `yarn release:publish` | `deno task release:publish` |

저장소 release workflow 내부는 test, build, pack, publish 모두 Bun을 사용합니다. 외부 명령이 다른 패키지 매니저여도 CI에는 Bun을 설치해야 합니다.

`pnpm-workspace.yaml`과 `.npmrc`가 있어서 repository의 preferred `packageManager`가 Bun이어도 pnpm을 사용할 수 있습니다.

## `rnm publish`가 출력하는 OTA 배포 명령

| `--package-manager` | Hot Updater 명령 |
| --- | --- |
| `bun` | `bunx hot-updater deploy -p ios -c production` |
| `npm` | `npx hot-updater deploy -p ios -c production` |
| `pnpm` | `pnpm dlx hot-updater deploy -p ios -c production` |
| `yarn` | `yarn dlx hot-updater deploy -p ios -c production` |
| `deno` | `deno run -A npm:hot-updater deploy -p ios -c production` |

`rnm publish`는 OTA eligibility를 통과한 뒤에만 배포 명령을 출력합니다.

Expo EAS Update는 `rnm expo` 또는 `rnm publish --provider expo`로 사용할 수 있습니다.

| `--package-manager` | Expo EAS Update 명령 |
| --- | --- |
| `bun` | `bunx eas-cli@latest update --channel production --message 'RNM mfe-feature@1.0.0' --platform all` |
| `npm` | `npx eas-cli@latest update --channel production --message 'RNM mfe-feature@1.0.0' --platform all` |
| `pnpm` | `pnpm dlx eas-cli@latest update --channel production --message 'RNM mfe-feature@1.0.0' --platform all` |
| `yarn` | `yarn dlx eas-cli@latest update --channel production --message 'RNM mfe-feature@1.0.0' --platform all` |
| `deno` | `deno run -A npm:eas-cli update --channel production --message 'RNM mfe-feature@1.0.0' --platform all` |

EAS workflow가 필요로 하면 `--branch`, `--auto`, `--environment`, `--non-interactive` 옵션을 같이 쓰세요.

## Bundle archive 명령

CLI를 설치한 뒤 MFE project에서 실행하세요. React Native bundling을 실행하고 참조된 runtime asset을 자동 수집한 뒤 `index.bundle`, `manifest.json`, 검증된 asset 파일만 archive로 묶습니다.

```bash
rnm bundle mfe-feature --platform ios --host ../host-app --update-registry --yes
```

최종 tarball 없이 asset 수집 결과만 확인하려면 `rnm bundle-asset mfe-feature --platform ios --entry ./src/index.tsx`를 실행하세요. Dynamic require에는 `--asset-glob`을 fallback으로 사용합니다.

각 runner에서도 같은 방식으로 실행할 수 있습니다: `bunx ... bundle`, `npx ... bundle`, `pnpm dlx ... bundle`, `yarn dlx ... bundle`, `deno run -A ... bundle`. `--host`를 쓰면 CLI가 `rnm.bundle-archives.ts`를 만들고 Host entry import 여부를 묻습니다. `--yes` 또는 `--register-archives`를 주면 자동 적용됩니다.

## RNM CLI 명령어 레퍼런스

설치된 CLI version이 지원하는 정확한 option은 help에서 확인할 수 있습니다.

```bash
rnm --help
rnm help
rnm <command> --help
rnm <command> -h
```

### Host 통합 명령어

| 명령어 | 목적 |
| --- | --- |
| `rnm package <mfe>` | 누락된 JS/native package dependency를 감지하고 확인 후 Host `package.json`에 추가합니다. |
| `rnm aos <mfe>` / `rnm android <mfe>` | Android Gradle project, Gradle dependency, permission을 감지하고 generated Android include file 또는 Expo plugin data를 작성합니다. |
| `rnm ios <mfe>` | iOS Pod를 감지하고 generated Podfile include file 또는 Expo plugin data를 작성합니다. |
| `rnm all <mfe>` | 안전한 순서인 `package -> AOS -> iOS`로 모든 통합을 실행합니다. |
| `rnm integrate all <mfe>` | 기존 호환용 explicit integration route입니다. |
| `rnm expo <mfe>` | 같은 integration watcher와 OTA eligibility gate를 실행한 뒤 Expo EAS Update deploy command를 출력합니다. |

```bash
rnm package mfe-feature --dry-run
rnm aos mfe-feature --yes
rnm android mfe-feature --yes
rnm ios mfe-feature --yes
rnm all mfe-feature --yes
```

### Expo 지원

같은 CLI 명령어가 Expo managed, prebuild, bare/prebuilt Host App을 모두 지원합니다. bare/prebuilt project에서는 generated Podfile/Gradle include file을 작성하고, `ios/` 또는 `android/`가 없는 managed project에서는 `rnm.expo-plugin.cjs`와 `rnm.expo-integration.json`을 만든 뒤 가능한 경우 `app.json`에 plugin을 추가합니다.

```bash
rnm add mfe-feature --path ../mfe-feature --yes
rnm all mfe-feature --yes
npx expo prebuild
```

Expo EAS Update로 배포하려면 MFE를 Expo OTA provider로 등록하고 RNM native-safety gate를 통과한 뒤 EAS deploy command를 출력하세요. `rnm add --ota-provider expo`를 실행하면 package watcher가 `expo`, `expo-updates` 같은 Host 누락 패키지도 보여주고, yes 선택 또는 `--yes`에서 함께 적용합니다.

```bash
rnm add mfe-feature --path ../mfe-feature --ota-provider expo --ota-mode manual --yes
rnm expo mfe-feature --channel production --platform all --non-interactive
# publish로도 같은 route 사용
rnm publish mfe-feature --provider expo --channel production --platform all --non-interactive
```

### 자동 integration watcher

`rnm add`, `rnm bundle --host`, `rnm verify`, `rnm publish`, `rnm expo`는 원래 작업을 계속하기 전에 누락된 `package -> AOS -> iOS` 추가 항목을 감시합니다. 대화형 terminal에서는 적용 여부를 묻습니다.

```bash
rnm add mfe-feature --path ../mfe-feature --yes
rnm bundle mfe-feature --platform ios --host ../host-app --yes
rnm verify mfe-feature --skip-integration
rnm publish mfe-feature --package-manager bun --channel production --skip-integration
rnm expo mfe-feature --channel production --platform all --skip-integration
```

비대화형 자동 적용은 `--yes`, 직접 통합 명령어에서 변경점 확인은 `--dry-run`, add/bundle/verify/publish/expo 원래 동작만 실행하려면 `--skip-integration`을 사용하세요.

### Lifecycle / 진단 명령어

| 명령어 | 목적 |
| --- | --- |
| `rnm init` | review 가능한 Host config, registry, native contract, generated include file을 만듭니다. |
| `rnm build` | React Native bundle command와 선택적 archive output path를 출력합니다. |
| `rnm bundle` | `index.bundle`, `manifest.json`, 실제 참조된 runtime asset만 포함하는 최소 archive를 만듭니다. |
| `rnm diff` | Host와 MFE native contract를 비교합니다. |
| `rnm sync` | MFE block 또는 native change 후 OTA disable 같은 native-change decision을 기록합니다. |
| `rnm status` | `rnm.registry.json`에 등록된 MFE 상태를 출력합니다. |
| `rnm doctor` | project setup을 읽기 전용으로 진단합니다. |
| `rnm rollback` | 기존 file patch 전에 생성된 `.bak` file을 복구합니다. |

