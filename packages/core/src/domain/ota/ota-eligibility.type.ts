import type { NativeContractChange } from "../native-contract.type.js";

/** OTA decision status for one MFE version. */
export type OtaEligibilityStatus =
  | "available"
  | "disabled"
  | "blocked-by-native-change"
  | "blocked-by-native-hash-mismatch"
  | "blocked-by-policy"
  | "blocked-by-runtime"
  | "blocked-by-react-native-version"
  | "blocked-by-hermes-setting"
  | "blocked-by-new-architecture-setting";

/** Reason attached to an OTA block or warning. */
export interface OtaBlockReason {
  /** Stable reason code for CLI and CI output. */
  readonly code: string;
  /** Human-readable explanation. */
  readonly message: string;
  /** Whether the reason requires a new store binary. */
  readonly storeReleaseRequired: boolean;
}

/** Input for OTA eligibility checks. */
export interface CheckOtaEligibilityInput {
  /** Whether OTA is enabled by config for this MFE. */
  readonly otaEnabled: boolean;
  /** Whether the MFE is already marked blocked in the registry. */
  readonly mfeBlocked: boolean;
  /** Whether React Native version changed between MFE and host. */
  readonly reactNativeVersionMismatch: boolean;
  /** Whether Hermes enablement changed between MFE and host. */
  readonly hermesSettingMismatch: boolean;
  /** Whether New Architecture enablement changed between MFE and host. */
  readonly newArchitectureSettingMismatch: boolean;
  /** Whether native contract diff contains binary-affecting changes. */
  readonly nativeChanged: boolean;
  /** Whether nativeHash differs between MFE and host. */
  readonly nativeHashMismatch: boolean;
  /** Optional domain-level changes that explain nativeChanged. */
  readonly nativeChanges?: readonly NativeContractChange[];
  /** Optional policy reason when OTA is disabled by operational rules. */
  readonly policyReason?: string;
}

/** Result of evaluating whether an MFE can be delivered by OTA. */
export interface OtaEligibilityResult {
  /** Machine-readable final status. */
  readonly status: OtaEligibilityStatus;
  /** True only when OTA publishing is safe for the current host binary. */
  readonly otaPossible: boolean;
  /** True when an App Store / Play Store binary release is required. */
  readonly storeReleaseRequired: boolean;
  /** True when runtime should refuse to load the MFE. */
  readonly runtimeLoadBlocked: boolean;
  /** Ordered reasons used by CLI, CI and runtime fallbacks. */
  readonly reasons: readonly OtaBlockReason[];
}
