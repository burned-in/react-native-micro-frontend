import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { createInterface } from 'node:readline/promises';
import type {
  MfeManifest,
  MfeRegistry,
  NativeContract,
  NativeGradleDependency,
  NativeGradleProject,
  NativePackageDependency,
  NativePodDependency,
} from '@bunin/react-native-micro-frontend';
import { createEmptyRegistry } from '@bunin/react-native-micro-frontend';
import type { CliPrinter } from '../cli-output.printer.js';

export type NativeIntegrationTarget = 'package' | 'aos' | 'ios' | 'all';

interface MfeTarget {
  readonly name: string;
  readonly root: string;
  readonly manifest?: MfeManifest;
  readonly contract?: NativeContract;
}

interface IntegrationResult {
  readonly detected: number;
  readonly applied: number;
}

interface PatchFile {
  readonly path: string;
  readonly contents: string;
}

interface ExpoMfeIntegration {
  readonly ios: {
    readonly pods: readonly NativePodDependency[];
  };
  readonly android: {
    readonly gradleProjects: readonly NativeGradleProject[];
    readonly gradleDependencies: readonly NativeGradleDependency[];
    readonly permissions: readonly string[];
  };
}

interface ExpoIntegrationConfig {
  readonly schemaVersion: 1;
  readonly mfes: Readonly<Record<string, ExpoMfeIntegration>>;
}

/**
 * Runs targeted MFE host integration.
 *
 * Order for `all` is intentionally package -> AOS -> iOS so package.json is
 * ready before native autolinking files are regenerated.
 */
export async function runNativeIntegrationCommand(
  root: string,
  target: NativeIntegrationTarget,
  name: string | undefined,
  flags: Readonly<Record<string, string | boolean>>,
  printer: CliPrinter,
): Promise<number> {
  const mfe = resolveMfeTarget(root, name, flags);

  if (!mfe) {
    printer.error(
      `Usage: rnm ${target} <mfe-name> [--path <path>] [--dry-run] [--yes]`,
    );
    printer.error(
      'Register an MFE with `rnm add <name> --path <path>` or pass --path.',
    );
    return 1;
  }

  const targets =
    target === 'all'
      ? (['package', 'aos', 'ios'] as const)
      : ([target] as const);
  let detected = 0;
  let applied = 0;

  for (const currentTarget of targets) {
    const result = await runOneTarget(root, mfe, currentTarget, flags, printer);
    detected += result.detected;
    applied += result.applied;
  }

  if (detected === 0) {
    printer.log('[OK] No missing MFE integration additions detected.');
  } else if (flags['dry-run'] === true) {
    printer.log(`[OK] Dry run complete. Detected additions: ${detected}`);
  } else if (applied < detected) {
    printer.error(
      `[WARN] Integration incomplete. Applied ${applied}/${detected}. Re-run with --yes to apply every detected addition.`,
    );
  } else {
    printer.log(`[OK] Integration complete. Applied ${applied}/${detected}.`);
  }

  return detected > applied &&
    flags['dry-run'] !== true &&
    flags['allow-skip'] !== true
    ? 1
    : 0;
}

async function runOneTarget(
  root: string,
  mfe: MfeTarget,
  target: Exclude<NativeIntegrationTarget, 'all'>,
  flags: Readonly<Record<string, string | boolean>>,
  printer: CliPrinter,
): Promise<IntegrationResult> {
  switch (target) {
    case 'package':
      return integratePackages(root, mfe, flags, printer);
    case 'aos':
      return integrateAndroid(root, mfe, flags, printer);
    case 'ios':
      return integrateIos(root, mfe, flags, printer);
  }
}

