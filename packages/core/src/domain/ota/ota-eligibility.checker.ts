import type { CheckOtaEligibilityInput, OtaBlockReason, OtaEligibilityResult, OtaEligibilityStatus } from "./ota-eligibility.type.js";

function reason(code: string, message: string, storeReleaseRequired: boolean): OtaBlockReason {
  return { code, message, storeReleaseRequired };
}

/**
 * Determines whether a micro frontend bundle can be delivered through OTA.
 *
 * This function never mutates project files. It only evaluates manifest/config
 * state, host compatibility state, and native contract compatibility. Native
 * binary changes always override user OTA preferences: even when OTA is enabled,
 * a native hash mismatch blocks OTA and requires a store release.
 *
 * @param input Eligibility facts produced by config, native diff, and registry checks.
 * @returns OTA eligibility result with explicit block reasons and store-release signal.
 */
export function checkOtaEligibility(input: CheckOtaEligibilityInput): OtaEligibilityResult {
  if (!input.otaEnabled) {
    return blocked("disabled", [reason("OTA_DISABLED", "OTA is disabled for this MFE.", false)], false, false);
  }

  if (input.reactNativeVersionMismatch) {
    return blocked("blocked-by-react-native-version", [reason("RN_VERSION_CHANGED", "React Native version changed. Full app release is required.", true)], true, true);
  }

  if (input.hermesSettingMismatch) {
    return blocked("blocked-by-hermes-setting", [reason("HERMES_SETTING_CHANGED", "Hermes setting changed. Store release is required.", true)], true, true);
  }

  if (input.newArchitectureSettingMismatch) {
    return blocked("blocked-by-new-architecture-setting", [reason("NEW_ARCHITECTURE_SETTING_CHANGED", "New Architecture setting changed. Store release is required.", true)], true, true);
  }

  if (input.nativeChanged) {
    const nativeReasons = (input.nativeChanges ?? []).map((change) =>
      reason("NATIVE_CHANGE", `${change.area}: ${change.key} ${change.kind}`, true),
    );
    return blocked("blocked-by-native-change", nativeReasons.length > 0 ? nativeReasons : [reason("NATIVE_CHANGE", "Native binary change detected.", true)], true, true);
  }

  if (input.nativeHashMismatch) {
    return blocked("blocked-by-native-hash-mismatch", [reason("NATIVE_HASH_MISMATCH", "nativeHash does not match the host binary.", true)], true, true);
  }

  if (input.mfeBlocked) {
    return blocked("blocked-by-runtime", [reason("MFE_BLOCKED", "MFE is blocked because required native changes were not applied.", false)], false, true);
  }

  if (input.policyReason) {
    return blocked("blocked-by-policy", [reason("POLICY_BLOCK", input.policyReason, false)], false, false);
  }

  return { status: "available", otaPossible: true, storeReleaseRequired: false, runtimeLoadBlocked: false, reasons: [] };
}

function blocked(status: OtaEligibilityStatus, reasons: readonly OtaBlockReason[], storeReleaseRequired: boolean, runtimeLoadBlocked: boolean): OtaEligibilityResult {
  return { status, otaPossible: false, storeReleaseRequired, runtimeLoadBlocked, reasons };
}
