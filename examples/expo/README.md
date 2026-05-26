# Expo example

This example shows an Expo managed/prebuild Host using RNM with an MFE whose local config is loaded through Bun.

## What this demonstrates

- Expo Host registration with `ota.provider: "expo"`.
- Managed/prebuild flow where RNM can generate an Expo config plugin before native folders exist.
- `mfe.config.mjs` support. `rnm bundle` also supports `mfe.config.cjs` through the same Bun loader path.

## Files

```txt
expo/
  host-app/
    app.json
    package.json
    rnm.registry.json
  mfe-feature/
    mfe.config.mjs
    src/index.tsx
```

## Commands

```sh
# in examples/expo/host-app
rnm add expo-mfe-feature --path ../mfe-feature --entry ./src/index.tsx --version 1.0.0 --ota-provider expo --ota-mode manual --yes
rnm all expo-mfe-feature --yes
npx expo prebuild

# after native-safety verification
rnm expo expo-mfe-feature --channel production --platform all --non-interactive
```
