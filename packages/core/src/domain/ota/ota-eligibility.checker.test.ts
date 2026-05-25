import { describe, expect, test } from "bun:test";
import { checkOtaEligibility } from "./ota-eligibility.checker.js";

describe("checkOtaEligibility", () => {
  test("allows JS-only OTA when all native gates match", () => {
    const result = checkOtaEligibility({ otaEnabled: true, mfeBlocked: false, reactNativeVersionMismatch: false, hermesSettingMismatch: false, newArchitectureSettingMismatch: false, nativeChanged: false, nativeHashMismatch: false });
    expect(result.otaPossible).toBe(true);
    expect(result.storeReleaseRequired).toBe(false);
  });

  test("blocks Hermes changes with store release", () => {
    const result = checkOtaEligibility({ otaEnabled: true, mfeBlocked: false, reactNativeVersionMismatch: false, hermesSettingMismatch: true, newArchitectureSettingMismatch: false, nativeChanged: false, nativeHashMismatch: false });
    expect(result.status).toBe("blocked-by-hermes-setting");
    expect(result.storeReleaseRequired).toBe(true);
  });

  test("blocks native hash mismatch", () => {
    const result = checkOtaEligibility({ otaEnabled: true, mfeBlocked: false, reactNativeVersionMismatch: false, hermesSettingMismatch: false, newArchitectureSettingMismatch: false, nativeChanged: false, nativeHashMismatch: true });
    expect(result.otaPossible).toBe(false);
    expect(result.storeReleaseRequired).toBe(true);
  });
});
