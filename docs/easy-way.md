# Easy Way

Choose a bundle, Hot Updater/OTA, or Expo path before wiring a Host App and an MFE.

## 1. Bundle — archive without OTA publish

Use this when the MFE should produce a portable archive but should **not** be published through Hot Updater or another OTA engine.

```bash
rnm bundle mfe-feature --platform ios --host ../host-app
```

Archive contents:

```txt
index.bundle
assets/
manifest.json
```

For bundle without OTA, keep registry OTA disabled and store only `bundleArchiveUrl` metadata.

```json
{
  "bundleArchiveUrl": ".bundle/rnm/mfe-feature.ios.ota.tar.gz",
  "ota": { "enabled": false, "mode": "disabled", "provider": "none" }
}
```

## 2. OTA — Hot Updater or custom delivery

Use this when remote delivery is required after native-safety verification.

```bash
rnm add mfe-feature --path ../mfe-feature --entry ./src/index.tsx --version 1.0.0 --ota-provider hot-updater --ota-mode manual
rnm verify mfe-feature
rnm publish mfe-feature --package-manager bun --channel production

# Expo EAS Update instead of Hot Updater
rnm add mfe-feature --path ../mfe-feature --entry ./src/index.tsx --version 1.0.0 --ota-provider expo --ota-mode manual
rnm expo mfe-feature --channel production --platform all --non-interactive
```

```tsx
const loadMfeModule = createMicroFrontendLoader({
  hotUpdater: loadWithHotUpdater,
  custom: loadWithCustomOta,
});
```

If verification fails because native assumptions changed, ship a store release instead of OTA.

## 3. Expo — managed or prebuild Host Apps

Expo Host Apps are supported. Use the Bundle path for embedded archives or the OTA path with Expo EAS Update, then let the RNM integration watcher handle native additions. See `examples/expo` for an Expo Host plus `mfe.config.mjs` sample; `mfe.config.cjs` is also supported through Bun. When the MFE is registered with `--ota-provider expo`, `rnm add` also shows and can apply missing Host packages such as `expo` and `expo-updates`.

```bash
rnm add mfe-feature --path ../mfe-feature
rnm all mfe-feature
# package -> AOS -> iOS
```

For Expo managed projects without `ios/` or `android/`, RNM writes `rnm.expo-plugin.cjs` and `rnm.expo-integration.json`, then adds the plugin to `app.json` when possible. Run Expo prebuild normally afterwards.

```bash
npx expo prebuild

# Deploy through Expo EAS Update after RNM safety checks
rnm expo mfe-feature --channel production --platform all --non-interactive
```

`rnm add`, `rnm bundle --host`, `rnm verify`, `rnm publish`, and `rnm expo` also run the integration watcher. Use `--yes` for non-interactive apply or `--skip-integration` to skip the watcher.
