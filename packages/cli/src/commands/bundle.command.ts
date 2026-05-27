import { Buffer } from 'node:buffer';
import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  readSync,
  rmSync,
  writeFileSync,
  writeSync,
} from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import type {
  MfeManifest,
  MfeRegistry,
} from '@bunin/react-native-micro-frontend';
import { createEmptyRegistry } from '@bunin/react-native-micro-frontend';
import {
  formatConfigPath,
  loadMfeConfigFile,
} from '@bunin/react-native-micro-frontend-config';
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

const DEFAULT_BUNDLE_MODULE_GLOBAL_NAME = '__rnm_mfe_module__';

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
  readonly entryModuleId?: string | number;
  readonly moduleGlobalName?: string;
}

interface BundleExportMetadata {
  readonly entryModuleId?: string | number;
  readonly moduleGlobalName: string;
}

/**
 * Handles `rnm bundle [mfe-name]` by executing React Native bundling and
 * packaging only the runtime bundle, Metro assets, and bundle manifest.
 *
 * @param root Project root where the MFE app command is executed.
 * @param name Optional MFE name. Defaults to mfe.config.{ts,mjs,cjs} or package.json.
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
  const mfeConfigResult = readMfeConfig(root);

  if (!mfeConfigResult.ok) {
    printer.error(
      `[ERROR] Failed to load ${formatConfigPath(root, mfeConfigResult.error.path)}: ${mfeConfigResult.error.message}`,
    );
    return 1;
  }

  const mfeConfig = mfeConfigResult.value;
  const resolvedName =
    name ?? stringFlag(flags.name) ?? readConfigString(mfeConfig, 'name');

  if (!resolvedName) {
    printer.error(
      'Usage: rnm bundle [mfe-name] [--platform ios|android|all] [--entry ./src/index.tsx]',
    );
    return 1;
  }

  const version =
    stringFlag(flags.version) ??
    readConfigString(mfeConfig, 'version') ??
    readPackageJsonString(root, 'version') ??
    '0.0.0';
  const entryFile =
    stringFlag(flags.entry) ??
    readConfigString(mfeConfig, 'entry') ??
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
      copyBundleToHost(root, target, hostRoot, updateRegistry, flags, printer);
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
  const exportMetadata = appendBundleEntryExport(target, printer);
  writeBundleManifest(target, exportMetadata);

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

function writeBundleManifest(
  target: BundleTarget,
  exportMetadata: BundleExportMetadata,
): void {
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
    moduleGlobalName: exportMetadata.moduleGlobalName,
    ...(exportMetadata.entryModuleId !== undefined
      ? { entryModuleId: exportMetadata.entryModuleId }
      : {}),
  };

  writeFileSync(
    target.manifestOutput,
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
}

function appendBundleEntryExport(
  target: BundleTarget,
  printer: CliPrinter,
): BundleExportMetadata {
  const bundleCode = readFileSync(target.bundleOutput, 'utf8');
  const entryModuleId = findMetroEntryModuleId(bundleCode);

  if (entryModuleId === undefined) {
    printer.log(
      `[WARN] Could not detect Metro entry module id for ${target.name}:${target.platform}; default evaluator may require a custom evaluate adapter.`,
    );
    return { moduleGlobalName: DEFAULT_BUNDLE_MODULE_GLOBAL_NAME };
  }

  writeFileSync(
    target.bundleOutput,
    `${bundleCode.replace(/\s*$/u, '')}\n${createEntryExportFooter(entryModuleId)}\n`,
  );

  return {
    entryModuleId,
    moduleGlobalName: DEFAULT_BUNDLE_MODULE_GLOBAL_NAME,
  };
}

function findMetroEntryModuleId(
  bundleCode: string,
): string | number | undefined {
  const matches = Array.from(
    bundleCode.matchAll(
      /(?:^|[;\n])\s*__r\(\s*(?:(\d+)|"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)')\s*\)\s*;?/gu,
    ),
  );
  const match = matches.at(-1);

  if (!match) return undefined;

  const numericId = match[1];
  if (numericId !== undefined) return Number.parseInt(numericId, 10);

  const stringId = match[2] ?? match[3];
  return stringId === undefined ? undefined : unescapeModuleId(stringId);
}

function unescapeModuleId(value: string): string {
  return value.replace(/\\([\\"'])/gu, '$1');
}

function createEntryExportFooter(entryModuleId: string | number): string {
  return `;(() => {
  const g = globalThis;
  if (
    g &&
    g[${JSON.stringify(DEFAULT_BUNDLE_MODULE_GLOBAL_NAME)}] === undefined &&
    typeof __r === 'function'
  ) {
    g[${JSON.stringify(DEFAULT_BUNDLE_MODULE_GLOBAL_NAME)}] = __r(${JSON.stringify(entryModuleId)});
  }
})();`;
}

function copyBundleToHost(
  root: string,
  target: BundleTarget,
  hostRootFlag: string,
  updateRegistry: boolean,
  flags: Readonly<Record<string, string | boolean>>,
  printer: CliPrinter,
): void {
  const hostRoot = resolve(root, hostRootFlag);
  const hostBundleDir = join(hostRoot, '.bundle', 'rnm');
  const copiedArchive = join(hostBundleDir, basename(target.archiveOutput));

  mkdirSync(hostBundleDir, { recursive: true });
  copyFileSync(target.archiveOutput, copiedArchive);
  writeBundleArchiveAssetRegistry(hostRoot);
  registerBundleArchiveImport(hostRoot, flags, printer);

  printer.log(
    `[OK] Copied archive to host: ${relative(hostRoot, copiedArchive)}`,
  );

  if (updateRegistry) {
    updateHostRegistry(root, hostRoot, target, copiedArchive);
    printer.log('[OK] Updated host rnm.registry.json bundleArchiveUrl');
  }
}

function registerBundleArchiveImport(
  hostRoot: string,
  flags: Readonly<Record<string, string | boolean>>,
  printer: CliPrinter,
): void {
  const entryPath =
    stringFlag(flags['host-entry']) ?? detectHostEntry(hostRoot);

  if (!entryPath) {
    printer.log(
      '[INFO] rnm.bundle-archives.ts generated. Import it from your Host entry file, or pass --host-entry <file> with --yes to patch automatically.',
    );
    return;
  }

  if (!shouldPatchBundleArchiveImport(flags, printer, entryPath)) {
    return;
  }

  const absoluteEntryPath = resolve(hostRoot, entryPath);

  if (!existsSync(absoluteEntryPath)) {
    printer.log(
      `[INFO] rnm.bundle-archives.ts generated, but Host entry was not found: ${entryPath}`,
    );
    return;
  }
  const current = readFileSync(absoluteEntryPath, 'utf8');

  if (current.includes('rnm.bundle-archives')) {
    printer.log(
      `[OK] Host archive asset registration already imported: ${entryPath}`,
    );
    return;
  }

  const importPath = toImportSpecifier(
    relative(dirname(absoluteEntryPath), join(hostRoot, 'rnm.bundle-archives')),
  );
  writeFileSync(absoluteEntryPath, `import '${importPath}';\n${current}`);
  printer.log(`[OK] Imported rnm.bundle-archives from ${entryPath}`);
}

function shouldPatchBundleArchiveImport(
  flags: Readonly<Record<string, string | boolean>>,
  printer: CliPrinter,
  entryPath: string,
): boolean {
  if (flags['no-register-archives'] === true) {
    printer.log('[SKIP] Host archive asset registration import was disabled.');
    return false;
  }

  if (flags['register-archives'] === true || flags.yes === true) {
    return true;
  }

  if (process.stdin.isTTY && process.stdout.isTTY) {
    return askYesNo(
      `Import rnm.bundle-archives from ${entryPath} so React Native can load copied archives? [y/N] `,
    );
  }

  printer.log(
    `[INFO] rnm.bundle-archives.ts generated. Re-run with --yes or --register-archives to import it from ${entryPath} automatically.`,
  );
  return false;
}

function askYesNo(question: string): boolean {
  writeSync(1, question);
  const buffer = Buffer.alloc(256);
  const bytesRead = readSync(0, buffer, 0, buffer.length, null);
  const answer = buffer.toString('utf8', 0, bytesRead).trim().toLowerCase();

  return answer === 'y' || answer === 'yes';
}

function detectHostEntry(hostRoot: string): string | undefined {
  for (const candidate of [
    'index.ts',
    'index.tsx',
    'index.js',
    'index.jsx',
    'src/index.ts',
    'src/index.tsx',
    'src/index.js',
    'src/index.jsx',
    'src/App.tsx',
    'src/App.ts',
    'src/App.jsx',
    'src/App.js',
  ]) {
    if (existsSync(join(hostRoot, candidate))) return candidate;
  }

  return undefined;
}

function toImportSpecifier(path: string): string {
  const withoutExtension = path.replace(/\.[cm]?[jt]sx?$/u, '');
  const posixPath = toPosixPath(withoutExtension);

  return posixPath.startsWith('.') ? posixPath : `./${posixPath}`;
}

function writeBundleArchiveAssetRegistry(hostRoot: string): void {
  const bundleDir = join(hostRoot, '.bundle', 'rnm');
  const archiveFiles = readdirSync(bundleDir)
    .filter((file) => /\.tar\.gz$/u.test(file))
    .sort((a, b) => a.localeCompare(b));
  const entries = archiveFiles.map((file) => {
    const archiveUrl = `.bundle/rnm/${file}`;
    return `  ${JSON.stringify(archiveUrl)}: Image.resolveAssetSource(require(${JSON.stringify(`./${archiveUrl}`)}))?.uri,`;
  });
  const contents = [
    '/* Auto-generated by @bunin/react-native-micro-frontend. */',
    "import { Image } from 'react-native';",
    "import { registerBundleArchiveAssets } from '@bunin/react-native-micro-frontend/bundle-archive';",
    '',
    'export const bundleArchiveAssets = {',
    ...entries,
    '} as const;',
    '',
    'registerBundleArchiveAssets(bundleArchiveAssets);',
    '',
  ].join('\n');

  writeFileSync(join(hostRoot, 'rnm.bundle-archives.ts'), contents);
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

function readMfeConfig(root: string) {
  return loadMfeConfigFile(root);
}

function readConfigString(
  config:
    | {
        readonly name?: unknown;
        readonly version?: unknown;
        readonly entry?: unknown;
      }
    | undefined,
  key: 'name' | 'version' | 'entry',
): string | undefined {
  const value = config?.[key];

  return typeof value === 'string' ? value : undefined;
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
