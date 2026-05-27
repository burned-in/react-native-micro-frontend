# Easy Way

Host App と MFE を接続する前に、3 つのメニューから 1 つを選びます。

## 1. Bundle — OTA publish なしの archive

MFE が portable archive を作るが OTA publish はしない場合に使います。

```bash
rnm bundle mfe-feature --platform ios --host ../host-app
```

archive には次の files だけが入ります。

```txt
index.bundle
assets/
manifest.json
```

OTA なしの bundle 方式では registry OTA を無効にし、`bundleArchiveUrl` metadata だけを保持します。

```json
{
  "bundleArchiveUrl": ".bundle/rnm/mfe-feature.ios.ota.tar.gz",
  "ota": { "enabled": false, "mode": "disabled", "provider": "none" }
}
```

## 2. OTA — Hot Updater または custom delivery

native-safety verification 後に remote delivery が必要な場合に使います。

```bash
rnm add mfe-feature --path ../mfe-feature --entry ./src/index.tsx --version 1.0.0 --ota-provider hot-updater --ota-mode manual
rnm verify mfe-feature
rnm publish mfe-feature --package-manager bun --channel production

# Hot Updater の代わりに Expo EAS Update を使う
rnm add mfe-feature --path ../mfe-feature --entry ./src/index.tsx --version 1.0.0 --ota-provider expo --ota-mode manual
rnm expo mfe-feature --channel production --platform all --non-interactive
```

```tsx
const loadMfeModule = createMicroFrontendLoader({
  hotUpdater: loadWithHotUpdater,
  custom: loadWithCustomOta,
});
```

native assumption が変わって verification が失敗した場合は、OTA ではなく Store release を行います。

## 3. Expo — managed または prebuild Host App

Expo Host App もサポートします。embedded archive は Bundle、リモート配信は Expo EAS Update の OTA 経路を使い、RNM integration watcher に native additions を処理させます。MFE を `--ota-provider expo` で登録すると、`rnm add` は `expo`、`expo-updates` など Host に不足している package も表示し、適用できます。

```bash
rnm add mfe-feature --path ../mfe-feature
rnm all mfe-feature
# package -> AOS -> iOS
```

`ios/` または `android/` がまだ無い Expo managed project では、RNM が `rnm.expo-plugin.cjs` と `rnm.expo-integration.json` を生成し、可能な場合は `app.json` に plugin を追加します。その後は通常どおり Expo prebuild を実行します。

```bash
npx expo prebuild
```

`rnm add`、`rnm bundle --host`、`rnm verify`、`rnm publish` でも integration watcher が動きます。非対話で自動適用する場合は `--yes`、watcher を省略する場合は `--skip-integration` を使います。