async function integratePackages(
  root: string,
  mfe: MfeTarget,
  flags: Readonly<Record<string, string | boolean>>,
  printer: CliPrinter,
): Promise<IntegrationResult> {
  const hostPackagePath = join(root, 'package.json');
  const hostPackageJson = readJsonObject(hostPackagePath);

  if (!hostPackageJson) {
    printer.error('package.json not found in host project.');
    return { detected: 0, applied: 0 };
  }

  const hostDependencies = objectRecord(hostPackageJson.dependencies);
  const mfeDependencies = readMfeDependencies(mfe, flags);
  const missing = Object.entries(mfeDependencies)
    .filter(([name]) => !hostDependencies[name])
    .sort(([a], [b]) => a.localeCompare(b));

  if (missing.length === 0) {
    printer.log('[OK] package: no missing JS package dependencies.');
    return { detected: 0, applied: 0 };
  }

  printer.log(`[PLAN] package: ${missing.length} dependency addition(s)`);
  for (const [name, version] of missing) {
    printer.log(`  package.json dependencies: ${name}@${version}`);
  }

  if (flags['dry-run'] === true) {
    return { detected: missing.length, applied: 0 };
  }

  const approved = await approve(
    `Add ${missing.length} dependency addition(s) to package.json?`,
    flags,
  );

  if (!approved) {
    printer.log('[SKIP] package additions were not applied.');
    return { detected: missing.length, applied: 0 };
  }

  writeBackupIfNeeded(hostPackagePath, flags);
  hostPackageJson.dependencies = sortRecord({
    ...hostDependencies,
    ...Object.fromEntries(missing),
  });
  writeFileSync(
    hostPackagePath,
    `${JSON.stringify(hostPackageJson, null, 2)}\n`,
  );
  return { detected: missing.length, applied: missing.length };
}

async function integrateIos(
  root: string,
  mfe: MfeTarget,
  flags: Readonly<Record<string, string | boolean>>,
  printer: CliPrinter,
): Promise<IntegrationResult> {
  const pods = mfe.contract?.ios.pods ?? [];
  const generatedPath = 'ios/Podfile.rnm.generated.rb';
  const generatedAbsolutePath = join(root, generatedPath);
  const existingText = readText(generatedAbsolutePath);
  const podfileLockText = readText(join(root, 'ios/Podfile.lock'));
  const additions = pods.filter(
    (pod) =>
      !containsToken(existingText, pod.name) &&
      !containsToken(podfileLockText, pod.name),
  );

  if (isExpoManagedNativeTarget(root, 'ios')) {
    const patches = createExpoIntegrationPatches(root, mfe, 'ios', additions);
    return applyDetectedPatches(root, 'Expo iOS', patches, flags, printer);
  }

  const patches: PatchFile[] = [];
  const linkPatch = createAppendPatchIfMissing(
    root,
    'ios/Podfile',
    "require_relative './Podfile.rnm.generated'",
    "\n# RNM generated MFE pods\nrequire_relative './Podfile.rnm.generated'\n",
  );

  if (additions.length > 0) {
    patches.push({
      path: generatedPath,
      contents: appendSection(
        existingText || defaultPodfileGenerated(),
        `MFE ${mfe.name} pods`,
        additions.map(formatPodLine),
      ),
    });
  }

  if (linkPatch) {
    if (additions.length === 0 && !existingText) {
      patches.push({
        path: generatedPath,
        contents: defaultPodfileGenerated(),
      });
    }
    patches.push(linkPatch);
  }

  return applyDetectedPatches(root, 'iOS', patches, flags, printer);
}

