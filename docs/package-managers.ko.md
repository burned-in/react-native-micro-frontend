# 패키지 매니저 매트릭스

이 프로젝트는 Bun 우선이며 사용자 workflow에서 `bun`, `npm`, `pnpm`, `yarn`, `deno`를 지원합니다.

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
| 전체 버전 변경 | `bun run version:all 0.2.0` | `npm run version:all -- 0.2.0` | `pnpm version:all 0.2.0` | `yarn version:all 0.2.0` | `deno task version:all 0.2.0` |
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
