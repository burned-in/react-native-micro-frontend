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

| 文档 | 用途 |
| --- | --- |
| [简体中文 README](README.zh-CN.md) | 主要指南和示例。 |
| [English](../README.md) | English official guide. |
| [한국어](README.ko.md) | 한국어 공식 문서. |
| [日本語](README.ja.md) | 日本語公式ドキュメント. |
| [包管理器](package-managers.zh-CN.md) | Bun、npm、pnpm、Yarn、Deno 命令矩阵。 |
| [Native contract](native-contract.md) | native compatibility 说明。 |
| [Hot Updater 设置](/docs/hot-updater) | Hot Updater 路由指南。 |

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
- **Host-provided shared state**：Host 可安全地向 MFE 提供 session、locale、feature flags。
