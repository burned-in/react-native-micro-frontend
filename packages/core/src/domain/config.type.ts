import type {
  NativeChangePolicy,
  OtaMode,
  OtaProvider,
} from './mfe-manifest.type.js';
import type { PackageManagerName } from './package/package-manager.type.js';

/** Integration mode selected by `rnm init` or `rnm integrate`. */
export type IntegrationMode =
  | 'safe-minimal'
  | 'full'
  | 'config-only'
  | 'dry-run'
  | 'manual-guide';
/** iOS generated include handling mode. */
export type IosPodIntegrationMode =
  | 'auto'
  | 'manual'
  | 'disabled'
  | 'warn-only';
/** Android generated include handling mode. */
export type AndroidIntegrationMode =
  | 'auto'
  | 'manual'
  | 'disabled'
  | 'warn-only';
/** package.json synchronization policy. */
export type PackageSyncMode = 'auto' | 'manual' | 'warn-only' | 'disabled';
/** Shared dependency policy. */
export type SharedDependencyStrategy =
  | 'strict-singleton'
  | 'compatible-semver'
  | 'warn-only'
  | 'manual';
/** Package manager strategy across host and MFEs. */
export type PackageManagerStrategy =
  | 'follow-host'
  | 'follow-mfe'
  | 'ask-every-time'
  | 'manual'
  | 'follow-existing-project';

/** Host-level library configuration. */
export interface ReactNativeMicroFrontendConfig {
  /** React Native compatibility settings included in nativeHash policy. */
  readonly reactNative: {
    readonly minVersion: string;
    readonly hermes: 'required' | 'optional' | 'disabled';
    readonly newArchitecture: 'required' | 'supported' | 'disabled';
  };
  /** Default OTA settings. */
  readonly ota: {
    readonly enabled: boolean;
    readonly provider: OtaProvider;
    readonly mode: OtaMode;
    readonly existingHotUpdater?: {
      readonly strategy: 'reuse' | 'wrap' | 'separate' | 'disable' | 'manual';
      readonly configPath?: string;
    };
  };
  /** Default native-change handling. */
  readonly nativeChangePolicy: NativeChangePolicy;
  /** Package manager support and default strategy. */
  readonly packageManager: {
    readonly supported: readonly PackageManagerName[];
    readonly strategy: PackageManagerStrategy;
    readonly explicit?: PackageManagerName;
  };
  /** package.json and shared dependency policy. */
  readonly package: {
    readonly sync: PackageSyncMode;
    readonly sharedStrategy: SharedDependencyStrategy;
  };
  /** iOS integration policy. */
  readonly ios: { readonly pods: IosPodIntegrationMode };
  /** Android integration policy. */
  readonly android: { readonly integration: AndroidIntegrationMode };
  /** Per-MFE configuration map. */
  readonly mfes: Readonly<Record<string, MfeConfig>>;
}

/** MFE-local config shape used by `mfe.config.ts`. */
export interface MfeConfig {
  readonly name: string;
  readonly version: string;
  readonly path?: string;
  readonly entry: string;
  readonly reactNative?: ReactNativeMicroFrontendConfig['reactNative'];
  readonly ota: {
    readonly enabled: boolean;
    readonly mode: OtaMode;
    readonly provider?: OtaProvider;
  };
  readonly nativeChangePolicy: NativeChangePolicy;
  readonly packageManager?: {
    readonly strategy: PackageManagerStrategy;
    readonly explicit?: PackageManagerName;
  };
  readonly package?: {
    readonly sync?: PackageSyncMode;
    readonly sharedStrategy?: SharedDependencyStrategy;
    readonly dependencies?: Readonly<Record<string, string>>;
  };
  readonly ios?: {
    readonly pods?: readonly {
      readonly name: string;
      readonly path?: string;
      readonly version?: string;
      readonly required: boolean;
    }[];
    readonly mode?: IosPodIntegrationMode;
  };
  readonly android?: {
    readonly gradleProjects?: readonly {
      readonly name: string;
      readonly path?: string;
      readonly required: boolean;
    }[];
    readonly permissions?: readonly string[];
    readonly mode?: AndroidIntegrationMode;
  };
}
