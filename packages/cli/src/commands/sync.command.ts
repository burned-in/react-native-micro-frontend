import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  MfeManifest,
  MfeRegistry,
} from '@bunin/react-native-micro-frontend';
import {
  formatMfeBlockedBox,
  formatOtaDisabledBox,
} from '@bunin/react-native-micro-frontend';
import type { CliPrinter } from '../cli-output.printer.js';

/**
 * Handles `rnm sync <mfe>` native-change policy updates in the registry.
 *
 * Side effects: updates rnm.registry.json only when `--apply-native` or
 * `--block-native` is explicitly provided. Native files remain protected for
 * future confirmed patch plans.
 *
 * @param root Project root.
 * @param name MFE name.
 * @param flags CLI flags.
 * @param printer Output sink.
 * @returns Exit code.
 */
export function runSyncCommand(
  root: string,
  name: string | undefined,
  flags: Readonly<Record<string, string | boolean>>,
  printer: CliPrinter,
): number {
  if (!name) {
    printer.error('Usage: rnm sync <mfe-name> --apply-native|--block-native');
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

  const mfes: Record<string, MfeManifest> = { ...registry.mfes };

  if (flags['apply-native'] === true) {
    mfes[name] = {
      ...mfe,
      ota: {
        ...mfe.ota,
        enabled: false,
      },
      status: 'active',
    };

    writeRegistry(registryPath, {
      ...registry,
      mfes,
    });

    printer.log(formatOtaDisabledBox());
    return 0;
  }

  if (flags['block-native'] === true) {
    mfes[name] = {
      ...mfe,
      status: 'blocked',
      blockedReason: 'Required native changes were not applied.',
    };

    writeRegistry(registryPath, {
      ...registry,
      mfes,
    });

    printer.log(formatMfeBlockedBox());
    return 0;
  }

  printer.error(
    'Native binary changes require explicit --apply-native or --block-native in CI/non-interactive mode.',
  );

  return 1;
}

function writeRegistry(path: string, registry: MfeRegistry): void {
  const serializedRegistry = JSON.stringify(registry, null, 2);
  writeFileSync(path, `${serializedRegistry}\n`);
}
