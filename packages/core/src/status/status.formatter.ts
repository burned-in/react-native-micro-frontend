import type { OtaEligibilityResult } from "../domain/ota/ota-eligibility.type.js";

/**
 * Formats an OTA eligibility result into stable CLI lines.
 *
 * @param result OTA result to print.
 * @returns Human-readable status lines without terminal color side effects.
 */
export function formatOtaEligibility(result: OtaEligibilityResult): readonly string[] {
  const lines = [
    `OTA possible: ${result.otaPossible ? "YES" : "NO"}`,
    `Store release required: ${result.storeReleaseRequired ? "YES" : "NO"}`,
    `Runtime load blocked: ${result.runtimeLoadBlocked ? "YES" : "NO"}`,
  ];
  return result.reasons.length === 0 ? lines : [...lines, "Reasons:", ...result.reasons.map((reason) => `- ${reason.code}: ${reason.message}`)];
}

/**
 * Returns a fixed warning box used when native changes disable OTA.
 *
 * @returns Multiline warning box.
 */
export function formatOtaDisabledBox(): string {
  return `┌──────────────────────────────────────────────┐\n│ OTA DISABLED                                 │\n├──────────────────────────────────────────────┤\n│ Native binary changes were applied.          │\n│ This MFE version cannot be released by OTA.  │\n│                                              │\n│ Required next step:                          │\n│ - Build new iOS binary                       │\n│ - Build new Android binary                   │\n│ - Submit to App Store / Play Store           │\n└──────────────────────────────────────────────┘`;
}

/**
 * Returns a fixed warning box used when an MFE is blocked after rejecting native changes.
 *
 * @returns Multiline warning box.
 */
export function formatMfeBlockedBox(): string {
  return `┌──────────────────────────────────────────────┐\n│ MFE BLOCKED                                  │\n├──────────────────────────────────────────────┤\n│ This MFE requires native changes that are    │\n│ missing from the host app.                   │\n│                                              │\n│ OTA publish: BLOCKED                         │\n│ Runtime load: BLOCKED                        │\n└──────────────────────────────────────────────┘`;
}
