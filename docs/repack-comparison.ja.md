# RNM vs Re.Pack

このページは **2026-05-28** に確認した公開 baseline に基づき、`@bunin/react-native-micro-frontend`（RNM）と Re.Pack を比較します。

## Quick comparison

| Question | RNM を選ぶ場合 | Re.Pack を選ぶ場合 |
| --- | --- | --- |
| Bundler seam | Metro-first を維持したい。 | Rspack/Webpack を app bundler にしたい。 |
| Microfrontend model | Registry + Host-owned loader で十分。 | Module Federation v2 remotes/chunks が必要。 |
| OTA safety | Native-contract gate で unsafe JS delivery を止めたい。 | App/team が native compatibility rules を所有する。 |
| Operations | Runtime moving parts を減らしたい。 | Remote chunk/cache/CDN/federation operations を受け入れる。 |
| Best fit | Metro artifact 周辺の native-safe OTA/archive。 | Runtime composition と code-splitting が core architecture。 |

## Capability map

| Capability | RNM でできること | Re.Pack でできること | できないこと / 注意 |
| --- | --- | --- | --- |
| Metro-first bundle archive | 可能です。`rnm bundle` が Metro `index.bundle`、`manifest.json`、参照 assets、任意の `.tar.gz` archive を生成します。 | 主経路ではありません。Re.Pack は Rspack/Webpack output と runtime chunks を使います。 | RNM は Metro archive を Module Federation remote に変換しません。 |
| Native-contract OTA gate | 可能です。RNM は native assumptions を capture し、unsafe OTA/runtime load を block します。 | Re.Pack runtime の周辺で app/team policy として設計する必要があります。 | RNM も native change を OTA-safe にはしません。native change は store release が必要です。 |
| Module Federation remotes | 対応しません。 | 対応します。Re.Pack の core microfrontend model です。 | RNM は Webpack Module Federation や remote chunk containers を実行しません。 |
| Rspack/Webpack plugin ecosystem | 対応しません。RNM は Metro-first です。 | 対応します。Re.Pack は Rspack/Webpack config、plugins、loaders、chunking を提供します。 | RNM は Metro を Rspack/Webpack に置き換えません。 |
| Host-owned delivery loader | 可能です。Host が Hot Updater、Expo EAS Update、embedded bundle、bundle archive、custom loader を選びます。 | Re.Pack は script runtime と federation loading flow を提供します。 | RNM 自体は CDN policy、JavaScript evaluation、remote integrity を所有しません。 |
| Shared dependency policy | Metro alias/watchFolders で Host/MFE package sharing を補強します。 | Module Federation shared dependency negotiation を提供します。 | RNM は federation shared dependency negotiation を行いません。 |

## 現在の基準

| Package | 確認した latest version |
| --- | --- |
| `@bunin/react-native-micro-frontend` | `0.7.0` |
| `react-native` | `0.85.3` |
| `@callstack/repack` | `5.2.5` |

基準：

- React Native 0.85 は official React Native release blog の current stable line です。
- Re.Pack website は 5.x を latest documentation track としています。
- Re.Pack 5.x は Rspack/Webpack powered な React Native build tool で、Module Federation v2 を support します。
- RNM は Metro-first を維持し、`@callstack/repack` に依存しません。

## 詳細 overview

Metro を維持し、OTA/runtime load の前に native compatibility を検証し、実際の bundle loader を Host App が所有したい場合は **RNM** を選びます。

Rspack/Webpack、Module Federation、remote chunks、code splitting、Webpack/Rspack plugin workflow が architecture requirement の場合は **Re.Pack** を選びます。

## 詳細 architecture comparison

