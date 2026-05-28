# RNM vs Re.Pack

이 문서는 **2026-05-28**에 확인한 최신 공개 기준으로 `@bunin/react-native-micro-frontend`(RNM)와 Re.Pack을 비교합니다.

## 빠른 비교

| 질문 | RNM을 선택할 때 | Re.Pack을 선택할 때 |
| --- | --- | --- |
| Bundler seam | Metro-first를 유지하고 싶을 때. | Rspack/Webpack을 app bundler로 쓰고 싶을 때. |
| Microfrontend model | Registry + Host-owned loader로 충분할 때. | Module Federation v2 remotes/chunks가 필요할 때. |
| OTA safety | Native-contract gate로 unsafe JS delivery를 막아야 할 때. | App/team이 native compatibility rule을 직접 소유할 때. |
| Operations | Runtime moving parts를 줄이고 싶을 때. | Remote chunk/cache/CDN/federation 운영을 받아들일 때. |
| Best fit | Metro artifact 주변의 native-safe OTA/archive. | Runtime composition과 code-splitting이 core architecture일 때. |

## Capability map

| Capability | RNM이 되는 것 | Re.Pack이 되는 것 | 안 되는 것 / 주의 |
| --- | --- | --- | --- |
| Metro-first bundle archive | 됩니다. `rnm bundle`이 Metro `index.bundle`, `manifest.json`, 참조 asset, 선택적 `.tar.gz` archive를 만듭니다. | 주력 경로는 아닙니다. Re.Pack은 Rspack/Webpack output과 runtime chunk를 사용합니다. | RNM은 Metro archive를 Module Federation remote로 바꾸지 않습니다. |
| Native-contract OTA gate | 됩니다. RNM은 native assumption을 capture하고 unsafe OTA/runtime load를 막습니다. | Re.Pack runtime 주변에 app/team policy로 설계해야 합니다. | RNM도 native change를 OTA-safe로 만들지는 않습니다. native change는 Store release가 필요합니다. |
| Module Federation remote | 안 됩니다. | 됩니다. Re.Pack의 core microfrontend model입니다. | RNM은 Webpack Module Federation이나 remote chunk container를 실행하지 않습니다. |
| Rspack/Webpack plugin ecosystem | 안 됩니다. RNM은 Metro-first입니다. | 됩니다. Re.Pack은 Rspack/Webpack config, plugin, loader, chunking을 제공합니다. | RNM은 Metro를 Rspack/Webpack으로 대체하지 않습니다. |
| Host-owned delivery loader | 됩니다. Host가 Hot Updater, Expo EAS Update, embedded bundle, bundle archive, custom loader를 선택합니다. | Re.Pack은 자체 script runtime과 federation loading flow를 제공합니다. | RNM은 CDN policy, JavaScript evaluation, remote integrity를 자체적으로 소유하지 않습니다. |
| Shared dependency policy | Metro alias/watchFolders로 Host/MFE package sharing을 보강합니다. | Module Federation shared dependency negotiation을 제공합니다. | RNM은 federation shared dependency negotiation을 하지 않습니다. |

## 최신 기준

| Package | 확인한 최신 version |
| --- | --- |
| `@bunin/react-native-micro-frontend` | `0.7.0` |
| `react-native` | `0.85.3` |
| `@callstack/repack` | `5.2.5` |

기준:

- React Native 0.85는 공식 React Native release blog의 current stable line입니다.
- Re.Pack website는 5.x를 latest documentation track으로 표시합니다.
- Re.Pack 5.x는 Rspack/Webpack 기반 React Native build tool이며 Module Federation v2를 지원합니다.
- RNM은 Metro-first를 유지하며 `@callstack/repack`에 의존하지 않습니다.

## 상세 개요

**RNM**은 Metro를 유지하고, OTA/runtime load 전에 native compatibility를 검증하며, 실제 bundle loader를 Host App이 소유하게 만들고 싶을 때 선택합니다.

**Re.Pack**은 Rspack/Webpack, Module Federation, remote chunks, code splitting, Webpack/Rspack plugin workflow가 architecture requirement일 때 선택합니다.

## 상세 아키텍처 비교

