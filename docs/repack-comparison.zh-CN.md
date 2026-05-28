# RNM vs Re.Pack

本文按 **2026-05-28** 核验的公开基线比较 `@bunin/react-native-micro-frontend`（RNM）与 Re.Pack。

## 快速对比

| 问题 | 选择 RNM 的场景 | 选择 Re.Pack 的场景 |
| --- | --- | --- |
| Bundler seam | 希望保持 Metro-first。 | 希望用 Rspack/Webpack 作为 app bundler。 |
| Microfrontend model | Registry + Host-owned loader 已足够。 | 需要 Module Federation v2 remotes/chunks。 |
| OTA safety | 需要 native-contract gate 阻止 unsafe JS delivery。 | App/team 自行负责 native compatibility rules。 |
| Operations | 希望减少 runtime moving parts。 | 可以接受 remote chunk/cache/CDN/federation operations。 |
| Best fit | 围绕 Metro artifact 的 native-safe OTA/archive。 | Runtime composition 与 code-splitting 是核心架构。 |

## Capability map

| Capability | RNM 能做什么 | Re.Pack 能做什么 | 不能做 / 注意 |
| --- | --- | --- | --- |
| Metro-first bundle archive | 可以。`rnm bundle` 生成 Metro `index.bundle`、`manifest.json`、引用 assets，以及可选 `.tar.gz` archive。 | 不是主要路径。Re.Pack 使用 Rspack/Webpack output 与 runtime chunks。 | RNM 不会把 Metro archive 转成 Module Federation remote。 |
| Native-contract OTA gate | 可以。RNM 捕获 native assumptions，并阻止 unsafe OTA/runtime load。 | 需要在 Re.Pack runtime 周围由 app/team policy 设计。 | RNM 也不会让 native change 变成 OTA-safe；native change 仍需要 Store release。 |
| Module Federation remotes | 不支持。 | 支持。这是 Re.Pack 的核心 microfrontend model。 | RNM 不运行 Webpack Module Federation 或 remote chunk containers。 |
| Rspack/Webpack plugin ecosystem | 不支持。RNM 保持 Metro-first。 | 支持。Re.Pack 提供 Rspack/Webpack config、plugins、loaders 与 chunking。 | RNM 不会用 Rspack/Webpack 替代 Metro。 |
| Host-owned delivery loader | 支持。Host 可选择 Hot Updater、Expo EAS Update、embedded bundle、bundle archive 或 custom loader。 | Re.Pack 提供自己的 script runtime 与 federation loading flow。 | RNM 本身不拥有 CDN policy、JavaScript evaluation 或 remote integrity。 |
| Shared dependency policy | 用 Metro alias/watchFolders 增强 Host/MFE package sharing。 | 提供 Module Federation shared dependency negotiation。 | RNM 不做 federation shared dependency negotiation。 |

## 当前基线

| Package | 已核验最新 version |
| --- | --- |
| `@bunin/react-native-micro-frontend` | `0.7.0` |
| `react-native` | `0.85.3` |
| `@callstack/repack` | `5.2.5` |

参考基线：

- React Native 0.85 是官方 React Native release blog 中的 current stable line。
- Re.Pack 网站将 5.x 标记为 latest documentation track。
- Re.Pack 5.x 是基于 Rspack/Webpack 的 React Native build tool，并支持 Module Federation v2。
- RNM 保持 Metro-first，不依赖 `@callstack/repack`。

## 详细概览

当你想保留 Metro、在 OTA/runtime load 前验证 native compatibility，并让 Host App 拥有实际 bundle loader 时，选择 **RNM**。

当你的架构需要 Rspack/Webpack、Module Federation、remote chunks、code splitting 或 Webpack/Rspack plugin workflow 时，选择 **Re.Pack**。

## 详细架构对比

