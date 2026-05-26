import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  MfeManifest,
  MfeRegistry,
} from '@bunin/react-native-micro-frontend';
import { createEmptyRegistry } from '@bunin/react-native-micro-frontend';
import type { CliPrinter } from '../cli-output.printer.js';

/**
 * Handles `rnm add <mfe>` by registering a micro frontend in rnm.registry.json.
 *
 * Side effects: writes rnm.registry.json. This command does not mutate native
 * host files and therefore remains safe for existing React Native apps.
 *
 * @param root Project root.
 * @param name MFE name.
 * @param flags CLI flags for path, entry, version, and OTA.
 * @param printer Output sink.
 * @returns Exit code.
 */
export function runAddCommand(
  root: string,
  name: string | undefined,
  flags: Readonly<Record<string, string | boolean>>,
  printer: CliPrinter,
): number {
  if (!name) {
    printer.error(
      'Usage: rnm add <mfe-name> --path <path> [--entry ./src/index.tsx]',
    );
    return 1;
  }

  const registry = readRegistry(root);
  const mfes: Record<string, MfeManifest> = { ...registry.mfes };

  const path = stringFlag(flags.path) ?? `../${name}`;
  const entry = stringFlag(flags.entry) ?? './src/index.tsx';
  const version = stringFlag(flags.version) ?? '0.1.0';

  const otaMode = flagEnum(
    flags['ota-mode'],
    ['auto', 'manual', 'disabled'],
    'manual',
  );
  const otaProvider = flagEnum(
    flags['ota-provider'],
    ['hot-updater', 'expo', 'none', 'custom'],
    'hot-updater',
  );
  const nativeChangePolicy = flagEnum(
    flags['native-policy'],
    ['ask', 'block', 'apply-and-disable-ota'],
    'ask',
  );

  mfes[name] = {
    name,
    version,
    entry,
    path,
    ota: {
      enabled: flags['no-ota'] !== true,
      mode: otaMode,
      provider: otaProvider,
    },
    nativeChangePolicy,
    status: 'active',
  };

  writeRegistry(root, {
    ...registry,
    mfes,
  });

  printer.log(`[OK] Registered MFE ${name}`);
  return 0;
}

function readRegistry(root: string): MfeRegistry {
  const registryPath = join(root, 'rnm.registry.json');

  if (!existsSync(registryPath)) {
    return createEmptyRegistry();
  }

  return JSON.parse(readFileSync(registryPath, 'utf8')) as MfeRegistry;
}

function writeRegistry(root: string, registry: MfeRegistry): void {
  const registryPath = join(root, 'rnm.registry.json');
  const serializedRegistry = JSON.stringify(registry, null, 2);

  writeFileSync(registryPath, `${serializedRegistry}\n`);
}

function stringFlag(value: string | boolean | undefined): string | undefined {
  if (typeof value === 'string') {
    return value;
  }

  return undefined;
}

function flagEnum<T extends string>(
  value: string | boolean | undefined,
  allowed: readonly T[],
  fallback: T,
): T {
  if (typeof value === 'string' && allowed.includes(value as T)) {
    return value as T;
  }

  return fallback;
}
