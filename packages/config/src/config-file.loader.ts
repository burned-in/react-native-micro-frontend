import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, extname, join, relative } from 'node:path';
import type {
  MfeConfig,
  ReactNativeMicroFrontendConfig,
  Result,
} from '@bunin/react-native-micro-frontend';
import {
  err,
  normalizeReactNativeMicroFrontendConfig,
  ok,
} from '@bunin/react-native-micro-frontend';

/** Config load error for CLI and CI output. */
export interface ConfigLoadError {
  readonly path: string;
  readonly message: string;
}

/** File names supported for Host policy config loading. */
export const REACT_NATIVE_MICRO_FRONTEND_CONFIG_FILENAMES = [
  'react-native-micro-frontend.config.ts',
  'react-native-micro-frontend.config.mts',
  'react-native-micro-frontend.config.cts',
  'react-native-micro-frontend.config.tsx',
  'react-native-micro-frontend.config.mjs',
  'react-native-micro-frontend.config.js',
  'react-native-micro-frontend.config.cjs',
  'react-native-micro-frontend.config.json',
] as const;

/** File names supported for MFE-local config loading. */
export const MFE_CONFIG_FILENAMES = [
  'mfe.config.ts',
  'mfe.config.mts',
  'mfe.config.cts',
  'mfe.config.tsx',
  'mfe.config.mjs',
  'mfe.config.js',
  'mfe.config.cjs',
  'mfe.config.json',
] as const;

/** Bundle-relevant MFE config fields. */
export type MfeConfigFile = Partial<MfeConfig>;

/**
 * Loads a Host config variant and normalizes it.
 *
 * JavaScript, TypeScript, CJS, and MJS configs are loaded through Bun.
 *
 * @param root Project root.
 * @param filename Optional config filename. Defaults to first supported Host config found.
 * @returns Normalized config or typed load error.
 */
export function loadReactNativeMicroFrontendConfig(
  root: string,
  filename?: string,
): Result<ReactNativeMicroFrontendConfig, ConfigLoadError> {
  const path = filename
    ? join(root, filename)
    : findConfigPath(root, REACT_NATIVE_MICRO_FRONTEND_CONFIG_FILENAMES);

  if (!path) {
    return err({
      path: join(root, REACT_NATIVE_MICRO_FRONTEND_CONFIG_FILENAMES[0]),
      message: 'config file not found',
    });
  }

  try {
    const loaded =
      loadConfigModule<Partial<ReactNativeMicroFrontendConfig>>(path);
    return ok(normalizeReactNativeMicroFrontendConfig(loaded));
  } catch (error) {
    return err({
      path,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Loads an optional MFE-local config variant.
 *
 * @param root MFE project root.
 * @param filename Optional config filename. Defaults to first supported MFE config found.
 * @returns Config object, undefined when absent, or typed load error.
 */
export function loadMfeConfigFile(
  root: string,
  filename?: string,
): Result<MfeConfigFile | undefined, ConfigLoadError> {
  const path = filename
    ? join(root, filename)
    : findConfigPath(root, MFE_CONFIG_FILENAMES);

  if (!path) {
    return ok(undefined);
  }

  try {
    return ok(loadConfigModule<MfeConfigFile>(path));
  } catch (error) {
    return err({
      path,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Loads a JSON config variant and normalizes it.
 *
 * Kept for backwards compatibility. Prefer loadReactNativeMicroFrontendConfig()
 * when JS/TS/CJS/MJS config variants should be accepted.
 *
 * @param root Project root.
 * @param filename Config filename, defaults to react-native-micro-frontend.config.json.
 * @returns Normalized config or typed load error.
 */
export function loadJsonReactNativeMicroFrontendConfig(
  root: string,
  filename = 'react-native-micro-frontend.config.json',
): Result<ReactNativeMicroFrontendConfig, ConfigLoadError> {
  const path = join(root, filename);
  if (!existsSync(path)) return err({ path, message: 'config file not found' });
  try {
    const parsed = JSON.parse(
      readFileSync(path, 'utf8'),
    ) as Partial<ReactNativeMicroFrontendConfig>;
    return ok(normalizeReactNativeMicroFrontendConfig(parsed));
  } catch (error) {
    return err({
      path,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

function findConfigPath(
  root: string,
  filenames: readonly string[],
): string | undefined {
  for (const filename of filenames) {
    const path = join(root, filename);

    if (existsSync(path)) {
      return path;
    }
  }

  return undefined;
}

function loadConfigModule<TConfig>(path: string): TConfig {
  const extension = extname(path);

  if (extension === '.json') {
    return parseConfigJson<TConfig>(readFileSync(path, 'utf8'));
  }

  if (extension === '.cjs') {
    return normalizeConfigModule<TConfig>(createRequire(path)(path));
  }

  return loadConfigModuleWithBun<TConfig>(path);
}

function normalizeConfigModule<TConfig>(exports: unknown): TConfig {
  if (!isRecord(exports)) {
    throw new Error('config must export an object');
  }

  const defaultExport = exports.default;

  if (isRecord(defaultExport)) {
    return defaultExport as TConfig;
  }

  return exports as TConfig;
}

function loadConfigModuleWithBun<TConfig>(path: string): TConfig {
  const result = spawnSync(
    getBunExecutable(),
    ['--eval', BUN_CONFIG_LOADER, path],
    {
      cwd: dirname(path),
      encoding: 'utf8',
      env: process.env,
    },
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `Bun exited with ${result.status}`);
  }

  return parseConfigJson<TConfig>(result.stdout);
}

function parseConfigJson<TConfig>(source: string): TConfig {
  const parsed = JSON.parse(source) as unknown;

  if (!isRecord(parsed)) {
    throw new Error('config must export an object');
  }

  return parsed as TConfig;
}

function getBunExecutable(): string {
  return process.versions.bun ? process.execPath : 'bun';
}

const BUN_CONFIG_LOADER = `
const { pathToFileURL } = await import('node:url');
const configPath = process.argv[1];
const module = await import(pathToFileURL(configPath).href);
const value =
  module.default && typeof module.default === 'object'
    ? module.default
    : module;

if (!value || typeof value !== 'object') {
  throw new Error('config must export an object');
}

const json = JSON.stringify(value);

if (!json) {
  throw new Error('config must be JSON-serializable');
}

process.stdout.write(json);
`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Formats a config path relative to root for CLI output. */
export function formatConfigPath(root: string, path: string): string {
  return relative(root, path);
}