async function integrateAndroid(
  root: string,
  mfe: MfeTarget,
  flags: Readonly<Record<string, string | boolean>>,
  printer: CliPrinter,
): Promise<IntegrationResult> {
  const contract = mfe.contract;
  const projectAdditions = contract?.android.gradleProjects ?? [];
  const dependencyAdditions = contract?.android.gradleDependencies ?? [];
  const permissionAdditions = contract?.android.permissions ?? [];

  if (isExpoManagedNativeTarget(root, 'android')) {
    const patches = createExpoIntegrationPatches(root, mfe, 'android', {
      gradleProjects: projectAdditions,
      gradleDependencies: dependencyAdditions,
      permissions: permissionAdditions,
    });
    return applyDetectedPatches(root, 'Expo AOS', patches, flags, printer);
  }

  const patches: PatchFile[] = [];

  const settingsPatch = createAndroidSettingsPatch(root, mfe, projectAdditions);
  if (settingsPatch) patches.push(settingsPatch);

  const dependencyPatch = createAndroidDependencyPatch(
    root,
    dependencyAdditions,
  );
  if (dependencyPatch) patches.push(dependencyPatch);

  const manifestPatch = createAndroidManifestPatch(root, permissionAdditions);
  if (manifestPatch) patches.push(manifestPatch);

  const settingsLinkPatch =
    createAppendPatchIfMissing(
      root,
      'android/settings.gradle',
      'rnm.settings.generated.gradle',
      '\n// RNM generated MFE Gradle projects\napply from: file("rnm.settings.generated.gradle")\n',
    ) ??
    createAppendPatchIfMissing(
      root,
      'android/settings.gradle.kts',
      'rnm.settings.generated.gradle',
      '\n// RNM generated MFE Gradle projects\napply(from = file("rnm.settings.generated.gradle"))\n',
    );
  const appBuildLinkPatch =
    createAppendPatchIfMissing(
      root,
      'android/app/build.gradle',
      'rnm.generated.gradle',
      '\n// RNM generated MFE Android dependencies\napply from: file("../rnm.generated.gradle")\n',
    ) ??
    createAppendPatchIfMissing(
      root,
      'android/app/build.gradle.kts',
      'rnm.generated.gradle',
      '\n// RNM generated MFE Android dependencies\napply(from = file("../rnm.generated.gradle"))\n',
    );

  if (settingsLinkPatch) patches.push(settingsLinkPatch);
  if (
    settingsLinkPatch &&
    !existsSync(join(root, 'android/rnm.settings.generated.gradle')) &&
    !patches.some(
      (patch) => patch.path === 'android/rnm.settings.generated.gradle',
    )
  ) {
    patches.unshift({
      path: 'android/rnm.settings.generated.gradle',
      contents: defaultAndroidSettingsGenerated(),
    });
  }
  if (
    appBuildLinkPatch &&
    !existsSync(join(root, 'android/rnm.generated.gradle')) &&
    !patches.some((patch) => patch.path === 'android/rnm.generated.gradle')
  ) {
    patches.push({
      path: 'android/rnm.generated.gradle',
      contents: defaultAndroidGenerated(),
    });
  }
  if (appBuildLinkPatch) patches.push(appBuildLinkPatch);

  return applyDetectedPatches(root, 'AOS', patches, flags, printer);
}

async function applyDetectedPatches(
  root: string,
  label: string,
  patches: readonly PatchFile[],
  flags: Readonly<Record<string, string | boolean>>,
  printer: CliPrinter,
): Promise<IntegrationResult> {
  if (patches.length === 0) {
    printer.log(`[OK] ${label}: no missing integration additions.`);
    return { detected: 0, applied: 0 };
  }

  printer.log(`[PLAN] ${label}: ${patches.length} file addition(s)`);
  for (const patch of patches) {
    printer.log(`  ${patch.path}`);
  }

  if (flags['dry-run'] === true) {
    return { detected: patches.length, applied: 0 };
  }

  const approved = await approve(
    `Apply ${patches.length} ${label} integration file addition(s)?`,
    flags,
  );

  if (!approved) {
    printer.log(`[SKIP] ${label} additions were not applied.`);
    return { detected: patches.length, applied: 0 };
  }

  for (const patch of patches) {
    const absolutePath = join(root, patch.path);
    mkdirSync(dirname(absolutePath), { recursive: true });
    writeBackupIfNeeded(absolutePath, flags);
    writeFileSync(absolutePath, patch.contents);
  }

  return { detected: patches.length, applied: patches.length };
}

function resolveMfeTarget(
  root: string,
  name: string | undefined,
  flags: Readonly<Record<string, string | boolean>>,
): MfeTarget | null {
  const registry = readRegistry(root);
  const pathFlag = stringFlag(flags.path);
  const inferredName =
    name ?? stringFlag(flags.name) ?? singleRegisteredMfeName(registry);
  const manifest = inferredName ? registry.mfes[inferredName] : undefined;
  const mfeRoot = pathFlag
    ? resolve(root, pathFlag)
    : manifest
      ? resolve(root, manifest.path)
      : null;

  if (!inferredName || !mfeRoot) {
    return null;
  }

  return {
    name: inferredName,
    root: mfeRoot,
    ...(manifest ? { manifest } : {}),
    ...optionalContract(mfeRoot),
  };
}

function optionalContract(root: string): {
  readonly contract?: NativeContract;
} {
  const contract = readNativeContract(root);
  return contract ? { contract } : {};
}

