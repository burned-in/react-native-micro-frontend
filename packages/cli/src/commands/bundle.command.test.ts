import { afterEach, expect, test } from 'bun:test';
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runBundleCommand } from './bundle.command.js';

const tempRoots: string[] = [];

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { force: true, recursive: true });
  }
});

test('loads mfe.config.mjs through Bun when bundle metadata is omitted', () => {
  const root = createBundleFixture(
    'mfe.config.mjs',
    `export default { name: 'mjs-feature', version: '1.2.3', entry: './src/mjs-entry.tsx' };\n`,
  );

  const result = runBundleCommand(
    root,
    undefined,
    { platform: 'ios' },
    printer(),
  );

  expect(result).toBe(0);
  expect(readManifest(root, 'mjs-feature', 'ios')).toMatchObject({
    name: 'mjs-feature',
    version: '1.2.3',
    entryFile: './src/mjs-entry.tsx',
  });
});

test('loads mfe.config.cjs through Bun', () => {
  const root = createBundleFixture(
    'mfe.config.cjs',
    `module.exports = { name: 'cjs-feature', version: '7.8.9', entry: './src/cjs-entry.tsx' };
`,
  );

  const result = runBundleCommand(
    root,
    undefined,
    { platform: 'ios' },
    printer(),
  );

  expect(result).toBe(0);
  expect(readManifest(root, 'cjs-feature', 'ios')).toMatchObject({
    name: 'cjs-feature',
    version: '7.8.9',
    entryFile: './src/cjs-entry.tsx',
  });
});

test('records Metro entry module metadata and appends an archive export footer', () => {
  const root = createBundleFixture(
    'mfe.config.mjs',
    `export default { name: 'metro-feature', version: '2.0.0', entry: './src/index.tsx' };
`,
  );

  const result = runBundleCommand(
    root,
    undefined,
    { platform: 'android' },
    printer(),
  );

  expect(result).toBe(0);
  expect(readManifest(root, 'metro-feature', 'android')).toMatchObject({
    entryModuleId: 0,
    moduleGlobalName: '__rnm_mfe_module__',
    externalModules: [
      'react',
      'react/jsx-runtime',
      'react-native',
      '@bunin/react-native-micro-frontend',
      '@bunin/react-native-micro-frontend/runtime',
    ],
    metroModuleId: {
      react: 1,
      'react/jsx-runtime': 2,
      'react-native': 3,
      '@bunin/react-native-micro-frontend': 4,
      '@bunin/react-native-micro-frontend/runtime': 5,
    },
  });
  expect(
    readFileSync(
      join(
        root,
        'dist',
        'rnm-bundles',
        'metro-feature',
        'android',
        'index.bundle',
      ),
      'utf8',
    ),
  ).toContain('__rnm_mfe_module__');
});

test('copies host archive and generates React Native archive asset registration', () => {
  const root = createBundleFixture(
    'mfe.config.mjs',
    `export default { name: 'host-asset-feature', version: '3.0.0', entry: './src/index.tsx' };
`,
  );
  const hostRoot = mkdtempSync(join(tmpdir(), 'rnm-host-app-'));
  tempRoots.push(hostRoot);

  const result = runBundleCommand(
    root,
    undefined,
    { platform: 'ios', host: hostRoot, 'update-registry': true },
    printer(),
  );

  expect(result).toBe(0);
  expect(readManifest(hostRoot, 'host-asset-feature', 'ios')).toMatchObject({
    bundleArchiveUrl: '.bundle/rnm/host-asset-feature.ios.ota.tar.gz',
  });
  expect(
    readFileSync(join(hostRoot, 'rnm.bundle-archives.ts'), 'utf8'),
  ).toContain('registerBundleArchiveAssets');
  expect(
    readFileSync(join(hostRoot, 'rnm.bundle-archives.ts'), 'utf8'),
  ).toContain('registerBundleArchiveExternalModules');
  expect(
    readFileSync(join(hostRoot, 'rnm.bundle-archives.ts'), 'utf8'),
  ).toContain('require("./.bundle/rnm/host-asset-feature.ios.ota.tar.gz")');
});

