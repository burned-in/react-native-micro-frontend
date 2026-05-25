import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { MfeRegistry } from '@bunin/react-native-micro-frontend';
import {
  checkOtaEligibility,
  formatOtaEligibility,
} from '@bunin/react-native-micro-frontend';
import type { CliPrinter } from '../cli-output.printer.js';

/**
 * Handles `rnm verify <mfe>` by checking registry nativeHash and block policy.
 *
 * This read-only command performs the final OTA gate used by CI and publish.
 *
 * @param root Project root.
 * @param name MFE name.
 * @param printer Output sink.
 * @returns Exit code.
 */
export function runVerifyCommand(
  root: string,
  name: string | undefined,
  printer: CliPrinter,
): number {
  if (!name) {
    printer.error('Usage: rnm verify <mfe-name>');
    return 1;
  }

  const registryPath = join(root, 'rnm.registry.json');

  if (!existsSync(registryPath)) {
    printer.error('rnm.registry.json not found.');
    return 1;
  }

  const registry = JSON.parse(
    readFileSync(registryPath, 'utf8'),
  ) as MfeRegistry;
  const mfe = registry.mfes[name];

  if (!mfe) {
    printer.error(`MFE not registered: ${name}`);
    return 1;
  }

  const nativeHashMismatch = Boolean(
    registry.hostNativeHash &&
      mfe.nativeHash &&
      registry.hostNativeHash !== mfe.nativeHash,
  );

  const result = checkOtaEligibility({
    otaEnabled: mfe.ota.enabled,
    mfeBlocked: mfe.status === 'blocked',
    reactNativeVersionMismatch: false,
    hermesSettingMismatch: false,
    newArchitectureSettingMismatch: false,
    nativeChanged: false,
    nativeHashMismatch,
  });

  printer.log(`Verification result for ${name}`);

  for (const line of formatOtaEligibility(result)) {
    printer.log(line);
  }

  return result.otaPossible ? 0 : 1;
}
