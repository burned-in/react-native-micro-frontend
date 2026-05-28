import { afterEach, expect, test } from 'bun:test';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runBundleCommand } from './bundle.command.js';
import { runBundleAssetCommand } from './bundle-asset.command.js';

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
      'react-native/Libraries/Image/AssetRegistry',
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

test('externalizes only registered shared modules from archive runtime', () => {
  const root = createBundleFixture(
    'mfe.config.mjs',
    `export default { name: 'native-emitter-regression', version: '2.1.0', entry: './src/index.tsx' };
`,
  );

  const result = runBundleCommand(
    root,
    undefined,
    { platform: 'ios' },
    printer(),
  );

  expect(result).toBe(0);
  const bundleCode = readFileSync(
    join(
      root,
      'dist',
      'rnm-bundles',
      'native-emitter-regression',
      'ios',
      'index.bundle',
    ),
    'utf8',
  );

  expect(bundleCode).toContain(
    'RNM externalized a bundled shared dependency module, but no Host external module was registered for Metro module id 3.',
  );
  expect(bundleCode).toContain(
    'RNM externalized a bundled shared dependency module, but no Host external module was registered for Metro module id 6.',
  );
  expect(bundleCode).not.toContain(
    'RNM externalized a bundled shared dependency module, but no Host external module was registered for Metro module id 7.',
  );
  expect(bundleCode).toContain('NativeEventEmitter');
  expect(bundleCode).toContain('__rnm_mfe_module__');
  expect(bundleCode).toContain('registerAsset');
  expect(readManifest(root, 'native-emitter-regression', 'ios')).toMatchObject({
    metroModuleId: {
      'react-native': 3,
      'react-native/Libraries/Image/AssetRegistry': 6,
    },
  });
});