function readMfeDependencies(
  mfe: MfeTarget,
  flags: Readonly<Record<string, string | boolean>>,
): Record<string, string> {
  const packageJson = readJsonObject(join(mfe.root, 'package.json')) ?? {};
  const dependencies = {
    ...providerPackageDependencies(mfe),
    ...Object.fromEntries(
      (mfe.contract?.packageDependencies ?? [])
        .filter((dependency) => shouldSyncNativePackage(dependency))
        .map((dependency) => [dependency.name, dependency.version]),
    ),
    ...objectRecord(packageJson.dependencies),
    ...objectRecord(packageJson.peerDependencies),
    ...(flags['include-dev'] === true
      ? objectRecord(packageJson.devDependencies)
      : {}),
  };

  delete dependencies.react;
  delete dependencies['react-native'];

  return dependencies;
}

function providerPackageDependencies(mfe: MfeTarget): Record<string, string> {
  if (mfe.manifest?.ota.provider !== 'expo') {
    return {};
  }

  return {
    expo: 'latest',
    'expo-updates': 'latest',
  };
}

function shouldSyncNativePackage(dependency: NativePackageDependency): boolean {
  return dependency.native && dependency.name !== 'react-native';
}

function createAndroidSettingsPatch(
  root: string,
  mfe: MfeTarget,
  projects: readonly NativeGradleProject[],
): PatchFile | null {
  const path = 'android/rnm.settings.generated.gradle';
  const absolutePath = join(root, path);
  const existingText = readText(absolutePath);
  const lines = projects
    .filter((project) => !containsToken(existingText, project.name))
    .map((project) => formatGradleProjectLine(root, mfe.root, project));

  if (lines.length === 0) return null;

  return {
    path,
    contents: appendSection(
      existingText || defaultAndroidSettingsGenerated(),
      `MFE ${mfe.name} Gradle projects`,
      lines,
      '//',
    ),
  };
}

function createAndroidDependencyPatch(
  root: string,
  dependencies: readonly NativeGradleDependency[],
): PatchFile | null {
  const path = 'android/rnm.generated.gradle';
  const absolutePath = join(root, path);
  const existingText = readText(absolutePath);
  const lines = dependencies
    .filter((dependency) => !containsToken(existingText, dependency.notation))
    .map(
      (dependency) => `  ${dependency.configuration} "${dependency.notation}"`,
    );

  if (lines.length === 0) return null;

  return {
    path,
    contents: appendSection(
      existingText || defaultAndroidGenerated(),
      'MFE Gradle dependencies',
      ['dependencies {', ...lines, '}'],
      '//',
    ),
  };
}

function createAndroidManifestPatch(
  root: string,
  permissions: readonly string[],
): PatchFile | null {
  const path = 'android/AndroidManifest.rnm.generated.xml';
  const absolutePath = join(root, path);
  const existingText = readText(absolutePath);
  const lines = permissions
    .filter((permission) => !containsToken(existingText, permission))
    .map((permission) => `  <uses-permission android:name="${permission}" />`);

  if (lines.length === 0) return null;

  const base =
    existingText ||
    '<manifest xmlns:android="http://schemas.android.com/apk/res/android" />\n';
  const withoutClosing = base
    .replace(/\s*<\/manifest>\s*$/, '')
    .replace(/\s*\/>\s*$/, '>');

  return {
    path,
    contents: `${withoutClosing}\n${lines.join('\n')}\n</manifest>\n`,
  };
}

function createAppendPatchIfMissing(
  root: string,
  path: string,
  token: string,
  addition: string,
): PatchFile | null {
  const absolutePath = join(root, path);

  if (!existsSync(absolutePath)) {
    return null;
  }

  const text = readText(absolutePath);

  if (text.includes(token)) {
    return null;
  }

  return {
    path,
    contents: `${text.trimEnd()}\n${addition}`,
  };
}

