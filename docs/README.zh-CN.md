# @bunin/react-native-micro-frontend

**面向 React Native 的 native-safe micro frontend 库。**

独立开发功能模块，验证 native compatibility，并且只在 host binary 可以安全运行时才发布 OTA 更新。

相关文档：[官方文档首页](index.zh-CN.md) · [Getting Started](getting-started.zh-CN.md) · [选项参考](options.zh-CN.md) · [包管理器矩阵](package-managers.zh-CN.md)

```txt
React Native Micro Frontend
  registry 驱动的模块管理
  native contract 校验
  Metro bundle 生成
  Hot Updater 发布集成
  runtime safety gate
```

## 概览

`@bunin/react-native-micro-frontend` 是 React Native 团队的安全与集成层，让功能模块可以独立交付，同时不牺牲 native binary compatibility。

它不替代 Hot Updater。Hot Updater 仍然是 OTA delivery engine；本库负责在发布或加载 MFE 之前判断它是否安全。

## 核心能力

| 能力 | 说明 |
| --- | --- |
| MFE registry | 用一个可预测的 registry 管理 feature module、entry point、OTA policy 和 runtime status。 |
| Native contract | 将 React Native version、Hermes、New Architecture、native dependency、Podfile、Gradle、AndroidManifest、Info.plist 相关输入固定为 hash。 |
| OTA gate | 当 native assumptions 与 host binary 不一致时阻止 OTA。 |
| Runtime policy | 拒绝加载 blocked/incompatible MFE，并安全 fallback。 |
| Metro integration | 不依赖 Re.Pack 或 Module Federation，生成可审计的 Metro bundle command。 |
| Hot Updater adapter | 复用现有 Hot Updater 发布流程。 |
| Package manager support | 支持 Bun、npm、pnpm、Yarn、Deno 的使用方 workflow。 |

## 快速开始

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

## 它解决什么问题？

React Native 同时存在可 OTA 的部分和必须重新发布原生应用的部分。

```txt
JS / assets / styles / business logic
  -> 通常可以 OTA

Pods / Gradle / AndroidManifest / Info.plist / RN version / Hermes / New Architecture
  -> 必须发布新的 native binary
```

本库强制区分这两个边界。每个 MFE 都有 registry 条目和 native contract。发布前，CLI 会检查 MFE 是否仍然兼容当前 Host App 二进制。

## 包结构

```txt
packages/
  core/
    public type、config helper、registry model、OTA 判断、package manager 检测

  cli/
    rnm 命令行工具

  native-contract/
    package.json、Podfile.lock、Gradle、AndroidManifest、RN/Hermes/New Architecture 分析

  hot-updater-adapter/
    Hot Updater 检测、wrapper metadata、deploy command 生成

  metro-adapter/
    Metro 配置检测、MFE bundle command 生成

  react-native-runtime/
    runtime registry、Provider、hook、screen fallback 策略

  integration/
    现有 Host App 分析、generated file、manual guide、safe patch、rollback helper

  config/
    CLI/CI 使用的 JSON config loader
```

## 本地运行

```bash
bun install
bun test
bun run typecheck
bun run build
```

含义：

- `bun test`：运行 OTA 规则、native hash、native diff、package manager 检测的回归测试。
- `bun run typecheck`：验证整个 monorepo 的 TypeScript 类型。
- `bun run build`：输出各 package 的 `dist/` 和 declaration 文件。


## 包管理器支持

本项目是 **Bun 优先**，但不是 Bun 专用。

“包管理器支持”分为两个层面：

1. **使用方项目支持**：host app 或 MFE 可以用 `bun`、`npm`、`pnpm`、`yarn`、`deno` 安装包并运行 CLI。
2. **仓库发布支持**：本 monorepo 的实际 release engine 是 Bun，同时提供 `bun`、`npm`、`pnpm`、`yarn`、`deno task` 的等价入口来调用同一套 release script。

### 安装 Runtime 包

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

