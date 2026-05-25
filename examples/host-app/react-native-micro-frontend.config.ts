import { defineReactNativeMicroFrontendConfig } from "@bunin/react-native-micro-frontend";

export default defineReactNativeMicroFrontendConfig({
  reactNative: { minVersion: "0.70.0", hermes: "required", newArchitecture: "supported" },
  ota: { enabled: true, provider: "hot-updater", mode: "manual", existingHotUpdater: { strategy: "reuse", configPath: "./hot-updater.config.ts" } },
  nativeChangePolicy: "ask",
  packageManager: { supported: ["bun", "deno", "npm", "pnpm", "yarn"], strategy: "follow-host" },
  package: { sync: "manual", sharedStrategy: "strict-singleton" },
  ios: { pods: "manual" },
  android: { integration: "manual" },
  mfes: {
    "mfe-feature": {
      name: "mfe-feature",
      version: "1.0.0",
      path: "../mfe-feature",
      entry: "./src/index.tsx",
      ota: { enabled: true, mode: "manual", provider: "hot-updater" },
      nativeChangePolicy: "ask",
    },
  },
});