| Concern | RNM | Re.Pack |
| --- | --- | --- |
| 主要角色 | Native-safety、registry、integration 与 loader orchestration layer | React Native bundler/runtime replacement |
| Bundler | 默认 Metro；`withMfe` 增强 Metro config | 用 Rspack 或 Webpack 替代 Metro |
| Microfrontend split | `rnm.registry.json` + Host-owned loader | Module Federation v2 remotes/chunks |
| Artifact style | Metro `index.bundle`、`manifest.json`、引用 assets、`.tar.gz` bundle archive、OTA URL 或 embedded bundle | Federated modules、remote chunks/containers、script runtime cache |
| Native safety | 用 native contract hash gate React Native version、Hermes、New Architecture、native dependencies、Podfile/Gradle/manifest inputs | App/team 需要自行设计并强制 native compatibility policy |
| Delivery engine | Hot Updater、Expo EAS Update、bundle archive、embedded bundle 或 custom Host loader | Re.Pack script runtime 与 Module Federation loading flow |
| Dependency | `@bunin/*` packages | `@callstack/repack` 与 bundler ecosystem |

## RNM 有意不做的事

RNM 不安装 Re.Pack、不替换 Metro、不运行 Webpack Module Federation、不管理 remote chunks。它提供：

- Host/MFE registry 与 status policy。
- Native contract 生成、diff 与 OTA blocking。
- 可审查的 package、iOS、Android、Expo integration helpers。
- Metro `withMfe` shared dependency wiring。
- 基于 Metro output 的 portable bundle archives。
- 调用 Host-owned loader 的 runtime APIs。

```txt
RNM flow
register MFE
  -> calculate native contract
  -> block unsafe OTA/runtime load
  -> Host loader fetches/evaluates the chosen artifact
```

## Re.Pack 优化的方向

当 bundler/runtime composition 本身是 product requirement 时，Re.Pack 更匹配：

- 用 Rspack/Webpack 替代 Metro。
- 使用 Module Federation v2 构建 mobile microfrontends。
- 将 JS 或 Hermes bytecode 拆成更小 chunks。
- 在 runtime 按需下载 remote modules。
- 使用 Webpack/Rspack plugins、loaders、tree-shaking 和 Re.Pack dev server/runtime features。

```txt
Re.Pack flow
configure Rspack/Webpack
  -> expose/consume federated modules
  -> load remote chunks at runtime
  -> app team owns native compatibility and remote integrity policy
```

## 平衡的批评：Webpack/Rspack 层的成本

Re.Pack 值得被肯定。到目前为止，它一直是 React Native micro frontend 领域接近事实标准的选择，也是令人印象深刻的工程成果。它把 Module Federation 风格的 composition、remote chunk loading 与成熟的 bundler ecosystem 带入了原本并不围绕这些边界设计的 mobile runtime。

但这种强大能力的代价，是 React Native app 必须额外接受一层 Rspack/Webpack。它不只是一个 config file，而是在 Metro 旁边再引入一套 build model、runtime loading model 和运维 surface。

- 团队不仅要理解 Metro 与 React Native，还要理解 Rspack/Webpack config、loader/plugin、chunk output 与 Module Federation shared dependency policy。
- 生产问题可能转移到 federation contract、remote manifest、chunk cache、CDN state 或 shared-module negotiation，而不再只是普通的 Metro/native 边界。
- Release governance 必须覆盖 chunk integrity、rollback、cache invalidation，以及 independently loaded code 的 native compatibility。
- 如果应用只需要 native-safe OTA 或 portable Metro artifact，那么额外的 bundler 层可能会成为 architecture weight，而不是 leverage。

因此重点不是“Re.Pack 不好”。重点是 Re.Pack 是更强大、也更重的 architecture。RNM 有意服务更窄的问题：保留 Metro，增加 native-contract gate，并让 Host 拥有简单的 loader boundary。

## 能否组合使用？

只能在有意设计的 custom Host loader architecture 中组合。

RNM 可以在调用 `createMicroFrontendLoader()` 前 gate module，Host 也可以理论上用 Re.Pack-aware runtime 实现该 loader。此设计中 Host team 必须明确负责：

- remote chunk integrity 与 signing；
- cache invalidation；
- Module Federation shared dependency policy；
- 每个 remote 的 native contract capture；
- rollback 与 blocked-module behavior；
- release/OTA promotion rules。

不要随意混用。如果 Module Federation 是核心架构，请从 Re.Pack 开始。如果 native-safe Metro/OTA governance 是核心架构，请从 RNM 开始。
