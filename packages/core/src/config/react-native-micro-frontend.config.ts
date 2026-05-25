import type { MfeConfig } from "../domain/config.type.js";
import type { ReactNativeMicroFrontendConfig } from "../domain/config.type.js";

/** Default host config used by normalize when users omit optional policy fields. */
export const DEFAULT_REACT_NATIVE_MICRO_FRONTEND_CONFIG: ReactNativeMicroFrontendConfig = {
  reactNative: { minVersion: "0.70.0", hermes: "optional", newArchitecture: "supported" },
  ota: { enabled: true, provider: "hot-updater", mode: "manual" },
  nativeChangePolicy: "ask",
  packageManager: { supported: ["bun", "deno", "npm", "pnpm", "yarn"], strategy: "follow-host" },
  package: { sync: "manual", sharedStrategy: "strict-singleton" },
  ios: { pods: "manual" },
  android: { integration: "manual" },
  mfes: {},
};

/**
 * Declares a host-level @bunin/react-native-micro-frontend config with type inference.
 *
 * This helper has no side effects; it exists so config files can be validated by TypeScript.
 *
 * @param config Host config object.
 * @returns The same config object.
 */
export function defineReactNativeMicroFrontendConfig(config: ReactNativeMicroFrontendConfig): ReactNativeMicroFrontendConfig {
  return config;
}

/**
 * Declares an MFE-level config with type inference.
 *
 * This helper has no side effects and does not read project files.
 *
 * @param config MFE config object.
 * @returns The same MFE config object.
 */
export function defineMfeConfig(config: MfeConfig): MfeConfig {
  return config;
}

/**
 * Normalizes a partial config into explicit policy values.
 *
 * Defaults are filled in one place so the rest of the system never depends on
 * hidden behavior. This function has no IO side effects.
 *
 * @param userConfig Partial user config loaded from a config file.
 * @returns Fully specified host configuration.
 */
export function normalizeReactNativeMicroFrontendConfig(userConfig: Partial<ReactNativeMicroFrontendConfig>): ReactNativeMicroFrontendConfig {
  return {
    reactNative: { ...DEFAULT_REACT_NATIVE_MICRO_FRONTEND_CONFIG.reactNative, ...userConfig.reactNative },
    ota: { ...DEFAULT_REACT_NATIVE_MICRO_FRONTEND_CONFIG.ota, ...userConfig.ota },
    nativeChangePolicy: userConfig.nativeChangePolicy ?? DEFAULT_REACT_NATIVE_MICRO_FRONTEND_CONFIG.nativeChangePolicy,
    packageManager: { ...DEFAULT_REACT_NATIVE_MICRO_FRONTEND_CONFIG.packageManager, ...userConfig.packageManager },
    package: { ...DEFAULT_REACT_NATIVE_MICRO_FRONTEND_CONFIG.package, ...userConfig.package },
    ios: { ...DEFAULT_REACT_NATIVE_MICRO_FRONTEND_CONFIG.ios, ...userConfig.ios },
    android: { ...DEFAULT_REACT_NATIVE_MICRO_FRONTEND_CONFIG.android, ...userConfig.android },
    mfes: userConfig.mfes ?? {},
  };
}
