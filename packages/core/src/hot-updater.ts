/** Options attached to a Hot Updater config by the MFE adapter. */
export interface ReactNativeMicroFrontendHotUpdaterOptions {
  /** Path to rnm.registry.json. */
  readonly registry: string;
  /** Path to rnm.native-contract.json. */
  readonly nativeContract: string;
  /** Optional MFE channel prefix. */
  readonly channelPrefix?: string;
}

/** Hot Updater-like config object augmented with MFE metadata. */
export type HotUpdaterConfigWithMfe<T extends object> = T & {
  readonly reactNativeMicroFrontend: ReactNativeMicroFrontendHotUpdaterOptions;
};

/**
 * Wraps an existing Hot Updater config with MFE metadata without mutating the original object.
 *
 * This core export mirrors the adapter package so app configs can import from
 * `@bunin/react-native-micro-frontend/hot-updater` without creating a package cycle.
 *
 * @param baseConfig Existing Hot Updater config object.
 * @param options MFE registry and native contract paths.
 * @returns New config object with MFE metadata attached.
 */
export function withReactNativeMicroFrontend<T extends object>(
  baseConfig: T,
  options: ReactNativeMicroFrontendHotUpdaterOptions,
): HotUpdaterConfigWithMfe<T> {
  return { ...baseConfig, reactNativeMicroFrontend: options };
}
