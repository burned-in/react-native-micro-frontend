import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { basename, join, relative, resolve, sep } from 'node:path';
import type {
  MfeManifest,
  MfeRegistry,
} from '@bunin/react-native-micro-frontend';
import { createEmptyRegistry } from '@bunin/react-native-micro-frontend';
import type { CliPrinter } from '../cli-output.printer.js';

interface BundleTarget {
  readonly name: string;
  readonly version: string;
  readonly entryFile: string;
  readonly platform: 'ios' | 'android';
  readonly dev: boolean;
  readonly outDir: string;
  readonly bundleOutput: string;
  readonly assetsDest: string;
  readonly manifestOutput: string;
  readonly archiveOutput: string;
}

interface BundleManifest {
  readonly schemaVersion: 1;
  readonly artifactType: 'react-native-micro-frontend-bundle';
  readonly name: string;
  readonly version: string;
  readonly platform: 'ios' | 'android';
  readonly dev: boolean;
  readonly entryFile: string;
  readonly bundleFile: string;
  readonly assetsDir: string;
  readonly createdAt: string;
}

/**
 * Handles `rnm bundle [mfe-name]` by executing React Native bundling and
 * packaging only the runtime bundle, Metro assets, and bundle manifest.
 *
 * @param root Project root where the MFE app command is executed.
 * @param name Optional MFE name. Defaults to mfe.config.ts or package.json.
 * @param flags CLI flags for platform, entry, output, and host copy.
 * @param printer Output sink.
 * @returns Exit code.
 */
export function runBundleCommand(
  root: string,
  name: string | undefined,
  flags: Readonly<Record<string, string | boolean>>,
  printer: CliPrinter,
): number {
  const platforms = platformFlags(flags.platform);
  const resolvedName =
    name ?? stringFlag(flags.name) ?? readMfeConfigString(root, 'name');

  if (!resolvedName) {
    printer.error(
      'Usage: rnm bundle [mfe-name] [--platform ios|android|all] [--entry ./src/index.tsx]',
    );
    return 1;
  }

  const version =
    stringFlag(flags.version) ??
    readMfeConfigString(root, 'version') ??
    readPackageJsonString(root, 'version') ??
    '0.0.0';
  const entryFile =
    stringFlag(flags.entry) ??
    readMfeConfigString(root, 'entry') ??
    './src/index.tsx';
  const dev = flags.dev === true;
  const hostRoot = stringFlag(flags.host);
  const updateRegistry = flags['update-registry'] === true;

  for (const platform of platforms) {
    const target = createBundleTarget(
      root,
      resolvedName,
      version,
      entryFile,
      platform,
      dev,
      flags,
    );
    const result = bundleTarget(root, target, printer);

    if (result !== 0) {
      return result;
    }

    if (hostRoot) {
      copyBundleToHost(root, target, hostRoot, updateRegistry, printer);
    }
  }

  return 0;
}

function createBundleTarget(
  root: string,
  name: string,
  version: string,
  entryFile: string,
  platform: 'ios' | 'android',
  dev: boolean,
  flags: Readonly<Record<string, string | boolean>>,
): BundleTarget {
  const baseOutDir =
    stringFlag(flags['out-dir']) ?? join('dist', 'rnm-bundles');
  const outDir = resolve(root, baseOutDir, name, platform);
  const type = stringFlag(flags.type) ?? 'ota';
  const bundleOutput = join(outDir, 'index.bundle');
  const assetsDest = join(outDir, 'assets');
  const manifestOutput = join(outDir, 'manifest.json');
  const archiveOutput = join(outDir, `${name}.${platform}.${type}.tar.gz`);

  return {
    name,
    version,
    entryFile,
    platform,
    dev,
    outDir,
    bundleOutput,
    assetsDest,
    manifestOutput,
    archiveOutput,
  };
}