function createExpoIntegrationPatches(
  root: string,
  mfe: MfeTarget,
  platform: 'ios',
  additions: readonly NativePodDependency[],
): readonly PatchFile[];
function createExpoIntegrationPatches(
  root: string,
  mfe: MfeTarget,
  platform: 'android',
  additions: ExpoMfeIntegration['android'],
): readonly PatchFile[];
function createExpoIntegrationPatches(
  root: string,
  mfe: MfeTarget,
  platform: 'ios' | 'android',
  additions: readonly NativePodDependency[] | ExpoMfeIntegration['android'],
): readonly PatchFile[] {
  if (platform === 'ios' && (additions as readonly unknown[]).length === 0) {
    return [];
  }
  if (
    platform === 'android' &&
    (additions as ExpoMfeIntegration['android']).gradleProjects.length === 0 &&
    (additions as ExpoMfeIntegration['android']).gradleDependencies.length ===
      0 &&
    (additions as ExpoMfeIntegration['android']).permissions.length === 0
  ) {
    return [];
  }

  const current = readExpoIntegrationConfig(root);
  const currentMfe = current.mfes[mfe.name] ?? emptyExpoMfeIntegration();
  const nextMfe: ExpoMfeIntegration =
    platform === 'ios'
      ? {
          ...currentMfe,
          ios: {
            pods: mergePods(
              currentMfe.ios.pods,
              additions as readonly NativePodDependency[],
            ),
          },
        }
      : {
          ...currentMfe,
          android: mergeAndroidExpoIntegration(
            currentMfe.android,
            additions as ExpoMfeIntegration['android'],
            root,
            mfe.root,
          ),
        };
  const nextConfig: ExpoIntegrationConfig = {
    schemaVersion: 1,
    mfes: {
      ...current.mfes,
      [mfe.name]: nextMfe,
    },
  };
  const patches: PatchFile[] = [];
  const serializedConfig = `${JSON.stringify(nextConfig, null, 2)}\n`;

  if (readText(join(root, 'rnm.expo-integration.json')) !== serializedConfig) {
    patches.push({
      path: 'rnm.expo-integration.json',
      contents: serializedConfig,
    });
  }

  const pluginContents = createExpoPluginContents();

  if (readText(join(root, 'rnm.expo-plugin.cjs')) !== pluginContents) {
    patches.push({
      path: 'rnm.expo-plugin.cjs',
      contents: pluginContents,
    });
  }

  const appJsonPatch = createExpoAppJsonPatch(root);
  if (appJsonPatch) {
    patches.push(appJsonPatch);
  } else if (hasDynamicExpoConfig(root)) {
    const guide = createExpoAppConfigGuide();
    if (readText(join(root, 'rnm.expo-plugin.setup.md')) !== guide) {
      patches.push({
        path: 'rnm.expo-plugin.setup.md',
        contents: guide,
      });
    }
  }

  return patches;
}

function isExpoManagedNativeTarget(
  root: string,
  platform: 'ios' | 'android',
): boolean {
  if (!isExpoProject(root)) return false;
  if (platform === 'ios') return !existsSync(join(root, 'ios', 'Podfile'));
  return !(
    existsSync(join(root, 'android', 'settings.gradle')) ||
    existsSync(join(root, 'android', 'settings.gradle.kts')) ||
    existsSync(join(root, 'android', 'app', 'build.gradle')) ||
    existsSync(join(root, 'android', 'app', 'build.gradle.kts'))
  );
}

function isExpoProject(root: string): boolean {
  const packageJson = readJsonObject(join(root, 'package.json')) ?? {};
  const dependencies = {
    ...objectRecord(packageJson.dependencies),
    ...objectRecord(packageJson.devDependencies),
  };

  return (
    Boolean(dependencies.expo) ||
    existsSync(join(root, 'app.json')) ||
    hasDynamicExpoConfig(root)
  );
}

function hasDynamicExpoConfig(root: string): boolean {
  return [
    'app.config.js',
    'app.config.cjs',
    'app.config.mjs',
    'app.config.ts',
  ].some((file) => existsSync(join(root, file)));
}

function readExpoIntegrationConfig(root: string): ExpoIntegrationConfig {
  const path = join(root, 'rnm.expo-integration.json');

  if (!existsSync(path)) {
    return { schemaVersion: 1, mfes: {} };
  }

  return JSON.parse(readFileSync(path, 'utf8')) as ExpoIntegrationConfig;
}

function emptyExpoMfeIntegration(): ExpoMfeIntegration {
  return {
    ios: { pods: [] },
    android: {
      gradleProjects: [],
      gradleDependencies: [],
      permissions: [],
    },
  };
}

function mergePods(
  current: readonly NativePodDependency[],
  additions: readonly NativePodDependency[],
): readonly NativePodDependency[] {
  return uniqueByName([...current, ...additions]);
}

