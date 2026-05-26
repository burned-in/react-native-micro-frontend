# パッケージマネージャ・マトリクス

このプロジェクトは Bun 優先で、利用側 workflow では `bun`、`npm`、`pnpm`、`yarn`、`deno` をサポートします。

## package を install する

| ツール | Runtime package | CLI package |
| --- | --- | --- |
| Bun | `bun add @bunin/react-native-micro-frontend` | `bun add -d @bunin/react-native-micro-frontend-cli` |
| npm | `npm install @bunin/react-native-micro-frontend` | `npm install --save-dev @bunin/react-native-micro-frontend-cli` |
| pnpm | `pnpm add @bunin/react-native-micro-frontend` | `pnpm add -D @bunin/react-native-micro-frontend-cli` |
| Yarn | `yarn add @bunin/react-native-micro-frontend` | `yarn add -D @bunin/react-native-micro-frontend-cli` |
| Deno | `deno add npm:@bunin/react-native-micro-frontend` | `deno add --package-json --dev npm:@bunin/react-native-micro-frontend-cli` |

## グローバル install なしで CLI を実行する

| ツール | コマンド |
| --- | --- |
| Bun | `bunx @bunin/react-native-micro-frontend-cli init` |
| npm | `npx @bunin/react-native-micro-frontend-cli init` |
| pnpm | `pnpm dlx @bunin/react-native-micro-frontend-cli init` |
| Yarn 2+ | `yarn dlx @bunin/react-native-micro-frontend-cli init` |
| Deno | `deno run -A npm:@bunin/react-native-micro-frontend-cli init` |

## リポジトリ release コマンド

| 操作 | Bun | npm | pnpm | Yarn | Deno task |
| --- | --- | --- | --- | --- | --- |
| 一括 version 変更 | `bun run version:all 0.2.0` | `npm run version:all -- 0.2.0` | `pnpm version:all 0.2.0` | `yarn version:all 0.2.0` | `deno task version:all 0.2.0` |
| 検証 | `bun run release:check` | `npm run release:check` | `pnpm release:check` | `yarn release:check` | `deno task release:check` |
| 公開 dry-run | `bun run release:dry-run` | `npm run release:dry-run` | `pnpm release:dry-run` | `yarn release:dry-run` | `deno task release:dry-run` |
| 実際に公開 | `bun run release:publish` | `npm run release:publish` | `pnpm release:publish` | `yarn release:publish` | `deno task release:publish` |

リポジトリ release workflow 内部の test、build、pack、publish はすべて Bun を使います。外側のコマンドが別の package manager でも、CI には Bun を install してください。

`pnpm-workspace.yaml` と `.npmrc` により、repository の preferred `packageManager` が Bun でも pnpm を使用できます。

## `rnm publish` が出力する OTA 公開コマンド

| `--package-manager` | Hot Updater コマンド |
| --- | --- |
| `bun` | `bunx hot-updater deploy -p ios -c production` |
| `npm` | `npx hot-updater deploy -p ios -c production` |
| `pnpm` | `pnpm dlx hot-updater deploy -p ios -c production` |
| `yarn` | `yarn dlx hot-updater deploy -p ios -c production` |
| `deno` | `deno run -A npm:hot-updater deploy -p ios -c production` |

`rnm publish` は OTA eligibility を通過した場合だけ公開コマンドを出力します。

## Bundle archive command

CLI を install したあと MFE project で実行します。React Native bundling を実行し、`index.bundle`, `assets/`, `manifest.json` だけを archive にします。

```bash
rnm bundle --platform ios --host ../host-app --update-registry
```

各 runner でも同じ形で実行できます: `bunx ... bundle`, `npx ... bundle`, `pnpm dlx ... bundle`, `yarn dlx ... bundle`, `deno run -A ... bundle`.
