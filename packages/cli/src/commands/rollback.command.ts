import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { restoreBackup } from '@bunin/react-native-micro-frontend-integration';
import type { CliPrinter } from '../cli-output.printer.js';

/**
 * Handles `rnm rollback` by restoring known `.bak` files.
 *
 * Side effects: only runs with `--yes`; restores backup siblings for known host
 * files touched by integration/sync flows.
 *
 * @param root Project root.
 * @param flags CLI flags.
 * @param printer Output sink.
 * @returns Exit code.
 */
export function runRollbackCommand(
  root: string,
  flags: Readonly<Record<string, string | boolean>>,
  printer: CliPrinter,
): number {
  const candidates = [
    'package.json',
    'metro.config.js',
    'ios/Podfile',
    'android/settings.gradle',
    'android/app/build.gradle',
    'rnm.registry.json',
    'rnm.native-contract.json',
  ];

  const existingBackups = candidates.filter((path) => {
    return existsSync(join(root, `${path}.bak`));
  });

  if (existingBackups.length === 0) {
    printer.log('No rollback backups found.');
    return 0;
  }

  for (const path of existingBackups) {
    printer.log(`[ROLLBACK] ${path}.bak -> ${path}`);
  }

  if (flags.yes !== true) {
    printer.error('Use --yes to restore backups in non-interactive mode.');
    return 1;
  }

  for (const path of existingBackups) {
    const result = restoreBackup(root, path);

    if (!result.ok) {
      printer.error(`${result.error.path}: ${result.error.message}`);
      return 1;
    }
  }

  printer.log('[OK] Rollback complete.');
  return 0;
}
