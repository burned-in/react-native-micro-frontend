import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type { NativeContract } from "@bunin/react-native-micro-frontend";
import { detectNativeContractChanges } from "@bunin/react-native-micro-frontend-native-contract";
import type { CliPrinter } from "../cli-output.printer.js";

/**
 * Handles `rnm diff <mfe>` by comparing host and MFE native contract snapshots.
 *
 * This command is read-only. It expects host `rnm.native-contract.json` and, when
 * available, `<mfe-path>/rnm.native-contract.json`.
 *
 * @param root Project root.
 * @param name MFE name.
 * @param printer Output sink.
 * @returns Exit code.
 */
export function runDiffCommand(
  root: string,
  name: string | undefined,
  printer: CliPrinter,
): number {
  if (!name) {
    printer.error("Usage: rnm diff <mfe-name>");
    return 1;
  }

  const registryPath = join(root, "rnm.registry.json");
  const hostContractPath = join(root, "rnm.native-contract.json");

  if (!existsSync(registryPath) || !existsSync(hostContractPath)) {
    printer.error("Missing rnm.registry.json or rnm.native-contract.json. Run `rnm init` first.");
    return 1;
  }

  const registry = JSON.parse(readFileSync(registryPath, "utf8")) as {
    mfes: Record<string, { path: string }>;
  };

  const mfe = registry.mfes[name];

  if (!mfe) {
    printer.error(`MFE not registered: ${name}`);
    return 1;
  }

  const mfeContractPath = resolve(root, mfe.path, "rnm.native-contract.json");

  if (!existsSync(mfeContractPath)) {
    printer.error(`MFE native contract not found: ${mfeContractPath}`);
    return 1;
  }

  const hostContract = readContract(hostContractPath);
  const mfeContract = readContract(mfeContractPath);
  const changes = detectNativeContractChanges(hostContract, mfeContract);
  const nativeBinaryChangeRequired = changes.some((change) => change.nativeBinaryChange);

  printer.log(`Detected changes for ${name}`);

  if (changes.length === 0) {
    printer.log("[OK] No native changes detected.");
  }

  for (const change of changes) {
    const level = change.nativeBinaryChange ? "FAIL" : "WARN";
    printer.log(`[${level}] ${change.area}: ${change.key} ${change.kind}`);
  }

  printer.log(`Native binary change required: ${nativeBinaryChangeRequired ? "YES" : "NO"}`);
  printer.log(`OTA possible: ${nativeBinaryChangeRequired ? "NO" : "YES"}`);
  printer.log(`Store release required: ${nativeBinaryChangeRequired ? "YES" : "NO"}`);

  return nativeBinaryChangeRequired ? 1 : 0;
}

function readContract(path: string): NativeContract {
  return JSON.parse(readFileSync(path, "utf8")) as NativeContract;
}