test('copies host archive and generates React Native archive asset registration', () => {
  const root = createBundleFixture(
    'mfe.config.mjs',
    `export default { name: 'host-asset-feature', version: '3.0.0', entry: './src/index.tsx' };
`,
  );
  const hostRoot = mkdtempSync(join(tmpdir(), 'rnm-host-app-'));
  tempRoots.push(hostRoot);
  writeFileSync(
    join(hostRoot, 'package.json'),
    '{"dependencies":{"react-native-blob-util":"^0.24.6"}}\n',
  );

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
  ).toContain('react-native/Libraries/Image/AssetRegistry');
  expect(
    readFileSync(join(hostRoot, 'rnm.bundle-archives.ts'), 'utf8'),
  ).not.toContain("require('react-native-blob-util')");
  expect(
    readFileSync(join(hostRoot, 'rnm.bundle-archives.ts'), 'utf8'),
  ).not.toContain("import ReactNativeBlobUtil from 'react-native-blob-util'");
  expect(
    readFileSync(join(hostRoot, 'rnm.bundle-archives.ts'), 'utf8'),
  ).not.toContain('declare const require');
  expect(
    readFileSync(join(hostRoot, 'rnm.bundle-archives.ts'), 'utf8'),
  ).not.toContain('ReactNative.NativeModules');
  expect(
    readFileSync(join(hostRoot, 'rnm.bundle-archives.ts'), 'utf8'),
  ).not.toContain('registerBundleArchiveAssetFileSystem');
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

test('bundle-asset traces require/import assets and excludes unused/code files', () => {
  const root = createAssetFixture();

  const result = runBundleAssetCommand(
    root,
    'asset-feature',
    { platform: 'ios', entry: './src/index.tsx' },
    printer(),
  );

  expect(result).toBe(0);
  const manifest = JSON.parse(
    readFileSync(
      join(
        root,
        'dist',
        'rnm-bundles',
        'asset-feature',
        'ios',
        'asset-manifest.json',
      ),
      'utf8',
    ),
  ) as { assets: { sourcePath: string; files: { archivePath: string }[] }[] };
  const sourcePaths = manifest.assets.map((asset) => asset.sourcePath).sort();

  expect(sourcePaths).toEqual([
    'src/assets/data.json',
    'src/assets/fonts/Pretendard.ttf',
    'src/assets/local.db',
    'src/assets/logo.png',
    'src/assets/lottie/loading.lottie',
    'src/assets/manual.pdf',
    'src/test.jpg',
  ]);
  expect(sourcePaths).not.toContain('src/assets/unused.png');
  expect(sourcePaths).not.toContain('src/assets/component.ts');
  expect(sourcePaths).not.toContain('src/assets/types.d.ts');
  expect(sourcePaths).not.toContain('src/assets/app.js.map');
  expect(
    existsSync(
      join(
        root,
        'dist',
        'rnm-bundles',
        'asset-feature',
        'ios',
        'assets',
        'assets',
        'src',
        'test.jpg',
      ),
    ),
  ).toBe(true);
});

test('bundle-asset writes Android density archive paths', () => {
  const root = createAssetFixture();

  const result = runBundleAssetCommand(
    root,
    'asset-feature',
    { platform: 'android', entry: './src/index.tsx' },
    printer(),
  );

  expect(result).toBe(0);
  const manifest = JSON.parse(
    readFileSync(
      join(
        root,
        'dist',
        'rnm-bundles',
        'asset-feature',
        'android',
        'asset-manifest.json',
      ),
      'utf8',
    ),
  ) as {
    assets: {
      sourcePath: string;
      files: { archivePath: string; platformPath?: string }[];
    }[];
  };
  const jpg = manifest.assets.find(
    (asset) => asset.sourcePath === 'src/test.jpg',
  );

  expect(jpg?.files[0]).toEqual({
    scale: 1,
    archivePath: 'assets/drawable-mdpi/src_test.jpg',
    originalPath: 'src/test.jpg',
    platformPath: 'drawable-mdpi/src_test.jpg',
  });
});

test('bundle-asset supports glob fallback for dynamic require warnings', () => {
  const root = createAssetFixture(
    "const name = 'logo';\n" +
      'export const image = require(`./assets/${' +
      'name' +
      '}.png`);\n',
  );

  const logs: string[] = [];
  const result = runBundleAssetCommand(
    root,
    'asset-feature',
    {
      platform: 'ios',
      entry: './src/index.tsx',
      'asset-glob': 'src/assets/*.png',
    },
    {
      log: (message) => logs.push(message),
      error: (message) => logs.push(message),
    },
  );

  expect(result).toBe(0);
  expect(
    logs.some((line) =>
      line.includes('Dynamic require could not be statically resolved'),
    ),
  ).toBe(true);
  const manifest = JSON.parse(
    readFileSync(
      join(
        root,
        'dist',
        'rnm-bundles',
        'asset-feature',
        'ios',
        'asset-manifest.json',
      ),
      'utf8',
    ),
  ) as { assets: { sourcePath: string }[] };
  expect(manifest.assets.map((asset) => asset.sourcePath)).toContain(
    'src/assets/logo.png',
  );
});

test('rnm bundle automatically embeds asset metadata matched with Metro registerAsset', () => {
  const root = createBundleFixture(
    'mfe.config.mjs',
    `export default { name: 'asset-bundle-feature', version: '5.0.0', entry: './src/index.tsx' };
`,
  );
  mkdirSync(join(root, 'src'), { recursive: true });
  writeFileSync(
    join(root, 'src', 'index.tsx'),
    "export const image = require('./test.jpg');\n",
  );
  writeFileSync(join(root, 'src', 'test.jpg'), 'jpg');
  writeFileSync(join(root, 'src', 'dead.jpg'), 'dead');

  const result = runBundleCommand(
    root,
    undefined,
    { platform: 'ios' },
    printer(),
  );

  expect(result).toBe(0);
  const manifest = readManifest(root, 'asset-bundle-feature', 'ios') as {
    assets?: {
      sourcePath: string;
      hash?: string;
      width?: number;
      height?: number;
      httpServerLocation?: string;
      files: { archivePath: string }[];
    }[];
  };

  expect(manifest.assets).toHaveLength(1);
  expect(manifest.assets?.[0]).toMatchObject({
    sourcePath: 'src/test.jpg',
    hash: '074e25',
    width: 550,
    height: 366,
    httpServerLocation: '/assets/src',
    files: [{ archivePath: 'assets/assets/src/test.jpg' }],
  });
  expect(
    existsSync(
      join(
        root,
        'dist',
        'rnm-bundles',
        'asset-bundle-feature',
        'ios',
        'assets',
        'assets',
        'src',
        'test.jpg',
      ),
    ),
  ).toBe(true);
  expect(
    existsSync(
      join(
        root,
        'dist',
        'rnm-bundles',
        'asset-bundle-feature',
        'ios',
        'assets',
        'assets',
        'src',
        'dead.jpg',
      ),
    ),
  ).toBe(false);
});

test('rnm bundle includes assets that appear in Metro registerAsset even when static tracing misses them', () => {
  const root = createBundleFixture(
    'mfe.config.mjs',
    `export default { name: 'metro-only-asset-feature', version: '5.1.0', entry: './src/index.tsx' };
`,
  );
  mkdirSync(join(root, 'src'), { recursive: true });
  writeFileSync(join(root, 'src', 'index.tsx'), 'export const value = 1;\n');
  writeFileSync(join(root, 'src', 'test.jpg'), 'jpg');

  const result = runBundleCommand(
    root,
    undefined,
    { platform: 'ios' },
    printer(),
  );

  expect(result).toBe(0);
  const manifest = readManifest(root, 'metro-only-asset-feature', 'ios') as {
    assets?: { sourcePath: string; files: { archivePath: string }[] }[];
  };

  expect(manifest.assets).toHaveLength(1);
  expect(manifest.assets?.[0]?.sourcePath).toBe('src/test.jpg');
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
  '__d(function(){throw new Error("\`new NativeEventEmitter()\` requires a non-null argument.");}, 6, [], "node_modules/react-native/Libraries/Image/AssetRegistry.js");',
  '__d(function(){throw new Error("\`new NativeEventEmitter()\` requires a non-null argument.");}, 7, [], "node_modules/react-native/Libraries/EventEmitter/NativeEventEmitter.js");',
  'require("react-native/Libraries/Image/AssetRegistry").registerAsset({__packager_asset:true,httpServerLocation:"/assets/src",name:"test",type:"jpg",scales:[1],hash:"074e25",width:550,height:366});',
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
      'node_modules/react-native/Libraries/Image/AssetRegistry.js',
      'node_modules/react-native/Libraries/EventEmitter/NativeEventEmitter.js',
    ],
    mappings: '',
  }));
}
fs.mkdirSync(assetsDest, { recursive: true });\n`,
  );
  chmodSync(reactNativeBin, 0o755);

  return root;
}

function createAssetFixture(
  entrySource = `
  import logo from './assets/logo.png';
  import font from './assets/fonts/Pretendard.ttf';
  import data from './assets/data.json';
  import animation from './assets/lottie/loading.lottie';
  import manual from './assets/manual.pdf';
  import database from './assets/local.db';
  export const image = require('./test.jpg');
  export const assets = [logo, font, data, animation, manual, database, image];
