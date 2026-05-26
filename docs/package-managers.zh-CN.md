# 包管理器矩阵

本项目是 Bun 优先，并在使用方 workflow 中支持 `bun`、`npm`、`pnpm`、`yarn`、`deno`。

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
| 全量改版本 | `bun run version:all 0.2.0` | `npm run version:all -- 0.2.0` | `pnpm version:all 0.2.0` | `yarn version:all 0.2.0` | `deno task version:all 0.2.0` |
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

## Bundle archive 命令

安装 CLI 后在 MFE project 中运行。它会执行 React Native bundling，并只把 `index.bundle`、`assets/` 和 `manifest.json` 打进 archive。

```bash
rnm bundle mfe-feature --platform ios --host ../host-app --update-registry
```

也可以通过各 runner 运行同一命令：`bunx ... bundle`、`npx ... bundle`、`pnpm dlx ... bundle`、`yarn dlx ... bundle`、`deno run -A ... bundle`。