function bundleTarget(
  root: string,
  target: BundleTarget,
  printer: CliPrinter,
): number {
  mkdirSync(target.outDir, { recursive: true });
  rmSync(target.bundleOutput, { force: true });
  rmSync(target.assetsDest, { force: true, recursive: true });
  rmSync(target.manifestOutput, { force: true });
  rmSync(target.archiveOutput, { force: true });

  const reactNativeBin = resolveReactNativeBin(root);
  const bundleArgs = [
    'bundle',
    '--entry-file',
    target.entryFile,
    '--platform',
    target.platform,
    '--dev',
    target.dev ? 'true' : 'false',
    '--bundle-output',
    target.bundleOutput,
    '--assets-dest',
    target.assetsDest,
  ];

  printer.log(`[RUN] ${reactNativeBin} ${bundleArgs.join(' ')}`);

  const bundleResult = spawnSync(reactNativeBin, bundleArgs, {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  if (bundleResult.stdout) {
    printer.log(bundleResult.stdout.trim());
  }

  if (bundleResult.status !== 0) {
    if (bundleResult.stderr) {
      printer.error(bundleResult.stderr.trim());
    }
    printer.error(
      `[ERROR] Metro bundling failed for ${target.name}:${target.platform}`,
    );
    return bundleResult.status ?? 1;
  }

  if (bundleResult.stderr) {
    printer.log(bundleResult.stderr.trim());
  }

  mkdirSync(target.assetsDest, { recursive: true });
  writeBundleManifest(target);

  const archiveFiles = [
    basename(target.bundleOutput),
    basename(target.assetsDest),
    basename(target.manifestOutput),
  ];
  const tarArgs = [
    '-czf',
    target.archiveOutput,
    '-C',
    target.outDir,
    ...archiveFiles,
  ];

  printer.log(`[RUN] tar ${tarArgs.join(' ')}`);

  const tarResult = spawnSync('tar', tarArgs, {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  if (tarResult.status !== 0) {
    if (tarResult.stderr) {
      printer.error(tarResult.stderr.trim());
    }
    printer.error(
      `[ERROR] Bundle archive failed for ${target.name}:${target.platform}`,
    );
    return tarResult.status ?? 1;
  }

  printer.log(`[OK] Bundle: ${relative(root, target.bundleOutput)}`);
  printer.log(`[OK] Assets: ${relative(root, target.assetsDest)}`);
  printer.log(`[OK] Manifest: ${relative(root, target.manifestOutput)}`);
  printer.log(`[OK] Archive: ${relative(root, target.archiveOutput)}`);

  return 0;
}

function writeBundleManifest(target: BundleTarget): void {
  const manifest: BundleManifest = {
    schemaVersion: 1,
    artifactType: 'react-native-micro-frontend-bundle',
    name: target.name,
    version: target.version,
    platform: target.platform,
    dev: target.dev,
    entryFile: target.entryFile,
    bundleFile: basename(target.bundleOutput),
    assetsDir: basename(target.assetsDest),
    createdAt: new Date().toISOString(),
  };

  writeFileSync(
    target.manifestOutput,
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
}

function copyBundleToHost(
  root: string,
  target: BundleTarget,
  hostRootFlag: string,
  updateRegistry: boolean,
  printer: CliPrinter,
): void {
  const hostRoot = resolve(root, hostRootFlag);
  const hostBundleDir = join(hostRoot, '.bundle', 'rnm');
  const copiedArchive = join(hostBundleDir, basename(target.archiveOutput));

  mkdirSync(hostBundleDir, { recursive: true });
  copyFileSync(target.archiveOutput, copiedArchive);

  printer.log(
    `[OK] Copied archive to host: ${relative(hostRoot, copiedArchive)}`,
  );

  if (updateRegistry) {
    updateHostRegistry(root, hostRoot, target, copiedArchive);
    printer.log('[OK] Updated host rnm.registry.json bundleArchiveUrl');
  }
}

function updateHostRegistry(
  root: string,
  hostRoot: string,
  target: BundleTarget,
  copiedArchive: string,
): void {
  const registryPath = join(hostRoot, 'rnm.registry.json');
  const registry = existsSync(registryPath)
    ? (JSON.parse(readFileSync(registryPath, 'utf8')) as MfeRegistry)
    : createEmptyRegistry();
  const current = registry.mfes[target.name];
  const {
    blockedReason: _blockedReason,
    embeddedBundlePath: _embeddedBundlePath,
    otaBundleUrl: _otaBundleUrl,
    ...currentWithoutStaleLoadMetadata
  } = current ?? {};
  const archiveUrl = toPosixPath(relative(hostRoot, copiedArchive));
  const mfePath = toPosixPath(relative(hostRoot, root));
  const nextMfe: MfeManifest = {
    ...currentWithoutStaleLoadMetadata,
    name: target.name,
    version: target.version,
    entry: target.entryFile,
    path: mfePath,
    ota: {
      enabled: true,
      mode: 'manual',
      provider: 'custom',
    },
    nativeChangePolicy: current?.nativeChangePolicy ?? 'ask',
    status: 'active',
    bundleArchiveUrl: archiveUrl,
  };

  writeFileSync(
    registryPath,
    `${JSON.stringify(
      {
        ...registry,
        mfes: {
          ...registry.mfes,
          [target.name]: nextMfe,
        },
      },
      null,
      2,
    )}\n`,
  );
}

function resolveReactNativeBin(root: string): string {
  const localBin = join(root, 'node_modules', '.bin', 'react-native');

  if (existsSync(localBin)) {
    return localBin;
  }

  return 'react-native';
}

function platformFlags(
  value: string | boolean | undefined,
): readonly ('ios' | 'android')[] {
  if (value === 'android') {
    return ['android'];
  }

  if (value === 'all') {
    return ['ios', 'android'];
  }

  return ['ios'];
}

function readMfeConfigString(
  root: string,
  key: 'name' | 'version' | 'entry',
): string | undefined {
  const configPath = join(root, 'mfe.config.ts');

  if (!existsSync(configPath)) {
    return undefined;
  }

  const source = readFileSync(configPath, 'utf8');
  const match = source.match(new RegExp(`${key}\\s*:\\s*['"]([^'"]+)['"]`));

  return match?.[1];
}

function readPackageJsonString(
  root: string,
  key: 'version',
): string | undefined {
  const packageJsonPath = join(root, 'package.json');

  if (!existsSync(packageJsonPath)) {
    return undefined;
  }

  const packageJson = JSON.parse(
    readFileSync(packageJsonPath, 'utf8'),
  ) as Record<string, unknown>;
  const value = packageJson[key];

  return typeof value === 'string' ? value : undefined;
}

function stringFlag(value: string | boolean | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function toPosixPath(path: string): string {
  return path.split(sep).join('/');
}