function mergeAndroidExpoIntegration(
  current: ExpoMfeIntegration['android'],
  additions: ExpoMfeIntegration['android'],
  hostRoot: string,
  mfeRoot: string,
): ExpoMfeIntegration['android'] {
  return {
    gradleProjects: uniqueByName([
      ...current.gradleProjects,
      ...additions.gradleProjects.map((project) =>
        normalizeGradleProjectForAndroidRoot(hostRoot, mfeRoot, project),
      ),
    ]),
    gradleDependencies: uniqueGradleDependencies([
      ...current.gradleDependencies,
      ...additions.gradleDependencies,
    ]),
    permissions: [
      ...new Set([...current.permissions, ...additions.permissions]),
    ]
      .filter(Boolean)
      .sort(),
  };
}

function normalizeGradleProjectForAndroidRoot(
  hostRoot: string,
  mfeRoot: string,
  project: NativeGradleProject,
): NativeGradleProject {
  if (!project.path) return project;
  return {
    ...project,
    path: toPosixPath(
      relative(join(hostRoot, 'android'), resolve(mfeRoot, project.path)),
    ),
  };
}

function uniqueByName<T extends { readonly name: string }>(
  values: readonly T[],
): readonly T[] {
  return [...new Map(values.map((value) => [value.name, value])).values()].sort(
    (a, b) => a.name.localeCompare(b.name),
  );
}

function uniqueGradleDependencies(
  values: readonly NativeGradleDependency[],
): readonly NativeGradleDependency[] {
  return [
    ...new Map(
      values.map((value) => [
        `${value.configuration}:${value.notation}`,
        value,
      ]),
    ).values(),
  ].sort((a, b) =>
    `${a.configuration}:${a.notation}`.localeCompare(
      `${b.configuration}:${b.notation}`,
    ),
  );
}

function createExpoAppJsonPatch(root: string): PatchFile | null {
  const path = join(root, 'app.json');
  if (!existsSync(path)) return null;

  const appJson = JSON.parse(readFileSync(path, 'utf8')) as Record<
    string,
    unknown
  >;
  const expo = objectRecordUnknown(appJson.expo);
  const plugins = Array.isArray(expo.plugins) ? [...expo.plugins] : [];

  if (!plugins.includes('./rnm.expo-plugin.cjs')) {
    plugins.push('./rnm.expo-plugin.cjs');
  }
  const contents = `${JSON.stringify(
    {
      ...appJson,
      expo: {
        ...expo,
        plugins,
      },
    },
    null,
    2,
  )}\n`;

  if (readFileSync(path, 'utf8') === contents) {
    return null;
  }

  return {
    path: 'app.json',
    contents,
  };
}

function objectRecordUnknown(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

async function approve(
  question: string,
  flags: Readonly<Record<string, string | boolean>>,
): Promise<boolean> {
  if (flags.yes === true) return true;
  if (!process.stdin.isTTY) return false;

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const answer = await rl.question(`${question} [y/N] `);
    return answer.trim().toLowerCase() === 'y';
  } finally {
    rl.close();
  }
}

function readRegistry(root: string): MfeRegistry {
  const path = join(root, 'rnm.registry.json');

  if (!existsSync(path)) {
    return createEmptyRegistry();
  }

  return JSON.parse(readFileSync(path, 'utf8')) as MfeRegistry;
}

function readNativeContract(root: string): NativeContract | undefined {
  const path = join(root, 'rnm.native-contract.json');

  if (!existsSync(path)) return undefined;

  return JSON.parse(readFileSync(path, 'utf8')) as NativeContract;
}

function readJsonObject(path: string): Record<string, unknown> | null {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
}

function readText(path: string): string {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function writeBackupIfNeeded(
  path: string,
  flags: Readonly<Record<string, string | boolean>>,
): void {
  if (flags['no-backup'] === true || !existsSync(path)) return;
  writeFileSync(`${path}.bak`, readFileSync(path));
}

function objectRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string',
    ),
  );
}

