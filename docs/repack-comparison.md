# RNM vs Re.Pack

This page compares `@bunin/react-native-micro-frontend` (RNM) with Re.Pack using the current public baselines checked on **2026-05-28**.

## Quick comparison

| Question | Choose RNM when... | Choose Re.Pack when... |
| --- | --- | --- |
| Bundler seam | You want to stay Metro-first. | You want Rspack/Webpack as the app bundler. |
| Microfrontend model | A registry plus Host-owned loader is enough. | Module Federation v2 remotes/chunks are required. |
| OTA safety | Native-contract gates must block unsafe JS delivery. | The app/team owns native compatibility rules. |
| Operations | You prefer fewer runtime moving parts. | You accept remote chunk/cache/CDN/federation operations. |
| Best fit | Native-safe OTA or archives around Metro artifacts. | Runtime composition and code-splitting are core architecture. |

## Capability map

| Capability | RNM supports | Re.Pack supports | Not covered / caution |
| --- | --- | --- | --- |
| Metro-first bundle archive | Yes. `rnm bundle` produces Metro `index.bundle`, `manifest.json`, referenced assets, and optional `.tar.gz` archives. | Not its main path. Re.Pack uses Rspack/Webpack output and runtime chunks. | RNM does not convert Metro archives into Module Federation remotes. |
| Native-contract OTA gate | Yes. RNM captures native assumptions and blocks unsafe OTA/runtime loading. | Possible only as app/team policy around the Re.Pack runtime. | RNM does not make native changes OTA-safe; native changes still need a store release. |
| Module Federation remotes | No. | Yes. This is Re.Pack's core microfrontend model. | RNM does not run Webpack Module Federation or remote chunk containers. |
| Rspack/Webpack plugin ecosystem | No. RNM stays Metro-first. | Yes. Re.Pack brings Rspack/Webpack configuration, plugins, loaders, and chunking. | RNM does not replace Metro with Rspack/Webpack. |
| Host-owned delivery loader | Yes. The Host can use Hot Updater, Expo EAS Update, embedded bundles, bundle archives, or a custom loader. | Re.Pack provides its own script runtime and federation loading flow. | RNM does not own CDN policy, JavaScript evaluation, or remote integrity by itself. |
| Shared dependency policy | Metro aliases/watch folders for Host/MFE package sharing. | Module Federation shared dependency negotiation. | RNM does not negotiate federation shared dependencies. |

## Current baseline

| Package | Latest checked version |
| --- | --- |
| `@bunin/react-native-micro-frontend` | `0.7.0` |
| `react-native` | `0.85.3` |
| `@callstack/repack` | `5.2.5` |

Reference points:

- React Native 0.85 is the current stable line in the official React Native release blog.
- The Re.Pack website marks 5.x as the latest documentation track.
- Re.Pack 5.x is a Rspack/Webpack-powered React Native build tool with Module Federation v2 support.
- RNM remains Metro-first and does not depend on `@callstack/repack`.

## Detailed overview

Use **RNM** when you want to keep Metro, verify native compatibility before OTA/runtime loading, and let the Host App own the actual bundle loader.

Use **Re.Pack** when your architecture requires Rspack/Webpack, Module Federation, remote chunks, code splitting, or Webpack/Rspack plugin workflows.

## Detailed architecture comparison

| Concern | RNM | Re.Pack |
| --- | --- | --- |
| Primary role | Native-safety, registry, integration, and loader orchestration layer | React Native bundler/runtime replacement |
| Bundler | Metro by default; `withMfe` augments Metro config | Rspack or Webpack instead of Metro |
| Microfrontend split | `rnm.registry.json` + Host-owned loader | Module Federation v2 remotes/chunks |
| Artifact style | Metro `index.bundle`, `manifest.json`, referenced assets, `.tar.gz` bundle archive, OTA URL, or embedded bundle | Federated modules, remote chunks/containers, script runtime cache |
| Native safety | Native contract hash gates React Native version, Hermes, New Architecture, native dependencies, Podfile/Gradle/manifest inputs | App/team must design and enforce native compatibility policy |
| Delivery engine | Hot Updater, Expo EAS Update, bundle archive, embedded bundle, or custom Host loader | Re.Pack script runtime and Module Federation loading flow |
| Dependency | `@bunin/*` packages | `@callstack/repack` and its bundler ecosystem |

## What RNM intentionally does not do

RNM does not install Re.Pack, replace Metro, run Webpack Module Federation, or manage remote chunks. It provides:

- Host/MFE registry and status policy.
- Native contract generation, diffing, and OTA blocking.
- Reviewable package, iOS, Android, and Expo integration helpers.
- Metro `withMfe` shared dependency wiring.
- Portable bundle archives from Metro output.
- Runtime APIs that call a Host-owned loader.

```txt
RNM flow
register MFE
  -> calculate native contract
  -> block unsafe OTA/runtime load
  -> Host loader fetches/evaluates the chosen artifact
```

## What Re.Pack optimizes

Re.Pack is better aligned when the bundler/runtime composition is the product requirement:

- Replace Metro with Rspack/Webpack.
- Use Module Federation v2 for mobile microfrontends.
- Split JS or Hermes bytecode into smaller chunks.
- Download remote modules on demand.
- Use Webpack/Rspack plugins, loaders, tree-shaking, and Re.Pack dev server/runtime features.

```txt
Re.Pack flow
configure Rspack/Webpack
  -> expose/consume federated modules
  -> load remote chunks at runtime
  -> app team owns native compatibility and remote integrity policy
```

## A fair critique of the Webpack/Rspack layer

Re.Pack deserves credit: for years it has been the practical standard for React Native microfrontends, and it is an impressive engineering achievement. It brought Module Federation-style composition, remote chunk loading, and a mature bundler ecosystem into a mobile runtime that was not originally designed around those seams.

The trade-off is that this power requires accepting an additional Rspack/Webpack layer in a React Native app. That is not just a config file; it introduces another build model, another runtime loading model, and another operational surface next to native releases.

- Teams must understand Metro and React Native, plus Rspack/Webpack configuration, loaders/plugins, chunk output, and Module Federation shared dependencies.
- Production failures can move into federation contracts, remote manifests, chunk caching, CDN state, or shared-module negotiation instead of ordinary Metro/native boundaries.
- Release governance must cover chunk integrity, rollback, cache invalidation, and native compatibility for independently loaded code.
- If the app only needs native-safe OTA or portable Metro artifacts, the extra bundler layer can become architecture weight rather than leverage.

So the point is not "Re.Pack is bad." The point is that Re.Pack is a stronger, heavier architecture. RNM intentionally serves the narrower case: keep Metro, add native-contract gates, and let the Host own a simple loader boundary.

## Can you combine them?

Only with a deliberate custom Host loader architecture.

RNM can gate a module before calling `createMicroFrontendLoader()`, and a Host could theoretically implement that loader with a Re.Pack-aware runtime. In that design the Host team must explicitly own:

- remote chunk integrity and signing;
- cache invalidation;
- Module Federation shared dependency policy;
- native contract capture for every remote;
- rollback and blocked-module behavior;
- release/OTA promotion rules.

Do not mix the two casually. If Module Federation is the central architecture, start from Re.Pack. If native-safe Metro/OTA governance is the central architecture, start from RNM.