| Concern | RNM | Re.Pack |
| --- | --- | --- |
| Primary role | Native-safety、registry、integration、loader orchestration layer | React Native bundler/runtime replacement |
| Bundler | Default Metro。`withMfe` が Metro config を補強 | Metro の代わりに Rspack または Webpack |
| Microfrontend split | `rnm.registry.json` + Host-owned loader | Module Federation v2 remotes/chunks |
| Artifact style | Metro `index.bundle`、`manifest.json`、参照 assets、`.tar.gz` bundle archive、OTA URL、embedded bundle | Federated modules、remote chunks/containers、script runtime cache |
| Native safety | React Native version、Hermes、New Architecture、native dependencies、Podfile/Gradle/manifest inputs を native contract hash で gate | App/team が native compatibility policy を設計し強制する必要あり |
| Delivery engine | Hot Updater、Expo EAS Update、bundle archive、embedded bundle、custom Host loader | Re.Pack script runtime と Module Federation loading flow |
| Dependency | `@bunin/*` packages | `@callstack/repack` と bundler ecosystem |

## RNM が意図的にしないこと

RNM は Re.Pack の install、Metro replacement、Webpack Module Federation の実行、remote chunks の管理をしません。提供するものは次の通りです。

- Host/MFE registry と status policy。
- Native contract generation、diff、OTA blocking。
- Reviewable な package、iOS、Android、Expo integration helpers。
- Metro `withMfe` shared dependency wiring。
- Metro output からの portable bundle archives。
- Host-owned loader を呼び出す runtime APIs。

```txt
RNM flow
register MFE
  -> calculate native contract
  -> block unsafe OTA/runtime load
  -> Host loader fetches/evaluates the chosen artifact
```

## Re.Pack が最適化すること

Bundler/runtime composition 自体が product requirement の場合、Re.Pack がより合います。

- Metro を Rspack/Webpack に置き換える。
- Module Federation v2 で mobile microfrontend を構成する。
- JS または Hermes bytecode を小さな chunks に分割する。
- Runtime で remote modules を on-demand download する。
- Webpack/Rspack plugins、loaders、tree-shaking、Re.Pack dev server/runtime features を使う。

```txt
Re.Pack flow
configure Rspack/Webpack
  -> expose/consume federated modules
  -> load remote chunks at runtime
  -> app team owns native compatibility and remote integrity policy
```

## バランスの取れた批判: Webpack/Rspack layer のコスト

Re.Pack は正当に評価されるべき技術です。これまで React Native micro frontend 領域で実質的な標準に近い選択肢であり、Module Federation style の composition、remote chunk loading、成熟した bundler ecosystem を mobile runtime に持ち込んだ点は大きな engineering achievement です。その成果には敬意を払うべきです。

一方で、その強力さの代償として React Native app に追加の Rspack/Webpack layer を受け入れる必要があります。これは単なる config file ではなく、Metro の横にもう一つの build model、runtime loading model、運用 surface を置くという判断です。

- Team は Metro と React Native に加えて、Rspack/Webpack config、loader/plugin、chunk output、Module Federation shared dependency policy を理解する必要があります。
- Production failure の原因が federation contract、remote manifest、chunk cache、CDN state、shared-module negotiation に移ることがあります。
- Release governance は chunk integrity、rollback、cache invalidation、independently loaded code の native compatibility まで扱う必要があります。
- 必要なのが native-safe OTA または portable Metro artifact だけなら、この bundler layer は leverage ではなく architecture weight になり得ます。

つまり主張は「Re.Pack が悪い」ではありません。Re.Pack はより強力で、より重い architecture です。RNM はより狭い問題、つまり Metro を維持し、native-contract gate を追加し、Host が simple loader boundary を所有することに意図的に集中します。

## 組み合わせられるか？

意図的な custom Host loader architecture の場合だけ可能です。

RNM は `createMicroFrontendLoader()` を呼ぶ前に module を gate できます。Host は理論上その loader を Re.Pack-aware runtime で実装できます。この設計では Host team が次を明示的に所有する必要があります。

- remote chunk integrity と signing;
- cache invalidation;
- Module Federation shared dependency policy;
- すべての remote の native contract capture;
- rollback と blocked-module behavior;
- release/OTA promotion rules.

安易に混在させないでください。Module Federation が central architecture なら Re.Pack から始めます。Native-safe Metro/OTA governance が central architecture なら RNM から始めます。