test('auto-imports generated archive registration into host entry with --yes', () => {
  const root = createBundleFixture(
    'mfe.config.mjs',
    `export default { name: 'auto-register-feature', version: '4.0.0', entry: './src/index.tsx' };
`,
  );
  const hostRoot = mkdtempSync(join(tmpdir(), 'rnm-host-app-'));
  tempRoots.push(hostRoot);
  writeFileSync(
    join(hostRoot, 'index.ts'),
    "import { AppRegistry } from 'react-native';\n",
  );

  const result = runBundleCommand(
    root,
    undefined,
    {
      platform: 'ios',
      host: hostRoot,
      'update-registry': true,
      yes: true,
    },
    printer(),
  );

  expect(result).toBe(0);
  expect(readFileSync(join(hostRoot, 'index.ts'), 'utf8')).toStartWith(
    "import './rnm.bundle-archives';\n",
  );
});

function createBundleFixture(configFile: string, configSource: string): string {
  const root = mkdtempSync(join(tmpdir(), 'rnm-bundle-config-'));
  tempRoots.push(root);

  writeFileSync(join(root, 'package.json'), '{"version":"0.0.1"}\n');
  writeFileSync(join(root, configFile), configSource);

  const binDir = join(root, 'node_modules', '.bin');
  mkdirSync(binDir, { recursive: true });
  const reactNativeBin = join(binDir, 'react-native');
  writeFileSync(
    reactNativeBin,
    `#!/usr/bin/env node\nconst fs = require('node:fs');\nconst path = require('node:path');\nconst args = process.argv.slice(2);\nconst value = (flag) => args[args.indexOf(flag) + 1];\nconst bundleOutput = value('--bundle-output');\nconst assetsDest = value('--assets-dest');
const sourceMapOutput = value('--sourcemap-output');\nfs.mkdirSync(path.dirname(bundleOutput), { recursive: true });\nfs.writeFileSync(bundleOutput, [
  'var __r = () => ({ default: function FixtureMfe() {} });',
  '__d(function(){}, 0, [], "src/index.tsx");',
  '__d(function(){}, 1, [], "node_modules/react/index.js");',
  '__d(function(){}, 2, [], "node_modules/react/jsx-runtime.js");',
  '__d(function(){}, 3, [], "node_modules/react-native/index.js");',
  '__d(function(){}, 4, [], "node_modules/@bunin/react-native-micro-frontend/dist/mjs/index.mjs");',
  '__d(function(){}, 5, [], "node_modules/@bunin/react-native-micro-frontend/dist/mjs/runtime.mjs");',
  '__r(0);',
  '',
].join('\\n'));
if (sourceMapOutput) {
  fs.writeFileSync(sourceMapOutput, JSON.stringify({
    version: 3,
    sources: [
      '__prelude__',
      '__require_polyfill__',
      'src/index.tsx',
      'node_modules/react/index.js',
      'node_modules/react/jsx-runtime.js',
      'node_modules/react-native/index.js',
      'node_modules/@bunin/react-native-micro-frontend/dist/mjs/index.mjs',
      'node_modules/@bunin/react-native-micro-frontend/dist/mjs/runtime.mjs',
    ],
    mappings: '',
  }));
}
fs.mkdirSync(assetsDest, { recursive: true });\n`,
  );
  chmodSync(reactNativeBin, 0o755);

  return root;
}

function readManifest(
  root: string,
  name: string,
  platform: 'ios' | 'android',
): Record<string, unknown> {
  const bundleManifestPath = join(
    root,
    'dist',
    'rnm-bundles',
    name,
    platform,
    'manifest.json',
  );
  const registryPath = join(root, 'rnm.registry.json');

  try {
    return JSON.parse(readFileSync(bundleManifestPath, 'utf8')) as Record<
      string,
      unknown
    >;
  } catch {
    const registry = JSON.parse(readFileSync(registryPath, 'utf8')) as {
      readonly mfes: Record<string, Record<string, unknown>>;
    };
    return registry.mfes[name] ?? {};
  }
}

function printer(): {
  readonly log: (message: string) => void;
  readonly error: (message: string) => void;
} {
  return { log: () => {}, error: () => {} };
}
