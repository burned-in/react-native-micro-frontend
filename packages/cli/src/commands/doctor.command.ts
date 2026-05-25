import { analyzeHostProject } from "@bunin/react-native-micro-frontend-integration";
import { detectHotUpdater } from "@bunin/react-native-micro-frontend-hot-updater-adapter";
import { detectMetro } from "@bunin/react-native-micro-frontend-metro-adapter";
import type { CliPrinter } from "../cli-output.printer.js";

/**
 * Handles `rnm doctor` by checking host integration state.
 *
 * This command is read-only and never patches project files.
 *
 * @param root Project root.
 * @param printer Output sink.
 * @returns Exit code.
 */
export function runDoctorCommand(root: string, printer: CliPrinter): number {
  const analysis = analyzeHostProject(root);
  const hotUpdater = detectHotUpdater(root);
  const metro = detectMetro(root);
  printer.log(`[${analysis.projectType !== "unknown" ? "OK" : "FAIL"}] React Native project detected: ${analysis.projectType}`);
  printer.log(`[${analysis.reactNativeVersion ? "OK" : "WARN"}] React Native version: ${analysis.reactNativeVersion ?? "unknown"}`);
  printer.log(`[OK] Package manager: ${analysis.packageManager.name}`);
  printer.log(`[${analysis.iosDetected ? "OK" : "WARN"}] iOS folder ${analysis.iosDetected ? "detected" : "missing"}`);
  printer.log(`[${analysis.androidDetected ? "OK" : "WARN"}] Android folder ${analysis.androidDetected ? "detected" : "missing"}`);
  printer.log(`[${metro.metroDetected ? "OK" : "WARN"}] Metro config ${metro.metroConfigPath ?? "missing"}`);
  printer.log(`[${metro.repackDetected ? "FAIL" : "OK"}] Re.Pack not installed`);
  printer.log(`[${hotUpdater.detected ? "OK" : "WARN"}] Hot Updater ${hotUpdater.detected ? "detected" : "not detected"}`);
  return metro.repackDetected ? 1 : 0;
}
