# 包管理器与 CLI 命令

本项目是 Bun 优先，并在使用方 workflow 中支持 `bun`、`npm`、`pnpm`、`yarn`、`deno`。本页也列出 integration、watcher、bundle、verify、publish 流程新增的全部 RNM CLI 命令。

## 安装包

| 工具 | Runtime 包 | CLI 包 |
| --- | --- | --- |
| Bun | `bun add @bunin/react-native-micro-frontend` | `bun add -d @bunin/react-native-micro-frontend-cli` |
| npm | `npm install @bunin/react-native-micro-frontend` | `npm install --save-dev @bunin/react-native-micro-frontend-cli` |
| pnpm | `pnpm add @bunin/react-native-micro-frontend` | `pnpm add -D @bunin/react-native-micro-frontend-cli` |
| Yarn | `yarn add @bunin/react-native-micro-frontend` | `yarn add -D @bunin/react-native-micro-frontend-cli` |
| Deno | `deno add npm:@bunin/react-native-micro-frontend` | `deno add --package-json --dev npm:@bunin/react-native-micro-frontend-cli` |

## 不全局安装直接运行 CLI

| 工具 | 命令 |
| --- | --- |
| Bun | `bunx @bunin/react-native-micro-frontend-cli init` |
| npm | `npx @bunin/react-native-micro-frontend-cli init` |
| pnpm | `pnpm dlx @bunin/react-native-micro-frontend-cli init` |
| Yarn 2+ | `yarn dlx @bunin/react-native-micro-frontend-cli init` |
| Deno | `deno run -A npm:@bunin/react-native-micro-frontend-cli init` |

## 仓库 release 命令

| 操作 | Bun | npm | pnpm | Yarn | Deno task |
| --- | --- | --- | --- | --- | --- |
| 全量改版本 | `bun run version:all 0.7.0` | `npm run version:all -- 0.7.0` | `pnpm version:all 0.7.0` | `yarn version:all 0.7.0` | `deno task version:all 0.7.0` |
| 验证 | `bun run release:check` | `npm run release:check` | `pnpm release:check` | `yarn release:check` | `deno task release:check` |
| 发布 dry-run | `bun run release:dry-run` | `npm run release:dry-run` | `pnpm release:dry-run` | `yarn release:dry-run` | `deno task release:dry-run` |
| 真正发布 | `bun run release:publish` | `npm run release:publish` | `pnpm release:publish` | `yarn release:publish` | `deno task release:publish` |

仓库 release workflow 内部的 test、build、pack、publish 都使用 Bun。即使外层命令使用其他包管理器，CI 也需要安装 Bun。

由于存在 `pnpm-workspace.yaml` 和 `.npmrc`，即使 repository 的 preferred `packageManager` 是 Bun，也可以使用 pnpm。

## `rnm publish` 输出的 OTA 发布命令

| `--package-manager` | Hot Updater 命令 |
| --- | --- |
| `bun` | `bunx hot-updater deploy -p ios -c production` |
| `npm` | `npx hot-updater deploy -p ios -c production` |
| `pnpm` | `pnpm dlx hot-updater deploy -p ios -c production` |
| `yarn` | `yarn dlx hot-updater deploy -p ios -c production` |
| `deno` | `deno run -A npm:hot-updater deploy -p ios -c production` |

`rnm publish` 只有在 OTA eligibility 通过后才会输出发布命令。

Expo EAS Update 可以通过 `rnm expo` 或 `rnm publish --provider expo` 使用。

| `--package-manager` | Expo EAS Update 命令 |
| --- | --- |
| `bun` | `bunx eas-cli@latest update --channel production --message 'RNM mfe-feature@1.0.0' --platform all` |
| `npm` | `npx eas-cli@latest update --channel production --message 'RNM mfe-feature@1.0.0' --platform all` |
| `pnpm` | `pnpm dlx eas-cli@latest update --channel production --message 'RNM mfe-feature@1.0.0' --platform all` |
| `yarn` | `yarn dlx eas-cli@latest update --channel production --message 'RNM mfe-feature@1.0.0' --platform all` |
| `deno` | `deno run -A npm:eas-cli update --channel production --message 'RNM mfe-feature@1.0.0' --platform all` |

当 EAS workflow 需要时可同时使用 `--branch`、`--auto`、`--environment`、`--non-interactive`。

## Bundle archive 命令

安装 CLI 后在 MFE project 中运行。它会执行 React Native bundling，自动收集被引用的 runtime assets，并只把 `index.bundle`、`manifest.json` 和验证后的 asset 文件打进 archive。

```bash
rnm bundle mfe-feature --platform ios --host ../host-app --update-registry --yes
```