含义：

- `@bunin/react-native-micro-frontend` 包含 config helper、registry model、OTA gate 和 runtime exports。
- Deno 使用 `npm:` specifier 来引用 npm registry 包。
- React Native 本身仍然需要由 host app 提供。

### 不全局安装直接运行 CLI

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

含义：

- 所有命令都会运行同一个 `rnm` CLI package。
- `init` 会生成 integration 文件，但不会偷偷修改 native 文件。
- Deno 需要 `-A`，因为 CLI 会读写项目文件。

### 将 CLI 安装为 devDependency

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

含义：

- CI 需要固定 CLI 版本时，建议安装到 devDependency。
- `deno add --package-json --dev` 在 Deno 2.8+ 中会把 CLI 写入 `package.json` devDependencies。
- CLI binary 名称是 `rnm`。
- package manager detection 仍会根据 host project 配置和 lockfile 工作。

### 包管理器检测顺序

```txt
1. explicit --package-manager flag
2. MFE local config
3. host config
4. lockfiles: bun.lockb, bun.lock, deno.json, deno.jsonc, package-lock.json, npm-shrinkwrap.json, pnpm-lock.yaml, yarn.lock
5. packageManager field in package.json
6. npm fallback
```

含义：

- CLI 显式传入的值总是优先。
- lockfile 被视为比 `packageManager` 字符串更强的证据。
- host/MFE 包管理器不同是允许的，但会报告为 integration risk。

### `rnm publish` 生成的 OTA 发布命令

```bash
rnm publish mfe-feature --package-manager bun
rnm publish mfe-feature --package-manager npm
rnm publish mfe-feature --package-manager pnpm
rnm publish mfe-feature --package-manager yarn
rnm publish mfe-feature --package-manager deno
```

生成的 Hot Updater 命令：

```bash
bunx hot-updater deploy -p ios -c production
npx hot-updater deploy -p ios -c production
pnpm dlx hot-updater deploy -p ios -c production
yarn dlx hot-updater deploy -p ios -c production
deno run -A npm:hot-updater deploy -p ios -c production
```

含义：

- `rnm publish` 会先执行 OTA safety gate。
- 如果 native contract mismatch，会在输出发布命令前阻止 OTA。
- package manager 只影响调用 Hot Updater 的方式。

### 仓库 release script 的等价命令

```bash
# Bun，推荐
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

含义：

- 所有入口都会调用同一个 release workflow。
- workflow 内部的 test、build、pack、publish 都使用 Bun。
- 即使 CI 外层使用 `npm`、`pnpm`、`yarn` 或 `deno task`，仍然需要安装 Bun。
- 由于存在 `pnpm-workspace.yaml` 和 `.npmrc`，即使 repository 的 preferred `packageManager` 是 Bun，也可以使用 pnpm。

## CLI 示例

### 1. 初始化 Host App

```bash
rnm init
```

含义：

- 创建 `react-native-micro-frontend.config.ts`
- 创建 `rnm.registry.json`
- 创建 `rnm.native-contract.json`
- 创建 `ios/Podfile.rnm.generated.rb` 等 generated include 文件
- 不会静默修改现有 Podfile、Gradle 或 Metro 配置

Dry-run：

```bash
rnm init --dry-run
```

含义：

- 只打印计划创建的文件
- 不写入任何内容
- 适合首次接入前的安全审计

### 2. 注册 MFE

```bash
rnm add mfe-feature \
  --path ../mfe-feature \
  --entry ./src/index.tsx \
  --version 1.0.0 \
  --ota-mode manual \
  --ota-provider hot-updater