function stringFlag(value: string | boolean | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function singleRegisteredMfeName(registry: MfeRegistry): string | undefined {
  const names = Object.keys(registry.mfes);
  return names.length === 1 ? names[0] : undefined;
}

function containsToken(text: string, token: string): boolean {
  return text.includes(token);
}

function appendSection(
  text: string,
  title: string,
  lines: readonly string[],
  commentPrefix = '#',
): string {
  return `${text.trimEnd()}\n\n${commentPrefix} ${title}\n${lines.join('\n')}\n`;
}

function formatPodLine(pod: NativePodDependency): string {
  return pod.version
    ? `pod '${pod.name}', '${pod.version}'`
    : `pod '${pod.name}'`;
}

function formatGradleProjectLine(
  hostRoot: string,
  mfeRoot: string,
  project: NativeGradleProject,
): string {
  const name = project.name.replace(/^:/, '');
  const projectPath = project.path
    ? toPosixPath(
        relative(join(hostRoot, 'android'), resolve(mfeRoot, project.path)),
      )
    : undefined;

  if (!projectPath) {
    return `include ':${name}'`;
  }

  return [
    `include ':${name}'`,
    `project(':${name}').projectDir = new File(rootProject.projectDir, '${projectPath}')`,
  ].join('\n');
}

function sortRecord(record: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(record).sort(([a], [b]) => a.localeCompare(b)),
  );
}

function toPosixPath(path: string): string {
  return path.split(sep).join('/');
}

function defaultPodfileGenerated(): string {
  return [
    '# -----------------------------------------------------------------------------',
    '# <auto-generated by @bunin/react-native-micro-frontend>',
    '# Do not edit this file manually. Regenerate it with `rnm ios` or `rnm all`.',
    '# -----------------------------------------------------------------------------',
    '',
  ].join('\n');
}

function defaultAndroidSettingsGenerated(): string {
  return [
    '// -----------------------------------------------------------------------------',
    '// <auto-generated by @bunin/react-native-micro-frontend>',
    '// Do not edit this file manually. Regenerate it with `rnm aos` or `rnm all`.',
    '// -----------------------------------------------------------------------------',
    '',
  ].join('\n');
}

function defaultAndroidGenerated(): string {
  return [
    '// -----------------------------------------------------------------------------',
    '// <auto-generated by @bunin/react-native-micro-frontend>',
    '// Do not edit this file manually. Regenerate it with `rnm aos` or `rnm all`.',
    '// -----------------------------------------------------------------------------',
    '',
  ].join('\n');
}

function createExpoAppConfigGuide(): string {
  return `# React Native Micro Frontend Expo plugin setup

This Expo project uses a dynamic \`app.config.*\` file, so RNM generated the plugin and integration data but did not rewrite your JavaScript config automatically.

Add the plugin to your Expo config:

\`\`\`js
export default {
  expo: {
    plugins: [
      './rnm.expo-plugin.cjs',
    ],
  },
};
\`\`\`

Then run Expo prebuild normally:

\`\`\`bash
npx expo prebuild
\`\`\`
`;
}

