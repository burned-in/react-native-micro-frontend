# General TS module example

Use this when the Host App and MFE project are in the same workspace and Metro can bundle the MFE source directly.

Key points:

1. Register the MFE with OTA disabled.
2. Use `withMfe` in `metro.config.js` so Metro watches the MFE root and maps shared packages to Host `node_modules`.
3. Keep the Host loader as a static import map. This is intentionally source-based; it is not a compressed bundle loader.

```bash
cd examples/general-ts/host-app
rnm add mfe-feature --path ../../mfe-feature --entry ./src/index.tsx --version 1.0.0 --no-ota --ota-provider none --ota-mode disabled
```

```tsx
const localModules = {
  'mfe-feature': () => import('../../../mfe-feature/src/index'),
};
```