```

含义：

- 将 `mfe-feature` 写入 `rnm.registry.json`
- `entry` 是 Metro bundle 的入口文件
- 即使 OTA 已启用，如果 native contract 不匹配，发布时仍会被阻止

### 3. 验证 OTA 是否可用

```bash
rnm verify mfe-feature
```

含义：

- 检查 registry 状态
- 检查 MFE 是否 blocked
- 检查 `nativeHash` 是否与 Host 不同
- 如果 OTA 不安全，返回非零退出码

### 4. 比较 native contract

```bash
rnm diff mfe-feature
```

含义：

- 读取 Host 的 `rnm.native-contract.json`
- 读取 `../mfe-feature/rnm.native-contract.json`
- 输出 native 差异
- 输出是否需要 Store release

### 5. 显式处理 native 变更

接受 native 变更并关闭本版本 OTA：

```bash
rnm sync mfe-feature --apply-native
```

含义：

- 将 MFE 保持为 active
- 禁用该 MFE 版本的 OTA
- 打印 “OTA DISABLED” 警告框

拒绝 native 变更并阻止 MFE：

```bash
rnm sync mfe-feature --block-native
```

含义：

- 将 MFE 标记为 blocked
- 阻止 runtime load
- 阻止 OTA publish

### 6. 生成 Metro bundle command

```bash
rnm build mfe-feature \
  --platform ios \
  --type ota \
  --entry ./src/index.tsx
```

含义：

- 打印基于 Metro 的 `react-native bundle` 命令
- 不使用 Re.Pack
- 将命令生成与执行分离，方便 CI 检查

### 7. 通过 Hot Updater 发布

```bash
rnm publish mfe-feature \
  --package-manager pnpm \
  --channel production
```

含义：

- 首先执行 OTA eligibility gate
- nativeHash mismatch 或 blocked 时失败
- 只有安全时才打印 Hot Updater deploy command

## 配置示例

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

含义：

- React Native `0.70+` 是最低支持线。
- Hermes 和 New Architecture 是 native contract 的一部分。
- Hot Updater 被复用，而不是被替代。
- package manager 策略是显式的。
- native 集成默认优先 generated file 和人工确认。

## Runtime 示例

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

含义：

- Host App 决定 registry 从哪里读取。
- runtime 会拒绝 blocked 或 nativeHash mismatch 的 MFE。
- MFE entry module 应 default export root component。
- `MicroFrontendScreen` 是 fallback-first policy placeholder。
- 连接真实 Hot Updater、embedded bundle 或 custom loader 时，请使用 `useMicroFrontend()`。
- Host-specific loader 解析 JavaScript bundle 并渲染 `module.default`。
- 不安全或无法加载时显示 fallback。


## 读取 Host 提供的全局状态

当 Host 需要向 MFE 提供 session identity、locale、feature flags、tenant、experiment bucket 或 analytics context 等小型只读状态时，使用 `sharedState`。

这个模式分两步：

1. Host 将 typed snapshot 传给 `MicroFrontendProvider`。
2. MFE 使用 `useMicroFrontendSharedState<T>()` 读取该 snapshot。
3. 当同一个 component 会同时运行在 Host shell 和 MFE subtree 中时，可用 `useIsMfe()` 判断当前位置。

```tsx
import {
  MicroFrontendProvider,
  useIsMfe,
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
  locale: "zh-CN",
  featureFlags: {
    checkoutV2: true,
    profileMfe: true,
  },
  tenant: {
    id: "bunin",
  },
};

export function MountedFeatureModule({ registry }) {
  return (
    <MicroFrontendProvider
      isMfe
      registry={registry}
      sharedState={sharedState}
    >
      <FeatureModuleHeader />
    </MicroFrontendProvider>
  );
}