`,
): string {
  const root = mkdtempSync(join(tmpdir(), 'rnm-bundle-assets-'));
  tempRoots.push(root);
  mkdirSync(join(root, 'src', 'assets', 'fonts'), { recursive: true });
  mkdirSync(join(root, 'src', 'assets', 'lottie'), { recursive: true });
  writeFileSync(join(root, 'src', 'index.tsx'), entrySource);
  writeFileSync(join(root, 'src', 'test.jpg'), 'jpg');
  writeFileSync(join(root, 'src', 'assets', 'logo.png'), 'png');
  writeFileSync(join(root, 'src', 'assets', 'unused.png'), 'unused');
  writeFileSync(join(root, 'src', 'assets', 'fonts', 'Pretendard.ttf'), 'font');
  writeFileSync(join(root, 'src', 'assets', 'data.json'), '{"ok":true}');
  writeFileSync(join(root, 'src', 'assets', 'lottie', 'loading.lottie'), '{}');
  writeFileSync(join(root, 'src', 'assets', 'manual.pdf'), 'pdf');
  writeFileSync(join(root, 'src', 'assets', 'local.db'), 'db');
  writeFileSync(
    join(root, 'metro.config.js'),
    "module.exports = { resolver: { assetExts: ['db'] } };\n",
  );
  writeFileSync(join(root, 'src', 'assets', 'component.ts'), 'export {};');
  writeFileSync(
    join(root, 'src', 'assets', 'types.d.ts'),
    'declare const x: string;',
  );
  writeFileSync(join(root, 'src', 'assets', 'app.js.map'), '{}');
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
