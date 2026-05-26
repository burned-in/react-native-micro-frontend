/** OTA mode for a micro frontend. */
export type OtaMode = 'auto' | 'manual' | 'disabled';
/** Supported OTA providers. */
export type OtaProvider = 'hot-updater' | 'expo' | 'none' | 'custom';
/** Native-change strategy for sync and publish. */
export type NativeChangePolicy = 'ask' | 'block' | 'apply-and-disable-ota';
/** MFE lifecycle status stored in the registry. */
export type MfeRegistryStatus = 'active' | 'blocked' | 'disabled';

/** Manifest for a single Micro Frontend bundle. */
export interface MfeManifest {
  /** Unique MFE name used by CLI and runtime loader. */
  readonly name: string;
  /** Semver-like MFE version. */
  readonly version: string;
  /** Entry file used by Metro bundle generation. */
  readonly entry: string;
  /** Path to the MFE project root. */
  readonly path: string;
  /** OTA policy for this MFE. */
  readonly ota: {
    readonly enabled: boolean;
    readonly mode: OtaMode;
    readonly provider: OtaProvider;
  };
  /** Native change handling policy for this MFE. */
  readonly nativeChangePolicy: NativeChangePolicy;
  /** Current registry status. */
  readonly status: MfeRegistryStatus;
  /** Optional block reason shown at runtime. */
  readonly blockedReason?: string;
  /** Native hash captured when this MFE was built or synced. */
  readonly nativeHash?: string;
  /** Optional embedded JS bundle path. */
  readonly embeddedBundlePath?: string;
  /** Optional OTA bundle URL or provider-specific key. */
  readonly otaBundleUrl?: string;
  /** Optional compressed bundle archive URL or provider-specific key. */
  readonly bundleArchiveUrl?: string;
}

/** Registry file consumed by the host runtime and CLI. */
export interface MfeRegistry {
  /** Schema version for migration-safe registry parsing. */
  readonly schemaVersion: 1;
  /** Host-native hash used to compare bundle compatibility. */
  readonly hostNativeHash?: string;
  /** Registered MFEs by name. */
  readonly mfes: Readonly<Record<string, MfeManifest>>;
}
