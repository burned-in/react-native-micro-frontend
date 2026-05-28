# Package managers と CLI command

このプロジェクトは Bun 優先で、利用側 workflow では `bun`、`npm`、`pnpm`、`yarn`、`deno` をサポートします。この page では integration、watcher、bundle、verify、publish flow に追加した RNM CLI command もすべて整理します。

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
| 一括 version 変更 | `bun run version:all 0.7.0` | `npm run version:all -- 0.7.0` | `pnpm version:all 0.7.0` | `yarn version:all 0.7.0` | `deno task version:all 0.7.0` |
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

Expo EAS Update は `rnm expo` または `rnm publish --provider expo` で使えます。

| `--package-manager` | Expo EAS Update コマンド |
| --- | --- |
| `bun` | `bunx eas-cli@latest update --channel production --message 'RNM mfe-feature@1.0.0' --platform all` |
| `npm` | `npx eas-cli@latest update --channel production --message 'RNM mfe-feature@1.0.0' --platform all` |
| `pnpm` | `pnpm dlx eas-cli@latest update --channel production --message 'RNM mfe-feature@1.0.0' --platform all` |
| `yarn` | `yarn dlx eas-cli@latest update --channel production --message 'RNM mfe-feature@1.0.0' --platform all` |
| `deno` | `deno run -A npm:eas-cli update --channel production --message 'RNM mfe-feature@1.0.0' --platform all` |

EAS workflow に必要な場合は `--branch`、`--auto`、`--environment`、`--non-interactive` を併用してください。

## Bundle archive command

CLI を install したあと MFE project で実行します。React Native bundling を実行し、参照された runtime assets を自動収集して、`index.bundle`, `manifest.json`, 検証済み asset files だけを archive にします。

```bash
rnm bundle mfe-feature --platform ios --host ../host-app --update-registry --yes
```

最終 tarball を作らず asset 収集結果だけを確認する場合は `rnm bundle-asset mfe-feature --platform ios --entry ./src/index.tsx` を実行してください。Dynamic require には `--asset-glob` を fallback として使います。

各 runner でも同じ形で実行できます: `bunx ... bundle`, `npx ... bundle`, `pnpm dlx ... bundle`, `yarn dlx ... bundle`, `deno run -A ... bundle`. `--host` 使用時は CLI が `rnm.bundle-archives.ts` を生成し、Host entry import を確認します。`--yes` または `--register-archives` で自動適用できます。

## RNM CLI command reference

install 済み CLI version が対応する正確な options は help で確認できます。

```bash
rnm --help
rnm help
rnm <command> --help
rnm <command> -h
```

### Host integration commands

| Command | 用途 |
| --- | --- |
| `rnm package <mfe>` | 不足している JS/native package dependency を検出し、確認後に Host `package.json` へ追加します。 |
| `rnm aos <mfe>` / `rnm android <mfe>` | Android Gradle project、Gradle dependency、permission を検出し、generated Android include files または Expo plugin data を書きます。 |
| `rnm ios <mfe>` | iOS Pods を検出し、generated Podfile include files または Expo plugin data を書きます。 |
| `rnm all <mfe>` | 安全な順序で全 integration を実行します: `package -> AOS -> iOS`。 |
| `rnm integrate all <mfe>` | backward-compatible な explicit integration route です。 |
| `rnm expo <mfe>` | 同じ integration watcher と OTA eligibility gate を実行し、Expo EAS Update deploy command を出力します。 |

```bash
rnm package mfe-feature --dry-run
rnm aos mfe-feature --yes
rnm android mfe-feature --yes
rnm ios mfe-feature --yes
rnm all mfe-feature --yes
```

### Expo support

同じ CLI command が Expo managed、prebuild、bare/prebuilt Host App をすべてサポートします。bare/prebuilt project では generated Podfile/Gradle include files を書き、`ios/` または `android/` が無い managed project では `rnm.expo-plugin.cjs` と `rnm.expo-integration.json` を生成し、可能なら `app.json` に plugin を追加します。

```bash
rnm add mfe-feature --path ../mfe-feature --yes
rnm all mfe-feature --yes
npx expo prebuild
```

Expo EAS Update で配信する場合は、MFE を Expo OTA provider として登録し、RNM の native-safety gate 通過後に EAS deploy command を出力します。`rnm add --ota-provider expo` を実行すると、package watcher が `expo`、`expo-updates` など Host に不足している package も表示し、yes を選ぶか `--yes` を渡すと一緒に適用します。

```bash
rnm add mfe-feature --path ../mfe-feature --ota-provider expo --ota-mode manual --yes
rnm expo mfe-feature --channel production --platform all --non-interactive
# publish からも同じ route を使えます
rnm publish mfe-feature --provider expo --channel production --platform all --non-interactive
```

### Automatic integration watcher

`rnm add`、`rnm bundle --host`、`rnm verify`、`rnm publish`、`rnm expo` は元の task を続ける前に不足している `package -> AOS -> iOS` additions を監視します。interactive terminal では RNM が適用するか確認します。

```bash
rnm add mfe-feature --path ../mfe-feature --yes
rnm bundle mfe-feature --platform ios --host ../host-app --yes
rnm verify mfe-feature --skip-integration
rnm publish mfe-feature --package-manager bun --channel production --skip-integration
rnm expo mfe-feature --channel production --platform all --skip-integration
```

automation で非対話適用する場合は `--yes`、直接 integration command で変更点を見る場合は `--dry-run`、元の add/bundle/verify/publish/expo command だけ実行したい場合は `--skip-integration` を使います。

### Lifecycle and diagnostics commands

| Command | 用途 |
| --- | --- |
| `rnm init` | review 可能な Host config、registry、native contract、generated include files を作成します。 |
| `rnm build` | React Native bundle command と optional archive output path を出力します。 |
| `rnm bundle` | `index.bundle`、`manifest.json`、実際に参照された runtime assets だけを含む minimal archive を作成します。 |
| `rnm diff` | Host と MFE の native contracts を比較します。 |
| `rnm sync` | MFE block や native change 後の OTA disable など native-change decision を記録します。 |
| `rnm status` | `rnm.registry.json` から registered MFE status を出力します。 |
| `rnm doctor` | project setup を read-only で診断します。 |
| `rnm rollback` | existing files の patch 前に作られた `.bak` files を復旧します。 |