function createExpoPluginContents(): string {
  return String.raw`const fs = require('node:fs');
const path = require('node:path');
const {
  withAndroidManifest,
  withDangerousMod,
} = require('expo/config-plugins');

function readIntegration(projectRoot) {
  const integrationPath = path.join(projectRoot, 'rnm.expo-integration.json');
  if (!fs.existsSync(integrationPath)) return { schemaVersion: 1, mfes: {} };
  return JSON.parse(fs.readFileSync(integrationPath, 'utf8'));
}

function collect(data, selector) {
  return Object.values(data.mfes || {}).flatMap((mfe) => selector(mfe));
}

function writeIfChanged(filePath, contents) {
  if (fs.existsSync(filePath) && fs.readFileSync(filePath, 'utf8') === contents) {
    return;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents);
}

function appendIfMissing(filePath, token, addition) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, 'utf8');
  if (text.includes(token)) return;
  fs.writeFileSync(filePath, text.trimEnd() + '\n' + addition);
}

function uniqueByKey(values, keySelector) {
  return [...new Map(values.map((value) => [keySelector(value), value])).values()];
}

function podLine(pod) {
  return pod.version
    ? "pod '" + pod.name + "', '" + pod.version + "'"
    : "pod '" + pod.name + "'";
}

function writeIos(projectRoot, iosRoot) {
  const data = readIntegration(projectRoot);
  const pods = uniqueByKey(
    collect(data, (mfe) => (mfe.ios && mfe.ios.pods) || []),
    (pod) => pod.name,
  );
  if (pods.length === 0) return;

  const generated = [
    '# -----------------------------------------------------------------------------',
    '# <auto-generated by @bunin/react-native-micro-frontend>',
    '# Generated during Expo prebuild by rnm.expo-plugin.cjs.',
    '# -----------------------------------------------------------------------------',
    '',
    '# Expo MFE pods',
    ...pods.map(podLine),
    '',
  ].join('\n');

  writeIfChanged(path.join(iosRoot, 'Podfile.rnm.generated.rb'), generated);
  appendIfMissing(
    path.join(iosRoot, 'Podfile'),
    "require_relative './Podfile.rnm.generated'",
    "\n# RNM generated MFE pods\nrequire_relative './Podfile.rnm.generated'\n",
  );
}

function gradleProjectLines(projects) {
  return projects.flatMap((project) => {
    const name = String(project.name || '').replace(/^:/, '');
    if (!name) return [];
    if (!project.path) return ["include ':" + name + "'"];
    return [
      "include ':" + name + "'",
      "project(':" + name + "').projectDir = new File(rootProject.projectDir, '" + project.path + "')",
    ];
  });
}

function writeAndroid(projectRoot, androidRoot) {
  const data = readIntegration(projectRoot);
  const projects = uniqueByKey(
    collect(data, (mfe) =>
      mfe.android && mfe.android.gradleProjects
        ? mfe.android.gradleProjects
        : [],
    ),
    (project) => project.name,
  );
  const dependencies = uniqueByKey(
    collect(data, (mfe) =>
      mfe.android && mfe.android.gradleDependencies
        ? mfe.android.gradleDependencies
        : [],
    ),
    (dependency) => dependency.configuration + ':' + dependency.notation,
  );

  if (projects.length > 0) {
    const settings = [
      '// -----------------------------------------------------------------------------',
      '// <auto-generated by @bunin/react-native-micro-frontend>',
      '// Generated during Expo prebuild by rnm.expo-plugin.cjs.',
      '// -----------------------------------------------------------------------------',
      '',
      '// Expo MFE Gradle projects',
      ...gradleProjectLines(projects),
      '',
    ].join('\n');

    writeIfChanged(path.join(androidRoot, 'rnm.settings.generated.gradle'), settings);
    appendIfMissing(
      path.join(androidRoot, 'settings.gradle'),
      'rnm.settings.generated.gradle',
      '\n// RNM generated MFE Gradle projects\napply from: file("rnm.settings.generated.gradle")\n',
    );
  }

  if (dependencies.length > 0) {
    const gradle = [
      '// -----------------------------------------------------------------------------',
      '// <auto-generated by @bunin/react-native-micro-frontend>',
      '// Generated during Expo prebuild by rnm.expo-plugin.cjs.',
      '// -----------------------------------------------------------------------------',
      '',
      '// Expo MFE Gradle dependencies',
      'dependencies {',
      ...dependencies.map(
        (dependency) =>
          '  ' + dependency.configuration + ' "' + dependency.notation + '"',
      ),
      '}',
      '',
    ].join('\n');

    writeIfChanged(path.join(androidRoot, 'rnm.generated.gradle'), gradle);
    appendIfMissing(
      path.join(androidRoot, 'app', 'build.gradle'),
      'rnm.generated.gradle',
      '\n// RNM generated MFE Android dependencies\napply from: file("../rnm.generated.gradle")\n',
    );
  }
}

function withRnmExpoPlugin(config) {
  config = withAndroidManifest(config, (config) => {
    const data = readIntegration(config.modRequest.projectRoot);
    const permissions = uniqueByKey(
      collect(data, (mfe) =>
        mfe.android && mfe.android.permissions ? mfe.android.permissions : [],
      ),
      (permission) => permission,
    );
    const manifest = config.modResults.manifest || {};
    const existing = new Set(
      (manifest['uses-permission'] || [])
        .map((permission) => permission.$ && permission.$['android:name'])
        .filter(Boolean),
    );
    manifest['uses-permission'] = manifest['uses-permission'] || [];

    for (const permission of permissions) {
      if (!existing.has(permission)) {
        manifest['uses-permission'].push({
          $: { 'android:name': permission },
        });
      }
    }

    config.modResults.manifest = manifest;
    return config;
  });

  config = withDangerousMod(config, [
    'ios',
    (config) => {
      writeIos(
        config.modRequest.projectRoot,
        config.modRequest.platformProjectRoot,
      );
      return config;
    },
  ]);

  config = withDangerousMod(config, [
    'android',
    (config) => {
      writeAndroid(
        config.modRequest.projectRoot,
        config.modRequest.platformProjectRoot,
      );
      return config;
    },
  ]);

  return config;
}

module.exports = withRnmExpoPlugin;
`;
}