export function FeatureModuleHeader() {
  const isMfe = useIsMfe();
  const host = useMicroFrontendSharedState<HostSharedState>();
  const userId = host.session?.userId ?? "guest";
  const checkoutV2 = host.featureFlags.checkoutV2 ?? false;

  return (
    <Text>
      {isMfe ? "MFE" : "Host"} · {host.locale} · {userId} · checkoutV2={String(checkoutV2)}
    </Text>
  );
}
```

含义：

- Host 仍然是 source of truth。
- MFE 通过 runtime hook 获取全局状态，而不是直接 import Host store。
- `useIsMfe()` 在 provider 外或 Host shell 中返回 `false`；Host 为 mounted feature subtree 设置 `isMfe` 后返回 `true`。
- 将 `HostSharedState` type 放在 Host 与 MFE 都能 import 的小型 shared contract package 或文件中。
- 状态变更应通过 Host commands、callbacks 或 events 回传。
- 大型 cache、secret、native-only handle 不应放入 `sharedState`。

## Hot Updater 设置页面

文档站点提供 `/docs/getting-started` 路由来说明首次安装、Host 配置、MFE 注册、校验与 runtime 加载；`/docs/options` 路由按详细页面整理 Host config、MFE config、registry 与 runtime options；也提供 `/docs/hot-updater` 路由来说明 Hot Updater 设置。它保留 Hot Updater 作为 OTA delivery engine，使用 `withReactNativeMicroFrontend` 包装 metadata，并且只在 native safety check 通过后生成 publish command。

## OTA 判断规则

```txt
if ota.enabled === false
  -> OTA blocked

else if React Native version changed
  -> OTA blocked
  -> store release required

else if Hermes setting changed
  -> OTA blocked
  -> store release required

else if New Architecture setting changed
  -> OTA blocked
  -> store release required

else if native files/dependencies changed
  -> OTA blocked
  -> store release required

else if nativeHash mismatched
  -> OTA blocked
  -> store release required

else if MFE is blocked
  -> OTA blocked
  -> runtime load blocked

else
  -> OTA available
```

## nativeHash 组成

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

含义：

- JS-only 变更可以通过 OTA 发布。
- native ABI 或 native dependency 变更不能靠替换 JS 解决。
- nativeHash mismatch 表示 Host binary 与 MFE bundle 的原生假设不同。

## Re.Pack 策略

本项目不使用 Re.Pack。

```txt
允许：
  Metro bundle generation
  Hot Updater OTA delivery
  native contract verification
  runtime registry loading

禁止：
  @callstack/repack
  Webpack Module Federation
  Re.Pack remote chunk runtime
```

## 一次性版本管理与发布

所有可发布 package 使用同一个版本。不要手动分别修改每个 `package.json`，请使用根目录脚本。

### 设置或 bump 所有 package 版本

下面先展示 Bun 命令，因为 Bun 是推荐 workflow。同一套 release script 也可以通过 `npm`、`pnpm`、`yarn`、`deno task` 调用。

```bash
bun run version:all 0.2.0
bun run version:all patch
bun run version:all minor
bun run version:all major
```

等价命令：

```bash
npm run version:all -- 0.2.0
pnpm version:all 0.2.0
yarn version:all 0.2.0
deno task version:all 0.2.0
```


含义：

- 更新 root version
- 更新所有 `packages/*/package.json` version
- 同步内部 package dependency version
- package 可以拆分，但 release version 统一管理

### 全量验证和 pack

```bash
bun run release:check
```

含义：

- 运行测试
- 运行 TypeScript typecheck
- 构建所有 package
- 使用 `bun pm pack` 在 `.npm-pack/` 中生成 npm 兼容 tarball

### 全量 registry publish dry-run

```bash
bun run release:dry-run
```

含义：

- 运行完整 release check
- 对所有 package 执行 `bun publish --dry-run`
- 不会真正发布到 npm registry

### 真正发布

```bash
# 请先配置 npm registry 认证，例如已有的 ~/.npmrc token。
bun run release:publish
```

含义：

- 再次运行完整 release check
- 按依赖顺序发布所有 package 到 npm registry
- publish 脚本使用 `bun publish --cwd <package>`；默认参数是 `--access public --tag latest`

## License

MIT.

Beerware 很有黑客精神，但实际 package license 保持 MIT，这样 npm 用户、公司和自动化 compliance 工具都能更顺利地采用。如果这个库救了你的 release，给维护者买杯啤酒当然欢迎。
