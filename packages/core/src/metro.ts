import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { MfeRegistry } from './domain/mfe-manifest.type.js';

/** Minimal Metro config shape used by the helper without depending on Metro types. */
export interface ReactNativeMicroFrontendMetroConfig {
  readonly watchFolders?: readonly string[];
  readonly resolver?: {
    readonly extraNodeModules?: Readonly<Record<string, string>>;
    readonly nodeModulesPaths?: readonly string[];
    readonly unstable_enablePackageExports?: boolean;
    readonly [key: string]: unknown;
  };
  readonly [key: string]: unknown;
}

/** Options for automatic host/MFE Metro module sharing. */
export interface ReactNativeMicroFrontendMetroOptions {
  /** Registry path relative to hostRoot. Defaults to rnm.registry.json. */
  readonly registryPath?: string;
  /** Extra singleton packages to force to the host node_modules copy. */
  readonly sharedPackages?: readonly string[];
  /** Packages to remove from automatic host singleton mapping. */
  readonly excludeSharedPackages?: readonly string[];
  /** Extra folders Metro should watch in addition to registered MFE roots. */
  readonly extraWatchFolders?: readonly string[];
}

const DEFAULT_SHARED_PACKAGES = [
  '@bunin/react-native-micro-frontend',
  'react',
  'react-native',
] as const;

/**
 * Adds React Native Micro Frontend defaults to an existing Metro config.
 *
 * The helper reads rnm.registry.json, watches each registered MFE root, and maps
 * shared dependencies to the host app's node_modules so React, React Native, and
 * native modules are not duplicated when developing against sibling MFE projects.
 * Existing user config wins if it already defines a package in extraNodeModules.
 *
 * @param hostRoot Host app root, normally __dirname from metro.config.js.
 * @param config Existing Metro config to extend.
 * @param options Optional registry path and package sharing overrides.
 * @returns Metro config with watchFolders, nodeModulesPaths, and extraNodeModules.
 */
export function withReactNativeMicroFrontendMetroConfig<
  TConfig extends ReactNativeMicroFrontendMetroConfig,
>(
  hostRoot: string,
  config: TConfig,
  options: ReactNativeMicroFrontendMetroOptions = {},
): TConfig {
  const hostNodeModules = resolve(hostRoot, 'node_modules');
  const registry = readRegistry(hostRoot, options.registryPath);
  const mfeRoots = getMfeRoots(hostRoot, registry);
  const extraWatchFolders = (options.extraWatchFolders ?? []).map((folder) =>
    resolve(hostRoot, folder),
  );
  const autoExtraNodeModules = createAutoExtraNodeModules({
    hostRoot,
    hostNodeModules,
    mfeRoots,
    sharedPackages: options.sharedPackages ?? [],
    excludeSharedPackages: options.excludeSharedPackages ?? [],
  });

  return {
    ...config,
    watchFolders: uniquePaths([
      ...(config.watchFolders ?? []),
      ...mfeRoots,
      ...extraWatchFolders,
    ]),
    resolver: {
      ...config.resolver,
      unstable_enablePackageExports:
        config.resolver?.unstable_enablePackageExports ?? true,
      extraNodeModules: {
        ...autoExtraNodeModules,
        ...(config.resolver?.extraNodeModules ?? {}),
      },
      nodeModulesPaths: uniquePaths([
        ...(config.resolver?.nodeModulesPaths ?? []),
        hostNodeModules,
      ]),
    },
  };
}

/** Short alias for withReactNativeMicroFrontendMetroConfig(). */
export const withMfe = withReactNativeMicroFrontendMetroConfig;

/**
 * Computes the extraNodeModules map without creating a full Metro config.
 *
 * @param hostRoot Host app root containing package.json and node_modules.
 * @param registry Optional runtime registry. When omitted, rnm.registry.json is read.
 * @param options Package sharing overrides.
 * @returns package name to host node_modules path map.
 */
export function createMicroFrontendExtraNodeModules(
  hostRoot: string,
  registry?: MfeRegistry,
  options: Pick<
    ReactNativeMicroFrontendMetroOptions,
    'registryPath' | 'sharedPackages' | 'excludeSharedPackages'
  > = {},
): Readonly<Record<string, string>> {
  const hostNodeModules = resolve(hostRoot, 'node_modules');
  const resolvedRegistry =
    registry ?? readRegistry(hostRoot, options.registryPath);

  return createAutoExtraNodeModules({
    hostRoot,
    hostNodeModules,
    mfeRoots: getMfeRoots(hostRoot, resolvedRegistry),
    sharedPackages: options.sharedPackages ?? [],
    excludeSharedPackages: options.excludeSharedPackages ?? [],
  });
}

function readRegistry(
  hostRoot: string,
  registryPath = 'rnm.registry.json',
): MfeRegistry | null {
  const absolutePath = resolve(hostRoot, registryPath);

  if (!existsSync(absolutePath)) return null;

  return JSON.parse(readFileSync(absolutePath, 'utf8')) as MfeRegistry;
}

function getMfeRoots(hostRoot: string, registry: MfeRegistry | null): string[] {
  if (!registry) return [];

  return uniquePaths(
    Object.values(registry.mfes)
      .filter((mfe) => mfe.status !== 'disabled')
      .map((mfe) => resolve(hostRoot, mfe.path)),
  );
}

function createAutoExtraNodeModules(input: {
  readonly hostRoot: string;
  readonly hostNodeModules: string;
  readonly mfeRoots: readonly string[];
  readonly sharedPackages: readonly string[];
  readonly excludeSharedPackages: readonly string[];
}): Readonly<Record<string, string>> {
  const hostDependencies = readPackageDependencies(input.hostRoot);
  const mfeDependencies = new Set(
    input.mfeRoots.flatMap((mfeRoot) => [...readPackageDependencies(mfeRoot)]),
  );
  const excluded = new Set(input.excludeSharedPackages);
  const autoSharedPackages = new Set([
    ...DEFAULT_SHARED_PACKAGES,
    ...[...hostDependencies].filter((dependency) =>
      mfeDependencies.has(dependency),
    ),
    ...input.sharedPackages,
  ]);
  const extraNodeModules: Record<string, string> = {};

  for (const packageName of autoSharedPackages) {
    if (excluded.has(packageName)) continue;

    const packagePath = join(input.hostNodeModules, ...packageName.split('/'));

    if (existsSync(packagePath)) {
      extraNodeModules[packageName] = packagePath;
    }
  }

  return extraNodeModules;
}

function readPackageDependencies(root: string): Set<string> {
  const packageJsonPath = resolve(root, 'package.json');

  if (!existsSync(packageJsonPath)) return new Set();

  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
  };

  return new Set([
    ...Object.keys(packageJson.dependencies ?? {}),
    ...Object.keys(packageJson.devDependencies ?? {}),
    ...Object.keys(packageJson.peerDependencies ?? {}),
  ]);
}

function uniquePaths(paths: readonly string[]): string[] {
  return [...new Set(paths.map((path) => resolve(path)))];
}
