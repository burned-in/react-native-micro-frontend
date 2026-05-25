import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  MfeRegistry,
  PackageManagerName,
} from '@bunin/react-native-micro-frontend';
import {
  checkOtaEligibility,
  formatOtaEligibility,
} from '@bunin/react-native-micro-frontend';
import { generateHotUpdaterDeployCommand } from '@bunin/react-native-micro-frontend-hot-updater-adapter';
import type { CliPrinter } from '../cli-output.printer.js';

/**
 * Handles `rnm publish <mfe>` by running the OTA eligibility gate and printing deploy commands.
 *
 * This command does not publish unless a future command runner is explicitly
 * wired. It prevents unsafe OTA by failing on nativeHash mismatch/block states.
 *
 * @param root Project root.
 * @param name MFE name.
 * @param flags CLI flags.
 * @param printer Output sink.
 * @returns Exit code.
 */
export function runPublishCommand(
  root: string,
  name: string | undefined,
  flags: Readonly<Record<string, string | boolean>>,
  printer: CliPrinter,
): number {
  if (!name) {
    printer.error('Usage: rnm publish <mfe-name>');
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
    otaEnabled: mfe.ota.enabled && flags['no-ota'] !== true,
    mfeBlocked: mfe.status === 'blocked',
    reactNativeVersionMismatch: false,
    hermesSettingMismatch: false,
    newArchitectureSettingMismatch: false,
    nativeChanged: false,
    nativeHashMismatch,
  });

  for (const line of formatOtaEligibility(result)) {
    printer.log(line);
  }

  if (!result.otaPossible) {
    printer.error(
      'OTA PUBLISH BLOCKED. Required: Store release or native contract fix.',
    );
    return 1;
  }

  const packageManager = packageManagerFlag(flags['package-manager']);
  const channel =
    typeof flags.channel === 'string' ? flags.channel : 'production';

  for (const platform of ['ios', 'android'] as const) {
    const deployCommand = generateHotUpdaterDeployCommand({
      packageManager,
      platform,
      channel,
    });

    printer.log(deployCommand.join(' '));
  }

  return 0;
}

function packageManagerFlag(
  value: string | boolean | undefined,
): PackageManagerName {
  if (
    value === 'bun' ||
    value === 'deno' ||
    value === 'pnpm' ||
    value === 'yarn' ||
    value === 'npm'
  ) {
    return value;
  }

  return 'npm';
}
