import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { MfeRegistry } from '@bunin/react-native-micro-frontend';
import type { CliPrinter } from '../cli-output.printer.js';

/**
 * Handles `rnm status` by printing registry state.
 *
 * This command reads rnm.registry.json and does not mutate files.
 *
 * @param root Project root.
 * @param printer Output sink.
 * @returns Exit code.
 */
export function runStatusCommand(root: string, printer: CliPrinter): number {
  const registryPath = join(root, 'rnm.registry.json');

  if (!existsSync(registryPath)) {
    printer.error('rnm.registry.json not found. Run `rnm init` first.');
    return 1;
  }

  const registry = JSON.parse(
    readFileSync(registryPath, 'utf8'),
  ) as MfeRegistry;
  const mfes = Object.values(registry.mfes);

  if (mfes.length === 0) {
    printer.log('No MFEs registered.');
    return 0;
  }

  for (const mfe of mfes) {
    const otaEnabledLabel = mfe.ota.enabled ? 'enabled' : 'disabled';
    const nativeHashLabel = mfe.nativeHash ?? 'unknown';

    printer.log(
      [
        mfe.name,
        `  OTA: ${otaEnabledLabel} / ${mfe.ota.mode} / ${mfe.ota.provider}`,
        `  Native hash: ${nativeHashLabel}`,
        `  Runtime: ${mfe.status}`,
      ].join('\n'),
    );
  }

  return 0;
}