如果只想检查 asset 收集结果而不创建最终 tarball，可运行 `rnm bundle-asset mfe-feature --platform ios --entry ./src/index.tsx`。Dynamic require 场景使用 `--asset-glob` 作为 fallback。

也可以通过各 runner 运行同一命令：`bunx ... bundle`、`npx ... bundle`、`pnpm dlx ... bundle`、`yarn dlx ... bundle`、`deno run -A ... bundle`。使用 `--host` 时 CLI 会生成 `rnm.bundle-archives.ts`，并询问是否导入 Host entry；传 `--yes` 或 `--register-archives` 可自动应用。

## RNM CLI 命令参考

当前安装的 CLI version 支持的准确 options 可通过 help 查看。

```bash
rnm --help
rnm help
rnm <command> --help
rnm <command> -h
```

### Host 集成命令

| 命令 | 用途 |
| --- | --- |
| `rnm package <mfe>` | 检测缺失的 JS/native package dependency，并在确认后加入 Host `package.json`。 |
| `rnm aos <mfe>` / `rnm android <mfe>` | 检测 Android Gradle project、Gradle dependency 与 permission；写入 generated Android include files 或 Expo plugin data。 |
| `rnm ios <mfe>` | 检测 iOS Pods；写入 generated Podfile include files 或 Expo plugin data。 |
| `rnm all <mfe>` | 按安全顺序运行所有集成：`package -> AOS -> iOS`。 |
| `rnm integrate all <mfe>` | 向后兼容的 explicit integration route。 |
| `rnm expo <mfe>` | 运行相同的 integration watcher 与 OTA eligibility gate，然后输出 Expo EAS Update deploy command。 |

```bash
rnm package mfe-feature --dry-run
rnm aos mfe-feature --yes
rnm android mfe-feature --yes
rnm ios mfe-feature --yes
rnm all mfe-feature --yes
```

### Expo 支持

同一套 CLI 命令支持 Expo managed、prebuild、bare/prebuilt Host App。bare/prebuilt project 中 RNM 会写入 generated Podfile/Gradle include files；没有 `ios/` 或 `android/` 的 managed project 中，RNM 会生成 `rnm.expo-plugin.cjs` 和 `rnm.expo-integration.json`，并在可行时把 plugin 加入 `app.json`。

```bash
rnm add mfe-feature --path ../mfe-feature --yes
rnm all mfe-feature --yes
npx expo prebuild
```

如果要通过 Expo EAS Update 发布，请把 MFE 注册为 Expo OTA provider，并在 RNM native-safety gate 通过后输出 EAS deploy command。运行 `rnm add --ota-provider expo` 时，package watcher 也会显示 Host 缺失的 `expo`、`expo-updates` 等包，并在选择 yes 或传入 `--yes` 时一并应用。

```bash
rnm add mfe-feature --path ../mfe-feature --ota-provider expo --ota-mode manual --yes
rnm expo mfe-feature --channel production --platform all --non-interactive
# 也可以通过 publish 使用同一路径
rnm publish mfe-feature --provider expo --channel production --platform all --non-interactive
```

### 自动 integration watcher

`rnm add`、`rnm bundle --host`、`rnm verify`、`rnm publish` 会在继续原任务前监视缺失的 `package -> AOS -> iOS` additions。交互式 terminal 中 RNM 会询问是否应用。

```bash
rnm add mfe-feature --path ../mfe-feature --yes
rnm bundle mfe-feature --platform ios --host ../host-app --yes
rnm verify mfe-feature --skip-integration
rnm publish mfe-feature --package-manager bun --channel production --skip-integration
rnm expo mfe-feature --channel production --platform all --skip-integration
```

非交互自动应用使用 `--yes`，直接 integration command 中检查改动使用 `--dry-run`，只想执行原 add/bundle/verify/publish 命令时使用 `--skip-integration`。

### Lifecycle 与诊断命令

| 命令 | 用途 |
| --- | --- |
| `rnm init` | 创建可审查的 Host config、registry、native contract 与 generated include files。 |
| `rnm build` | 输出 React Native bundle command 与可选 archive output path。 |
| `rnm bundle` | 创建只包含 `index.bundle`、`manifest.json` 和实际引用 runtime assets 的最小 archive。 |
| `rnm diff` | 比较 Host 与 MFE native contracts。 |
| `rnm sync` | 记录 block MFE 或 native change 后 disable OTA 等 native-change decision。 |
| `rnm status` | 从 `rnm.registry.json` 输出已注册 MFE 状态。 |
| `rnm doctor` | 只读诊断 project setup。 |
| `rnm rollback` | 恢复 patch existing files 前生成的 `.bak` files。 |