| Concern | RNM | Re.Pack |
| --- | --- | --- |
| 주요 역할 | Native-safety, registry, integration, loader orchestration layer | React Native bundler/runtime replacement |
| Bundler | 기본 Metro; `withMfe`가 Metro config 보강 | Metro 대신 Rspack 또는 Webpack |
| Microfrontend split | `rnm.registry.json` + Host-owned loader | Module Federation v2 remotes/chunks |
| Artifact style | Metro `index.bundle`, `manifest.json`, 참조 asset, `.tar.gz` bundle archive, OTA URL, embedded bundle | Federated modules, remote chunks/containers, script runtime cache |
| Native safety | React Native version, Hermes, New Architecture, native dependencies, Podfile/Gradle/manifest input을 native contract hash로 gate | App/team이 native compatibility policy를 직접 설계하고 강제해야 함 |
| Delivery engine | Hot Updater, Expo EAS Update, bundle archive, embedded bundle, custom Host loader | Re.Pack script runtime과 Module Federation loading flow |
| Dependency | `@bunin/*` packages | `@callstack/repack`과 bundler ecosystem |

## RNM이 의도적으로 하지 않는 것

RNM은 Re.Pack 설치, Metro 교체, Webpack Module Federation 실행, remote chunk 관리를 하지 않습니다. RNM이 제공하는 것은 다음입니다.

- Host/MFE registry와 status policy.
- Native contract 생성, diff, OTA blocking.
- Review 가능한 package, iOS, Android, Expo integration helper.
- Metro `withMfe` shared dependency wiring.
- Metro output 기반 portable bundle archive.
- Host-owned loader를 호출하는 runtime API.

```txt
RNM flow
register MFE
  -> calculate native contract
  -> block unsafe OTA/runtime load
  -> Host loader fetches/evaluates the chosen artifact
```

## Re.Pack이 최적화하는 것

Re.Pack은 bundler/runtime composition 자체가 product requirement일 때 더 잘 맞습니다.

- Metro를 Rspack/Webpack으로 대체.
- Module Federation v2로 mobile microfrontend 구성.
- JS 또는 Hermes bytecode를 작은 chunk로 분리.
- Runtime에서 remote module을 on-demand download.
- Webpack/Rspack plugin, loader, tree-shaking, Re.Pack dev server/runtime 기능 활용.

```txt
Re.Pack flow
configure Rspack/Webpack
  -> expose/consume federated modules
  -> load remote chunks at runtime
  -> app team owns native compatibility and remote integrity policy
```

## 균형 잡힌 비판: Webpack/Rspack 계층의 비용

Re.Pack은 분명히 인정받아야 할 기술입니다. 지금까지 React Native micro frontend 영역에서 사실상 표준으로 자리 잡아온 선택지였고, mobile runtime에 Module Federation 스타일 composition, remote chunk loading, 성숙한 bundler ecosystem을 가져온 점은 대단한 engineering achievement입니다. 그 점에는 찬사를 보냅니다.

다만 그 강력함의 대가는 React Native app 안에 Rspack/Webpack 계층을 추가로 받아들여야 한다는 점입니다. 이는 단순한 config file 하나가 아니라 Metro 옆에 또 하나의 build model, runtime loading model, 운영 surface를 두는 결정입니다.

- 팀은 Metro와 React Native뿐 아니라 Rspack/Webpack config, loader/plugin, chunk output, Module Federation shared dependency policy를 이해해야 합니다.
- 운영 장애 원인이 federation contract, remote manifest, chunk cache, CDN state, shared-module negotiation으로 이동할 수 있습니다.
- Release governance는 chunk integrity, rollback, cache invalidation, independently loaded code의 native compatibility까지 포함해야 합니다.
- 필요한 것이 native-safe OTA 또는 portable Metro artifact뿐이라면, 이 bundler 계층은 leverage보다 architecture weight가 될 수 있습니다.

따라서 메시지는 “Re.Pack이 나쁘다”가 아닙니다. Re.Pack은 더 강력하고 더 무거운 architecture입니다. RNM은 그보다 좁은 문제 — Metro를 유지하고, native-contract gate를 추가하고, Host가 단순한 loader boundary를 소유하는 문제 — 에 의도적으로 집중합니다.

## 같이 쓸 수 있나?

의도적인 custom Host loader architecture로만 가능합니다.

RNM은 `createMicroFrontendLoader()`를 호출하기 전에 module을 gate할 수 있고, Host가 이 loader를 Re.Pack-aware runtime으로 구현할 수도 있습니다. 이 경우 Host team은 다음을 명시적으로 소유해야 합니다.

- remote chunk integrity와 signing;
- cache invalidation;
- Module Federation shared dependency policy;
- 모든 remote의 native contract capture;
- rollback과 blocked-module behavior;
- release/OTA promotion rule.

둘을 가볍게 섞지 마세요. Module Federation이 중심 architecture라면 Re.Pack에서 시작하세요. Native-safe Metro/OTA governance가 중심 architecture라면 RNM에서 시작하세요.
