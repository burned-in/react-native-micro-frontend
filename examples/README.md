# Examples

The examples are intentionally split by loading strategy so the loader name matches the real transport.

| Folder | Strategy | What it demonstrates |
| --- | --- | --- |
| [`bundle`](bundle/README.md) | Bundle archive without OTA publish | `rnm bundle` produces only `index.bundle`, `assets/`, `manifest.json`, and `.tar.gz`; the Host provides a custom archive loader. |
| [`ota`](ota/README.md) | OTA / Hot Updater or custom OTA | The Host delegates download/evaluation to Hot Updater or a custom OTA SDK after native-safety verification. |
| [`expo`](expo/README.md) | Expo managed/prebuild Host | Expo Host registration, EAS Update delivery, and Bun-loaded `mfe.config.mjs` / `mfe.config.cjs` support. |

Use `examples/mfe-feature` as the shared sample feature module for the Bundle and OTA paths.
