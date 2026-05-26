# OTA example

Use this when the MFE is delivered remotely through Hot Updater or a custom OTA pipeline after native-safety verification.

Key points:

1. Register with `--ota-provider hot-updater --ota-mode manual` or your custom OTA metadata.
2. Run `rnm verify mfe-feature` before publish.
3. The Host `hotUpdater` loader delegates download and JavaScript evaluation to your OTA SDK. The local import below is only a development stub.

```bash
cd examples/ota/host-app
rnm add mfe-feature --path ../../mfe-feature --entry ./src/index.tsx --version 1.0.0 --ota-provider hot-updater --ota-mode manual
rnm verify mfe-feature
rnm publish mfe-feature --package-manager bun --channel production
```
