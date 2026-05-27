# React Native Micro Frontend

**面向 React Native feature team 的 native-safe delivery layer。**

`@bunin/react-native-micro-frontend` 帮助团队把功能拆成可独立验证的模块，同时保护 host app 的 native binary contract。

## 快速开始

```bash
bun add @bunin/react-native-micro-frontend
bun add -d @bunin/react-native-micro-frontend-cli
bunx @bunin/react-native-micro-frontend-cli init
```

## 文档

| 文档                                                    | 用途                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------ |
| [简体中文 README](README.zh-CN.md)                      | 主要指南和示例。                                             |
| [Getting Started](getting-started.zh-CN.md)             | 安装、配置、注册、校验并加载第一个 MFE。                     |
| [Easy Way](easy-way.zh-CN.md)                           | 在无 OTA publish 的 Bundle、Hot Updater/custom OTA、Expo delivery 中选择。  |
| [Expo 支持](getting-started.zh-CN.md#expo-host-app)     | Expo managed/prebuild/bare Host App 支持 package、AOS、iOS integration watcher。 |
| [选项参考](options.zh-CN.md)                            | Host config、MFE config、registry 与 runtime 的全部选项。    |
| [Metro / Bundle archive](metro-bundle-archive.zh-CN.md) | 使用 `withMfe` merge Metro，并加载 portable bundle archive。 |
| [English](../README.md)                                 | English official guide.                                      |
| [韩文](README.ko.md)                                    | 韩文官方文档。                                               |
| [日文](README.ja.md)                                    | 日文官方文档。                                               |
| [包管理器与 CLI](package-managers.zh-CN.md)             | Bun、npm、pnpm、Yarn、Deno 运行矩阵和 RNM CLI 命令。          |
| [Native contract](native-contract.md)                   | native compatibility 说明。                                  |
| [全局状态](/zh-cn/docs/global-state)                    | Host 向 MFE 提供并读取 sharedState 的指南。                  |
| [Hot Updater 设置](/zh-cn/docs/hot-updater)             | Hot Updater 路由指南。                                       |

## Easy Way

### 1. Bundle — portable archive

```bash
# 在 MFE project 中运行
rnm bundle mfe-feature --platform ios --host ../host-app
```

它会创建包含 `index.bundle`、`manifest.json` 和实际引用 runtime assets 的 `.tar.gz`；不传 `--update-registry` 时保持 bundle-only/no-OTA 流程。

### 2. OTA — Hot Updater/custom delivery

```bash
rnm add mfe-feature --path ../mfe-feature --entry ./src/index.tsx --version 1.0.0 --ota-provider hot-updater --ota-mode manual
rnm verify mfe-feature
rnm publish mfe-feature --package-manager bun --channel production

# 使用 Expo EAS Update 代替 Hot Updater
rnm add mfe-feature --path ../mfe-feature --entry ./src/index.tsx --version 1.0.0 --ota-provider expo --ota-mode manual
rnm expo mfe-feature --channel production --platform all --non-interactive
```

使用 `createMicroFrontendLoader({ hotUpdater, custom })` 连接。OTA engine 在 native-safety verification 通过后负责分发和 evaluation。

## 核心流程

```txt
注册 MFE
  -> 计算 native contract
  -> 与 host binary 比较
  -> 允许或阻止 OTA
  -> 通过 runtime policy 加载
```

## 设计原则

- **Safety first**：native 变更需要 native release。
- **Bun-first, ecosystem-friendly**：仓库 runtime 优先使用 Bun，consumer project 可使用 Bun、npm、pnpm、Yarn、Deno。
- **No hidden native patches**：generated file 和 manual integration 保持可审查。
- **Hot Updater compatible**：compatibility check 通过后再委托 Hot Updater 进行 OTA delivery。
- **Metro-ready by default**：`withMfe` merge Metro config，并自动配置 registered MFE root 与 shared package alias。
- **Portable bundle archives**：`rnm bundle` 打包 `index.bundle`、`manifest.json` 和实际引用的 runtime assets，用于 Host copy/CDN upload。
- **Host-provided shared state**：Host 可安全地向 MFE 提供 session、locale、feature flags。
