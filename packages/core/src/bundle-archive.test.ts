import { afterEach, describe, expect, test } from 'bun:test';
import { Buffer } from 'node:buffer';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createBundleArchiveLoader,
  createDefaultRnmAssetFileSystem,
  createReactNativeBlobUtilAssetFileSystem,
  loadBundleArchiveModule,
  registerBundleArchiveAsset,
  registerBundleArchiveAssetFileSystem,
  registerBundleArchiveExternalModules,
} from './bundle-archive.js';
import type { MfeManifest } from './domain/mfe-manifest.type.js';
import type { MicroFrontendModule } from './runtime.js';

interface TestProps {
  readonly title?: string;
}

const tempRoots: string[] = [];
const metroGlobalKeys = [
  '__d',
  '__r',
  '__c',
  '__registerSegment',
  '__METRO_GLOBAL_PREFIX__',
  '__rnm_mfe_module__',
] as const;
const originalMetroGlobals = new Map(
  metroGlobalKeys.map((key) => [
    key,
    {
      exists: Object.hasOwn(globalThis, key),
      value: (globalThis as Record<string, unknown>)[key],
    },
  ]),
);

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { force: true, recursive: true });
  }

  for (const key of metroGlobalKeys) {
    const original = originalMetroGlobals.get(key);
    if (original?.exists) {
      (globalThis as Record<string, unknown>)[key] = original.value;
    } else {
      delete (globalThis as Record<string, unknown>)[key];
    }
  }

  registerBundleArchiveAssetFileSystem(undefined);
});

describe('bundle archive loader', () => {
  const manifest: MfeManifest = {
    name: 'mfe-feature',
    version: '1.0.0',
    entry: './src/index.tsx',
    path: '../mfe-feature',
    ota: { enabled: true, mode: 'manual', provider: 'custom' },
    nativeChangePolicy: 'ask',
    status: 'active',
    bundleArchiveUrl: '.bundle/rnm/mfe-feature.ios.ota.tar.gz',
  };

  test('reads, gunzips, untars, and evaluates a CommonJS component module', async () => {
    const archive = createFixtureArchive({
      name: manifest.name,
      bundleCode: `
        const React = require('react');
        module.exports.default = function ArchiveMfe(props) {
          return React.createElement('Text', null, props.title || 'Archive MFE');
        };
      `,
    });
    const React = {
      createElement: (type: string, props: unknown, children: unknown) => ({
        type,
        props,
        children,
      }),
    };

    const module = await loadBundleArchiveModule<
      MicroFrontendModule<TestProps>
    >(manifest, {
      readArchive: () => archive,
      externalModules: { react: React },
    });

    expect(typeof module.default).toBe('function');
    expect(module.default({ title: 'Loaded from archive' })).toEqual({
      type: 'Text',
      props: null,
      children: 'Loaded from archive',
    });
  });

  test('creates a custom runtime loader for bundleArchiveUrl manifests', async () => {
    const archive = createFixtureArchive({
      name: manifest.name,
      bundleCode: `module.exports.default = function ArchiveMfe() { return 'ok'; };`,
    });
    const load = createBundleArchiveLoader<MicroFrontendModule>({
      readArchive: () => archive,
    });

    await expect(load(manifest)).resolves.toMatchObject({
      default: expect.any(Function),
    });
  });

  test('keeps Node/Bun local archive loading working without injected readers', async () => {
    const archive = createFixtureArchive({
      name: manifest.name,
      bundleCode: `module.exports.default = function LocalArchiveMfe() { return 'local'; };`,
    });
    const root = mkdtempSync(join(tmpdir(), 'rnm-local-archive-'));
    tempRoots.push(root);
    const archiveDir = join(root, '.bundle', 'rnm');
    mkdirSync(archiveDir, { recursive: true });
    writeFileSync(join(archiveDir, 'mfe-feature.ios.ota.tar.gz'), archive);

    await expect(
      loadBundleArchiveModule<MicroFrontendModule>(manifest, {
        hostRoot: root,
      }),
    ).resolves.toMatchObject({ default: expect.any(Function) });
  });

  test('reports unreadable React Native archive URLs without Node/Bun fallbacks', async () => {
    const originalFunction = globalThis.Function;
    let dynamicImportFallbackCalled = false;

    Object.defineProperty(globalThis, 'Function', {
      configurable: true,
      value: ((...args: unknown[]) => {
        if (args.some((arg) => String(arg).includes('return import'))) {
          dynamicImportFallbackCalled = true;
        }
        return originalFunction(
          ...(args as ConstructorParameters<FunctionConstructor>),
        );
      }) as FunctionConstructor,
    });

    try {
      await expect(
        loadBundleArchiveModule(manifest, { runtime: 'react-native' }),
      ).rejects.toThrow('React Native could not read bundleArchiveUrl');
      expect(dynamicImportFallbackCalled).toBe(false);
    } finally {
      Object.defineProperty(globalThis, 'Function', {
        configurable: true,
        value: originalFunction,
      });
    }
  });

  test('loads a React Native archive when Hermes has no TextDecoder', async () => {
    const archive = createFixtureArchive({
      name: manifest.name,
      entryModuleId: 0,
      moduleGlobalName: '__rnm_mfe_module__',
      bundleCode: `
        var __r = function (id) {
          if (id !== 0) throw new Error('missing module ' + id);
          return { default: function HermesNoTextDecoderMfe() {
            return 'rn:한글🚀';
          } };
        };
        __r(0);
      `,
    });
    const originalTextDecoder = globalThis.TextDecoder;

    Object.defineProperty(globalThis, 'TextDecoder', {
      configurable: true,
      value: undefined,
    });

    try {
      const module = await loadBundleArchiveModule<MicroFrontendModule>(
        manifest,
        {
          runtime: 'react-native',
          readArchive: () => archive,
        },
      );

      expect(module.default()).toBe('rn:한글🚀');
    } finally {
      Object.defineProperty(globalThis, 'TextDecoder', {
        configurable: true,
        value: originalTextDecoder,
      });
    }
  });

  test('loads a React Native archive with built-in JS gunzip and evaluator', async () => {
    const archive = createFixtureArchive({
      name: manifest.name,
      entryModuleId: 0,
      moduleGlobalName: '__rnm_mfe_module__',
      bundleCode: `
        var __r = function (id) {
          if (id !== 0) throw new Error('missing module ' + id);
          return { default: function ReactNativeArchiveMfe(props) {
            return 'rn:' + (props.title || 'archive');
          } };
        };
        __r(0);
      `,
    });

    const module = await loadBundleArchiveModule<
      MicroFrontendModule<TestProps>
    >(manifest, {
      runtime: 'react-native',
      readArchive: () => archive,
    });

    expect(module.default({ title: 'loaded' })).toBe('rn:loaded');
  });

  test('loads a React Native registered archive asset without a custom reader', async () => {
    const archive = createFixtureArchive({
      name: manifest.name,
      entryModuleId: 0,
      moduleGlobalName: '__rnm_mfe_module__',
      bundleCode: `
        var __r = function (id) {
          if (id !== 0) throw new Error('missing module ' + id);
          return { default: function RegisteredAssetMfe(props) {
            return 'asset:' + (props.title || 'archive');
          } };
        };
        __r(0);
      `,
    });
    const assetUri = `data:application/gzip;base64,${Buffer.from(archive).toString('base64')}`;

    registerBundleArchiveAsset(manifest.bundleArchiveUrl ?? '', assetUri);

    const module = await loadBundleArchiveModule<
      MicroFrontendModule<TestProps>
    >(manifest, { runtime: 'react-native' });

    expect(module.default({ title: 'registered' })).toBe('asset:registered');
  });

  test('still allows explicit React Native evaluate adapters', async () => {
    const archive = createFixtureArchive({
      name: manifest.name,
      bundleCode: `throw new Error('default evaluator must not run');`,
    });

    const module = await loadBundleArchiveModule<
      MicroFrontendModule<TestProps>
    >(manifest, {
      runtime: 'react-native',
      readArchive: () => archive,
      evaluate: ({ archiveManifest }) => ({
        default: function ReactNativeAdapterMfe(props: TestProps) {
          return `${archiveManifest.name}:${props.title ?? 'adapter'}`;
        },
      }),
    });

    expect(module.default({ title: 'loaded' })).toBe('mfe-feature:loaded');
  });

  test('evaluates a Metro entry module as a default component module', async () => {
    const archive = createFixtureArchive({
      name: manifest.name,
      entryModuleId: 0,
      moduleGlobalName: '__rnm_mfe_module__',
      bundleCode: `
        var __r;
        var __d;
        (function () {
          const modules = new Map();
          __d = function (factory, id) {
            modules.set(id, { factory, exports: {}, initialized: false });
          };
          __r = function (id) {
            const module = modules.get(id);
            if (!module) throw new Error('missing module ' + id);
            if (!module.initialized) {
              module.initialized = true;
              module.factory(globalThis, __r, undefined, undefined, module, module.exports);
            }
            return module.exports;
          };
        })();
        __d(function (global, require, importDefault, importAll, module, exports) {
          exports.default = function MetroArchiveMfe(props) {
            return 'metro:' + (props.title || 'entry');
          };
        }, 0);
        __r(0);
      `,
    });

    const module = await loadBundleArchiveModule<
      MicroFrontendModule<TestProps>
    >(manifest, { readArchive: () => archive });

    expect(module.default({ title: 'component' })).toBe('metro:component');
  });

  test('evaluates Metro bundles against one shared runtime global', async () => {
    const archive = createFixtureArchive({
      name: manifest.name,
      entryModuleId: 0,
      moduleGlobalName: '__rnm_mfe_module__',
      bundleCode: `
        (function (global) {
          if (global !== globalThis) {
            throw new Error('Metro global split from evaluator globalThis');
          }
          const modules = new Map();
          global.__d = function (factory, id) {
            modules.set(id, { factory, exports: {}, initialized: false });
          };
          global.__r = function (id) {
            const module = modules.get(id);
            if (!module) throw new Error('missing module ' + id);
            if (!module.initialized) {
              module.initialized = true;
              module.factory(global, global.__r, undefined, undefined, module, module.exports);
            }
            return module.exports;
          };
        })(this);
        __d(function (global, require, importDefault, importAll, module, exports) {
          exports.default = function SharedGlobalMfe(props) {
            return 'shared:' + (props.title || 'entry');
          };
        }, 0);
      `,
    });

    const module = await loadBundleArchiveModule<
      MicroFrontendModule<TestProps>
    >(manifest, { readArchive: () => archive });

    expect(module.default({ title: 'global' })).toBe('shared:global');
  });

  test('prefers the Metro entry module over non-empty CommonJS exports', async () => {
    const archive = createFixtureArchive({
      name: manifest.name,
      entryModuleId: 0,
      moduleGlobalName: '__rnm_mfe_module__',
      bundleCode: `
        module.exports.notTheMetroEntry = true;
        var __r;
        var __d;
        (function () {
          const modules = new Map();
          __d = function (factory, id) {
            modules.set(id, { factory, exports: {}, initialized: false });
          };
          __r = function (id) {
            const module = modules.get(id);
            if (!module) throw new Error('missing module ' + id);
            if (!module.initialized) {
              module.initialized = true;
              module.factory(globalThis, __r, undefined, undefined, module, module.exports);
            }
            return module.exports;
          };
        })();
        __d(function (global, require, importDefault, importAll, module, exports) {
          exports.default = function PreferredMetroEntryMfe(props) {
            return 'entry:' + (props.title || 'module');
          };
        }, 0);
      `,
    });

    const module = await loadBundleArchiveModule<
      MicroFrontendModule<TestProps>
    >(manifest, { readArchive: () => archive });

    expect(module.default({ title: 'preferred' })).toBe('entry:preferred');
  });

  test('restores Host Metro globals after successful Metro bundle evaluation', async () => {
    const originalRequire = function hostRequire() {
      return { default: function HostMfe() {} };
    };
    const originalDefine = function hostDefine() {};
    const originalClear = function hostClear() {};
    const originalSegment = function hostRegisterSegment() {};
    const runtimeGlobal = globalThis as Record<string, unknown>;

    runtimeGlobal.__r = originalRequire;
    runtimeGlobal.__d = originalDefine;
    runtimeGlobal.__c = originalClear;
    runtimeGlobal.__registerSegment = originalSegment;
    runtimeGlobal.__METRO_GLOBAL_PREFIX__ = 'host_';

    const archive = createFixtureArchive({
      name: manifest.name,
      entryModuleId: 0,
      moduleGlobalName: '__rnm_mfe_module__',
      bundleCode: `
        globalThis.__r = function mfeRequire(id) {
          if (id !== 0) throw new Error('missing module ' + id);
          return { default: function RestoredMfe() { return 'ok'; } };
        };
        globalThis.__d = function mfeDefine() {};
        globalThis.__c = function mfeClear() {};
        globalThis.__registerSegment = function mfeRegisterSegment() {};
        globalThis.__METRO_GLOBAL_PREFIX__ = 'mfe_';
      `,
    });

    const module = await loadBundleArchiveModule<MicroFrontendModule>(
      manifest,
      { readArchive: () => archive },
    );

    expect(module.default()).toBe('ok');
    expect(runtimeGlobal.__r).toBe(originalRequire);
    expect(runtimeGlobal.__d).toBe(originalDefine);
    expect(runtimeGlobal.__c).toBe(originalClear);
    expect(runtimeGlobal.__registerSegment).toBe(originalSegment);
    expect(runtimeGlobal.__METRO_GLOBAL_PREFIX__).toBe('host_');
    expect(runtimeGlobal.__rnm_mfe_module__).toBeUndefined();
  });

  test('restores Host Metro globals when Metro bundle evaluation fails', async () => {
    const runtimeGlobal = globalThis as Record<string, unknown>;
    const originalRequire = function hostRequire() {};
    runtimeGlobal.__r = originalRequire;
    runtimeGlobal.__d = 'host-define';
    runtimeGlobal.__c = 'host-clear';
    runtimeGlobal.__registerSegment = 'host-segment';
    runtimeGlobal.__METRO_GLOBAL_PREFIX__ = 'host_';

    const archive = createFixtureArchive({
      name: manifest.name,
      bundleCode: `
        globalThis.__r = function mfeRequire() {};
        globalThis.__d = function mfeDefine() {};
        globalThis.__c = function mfeClear() {};
        globalThis.__registerSegment = function mfeRegisterSegment() {};
        globalThis.__METRO_GLOBAL_PREFIX__ = 'mfe_';
        throw new Error('bundle exploded');
      `,
    });

    await expect(
      loadBundleArchiveModule(manifest, { readArchive: () => archive }),
    ).rejects.toThrow('bundle exploded');

    expect(runtimeGlobal.__r).toBe(originalRequire);
    expect(runtimeGlobal.__d).toBe('host-define');
    expect(runtimeGlobal.__c).toBe('host-clear');
    expect(runtimeGlobal.__registerSegment).toBe('host-segment');
    expect(runtimeGlobal.__METRO_GLOBAL_PREFIX__).toBe('host_');
  });

  test('applies externalModules to Metro numeric shared dependency modules', async () => {
    const hostReact = {
      createElement: (type: string, props: unknown, children: unknown) => ({
        type,
        props,
        children,
        owner: 'host-react',
      }),
    };
    const archive = createFixtureArchive({
      name: manifest.name,
      entryModuleId: 0,
      moduleGlobalName: '__rnm_mfe_module__',
      sharedModules: [{ name: 'react', moduleId: 1 }],
      metroModuleId: { react: 1 },
      externalModules: ['react'],
      bundleCode: `
        (function (global) {
          const modules = new Map();
          global.__d = function (factory, id, dependencyMap) {
            modules.set(id, { factory, dependencyMap, exports: {}, initialized: false });
          };
          global.__r = function (id) {
            const module = modules.get(id);
            if (!module) throw new Error('missing module ' + id);
            if (!module.initialized) {
              module.initialized = true;
              module.factory(global, global.__r, undefined, undefined, module, module.exports, module.dependencyMap);
            }
            return module.exports;
          };
        })(globalThis);
        __d(function (global, require, importDefault, importAll, module, exports) {
          throw new Error('bundled React must not initialize');
        }, 1, []);
        __d(function (global, require, importDefault, importAll, module, exports, dependencyMap) {
          const React = require(dependencyMap[0]);
          exports.default = function SharedReactMfe(props) {
            return React.createElement('Text', null, 'shared:' + (props.title || 'react'));
          };
        }, 0, [1]);
      `,
    });

    const module = await loadBundleArchiveModule<
      MicroFrontendModule<TestProps>
    >(manifest, {
      readArchive: () => archive,
      externalModules: { react: hostReact },
    });

    expect(module.default({ title: 'host' })).toEqual({
      type: 'Text',
      props: null,
      children: 'shared:host',
      owner: 'host-react',
    });
  });

  test('uses host React and runtime hooks for Metro numeric shared dependencies', async () => {
    const hostReact = { marker: 'host-react' };
    const hostRuntime = {
      useIsMfe: () => true,
      useMicroFrontendSharedState: () => ({ source: 'host-runtime' }),
    };
    const archive = createFixtureArchive({
      name: manifest.name,
      entryModuleId: 0,
      moduleGlobalName: '__rnm_mfe_module__',
      sharedModules: [
        { name: 'react', moduleId: 1 },
        { name: '@bunin/react-native-micro-frontend/runtime', moduleId: 2 },
      ],
      metroModuleId: {
        react: 1,
        '@bunin/react-native-micro-frontend/runtime': 2,
      },
      externalModules: ['react', '@bunin/react-native-micro-frontend/runtime'],
      bundleCode: `
        (function (global) {
          const modules = new Map();
          global.__d = function (factory, id, dependencyMap) {
            modules.set(id, { factory, dependencyMap, exports: {}, initialized: false });
          };
          global.__r = function (id) {
            const module = modules.get(id);
            if (!module) throw new Error('missing module ' + id);
            if (!module.initialized) {
              module.initialized = true;
              module.factory(global, global.__r, undefined, undefined, module, module.exports, module.dependencyMap);
            }
            return module.exports;
          };
        })(globalThis);
        __d(function () { throw new Error('duplicate React initialized'); }, 1, []);
        __d(function () { throw new Error('duplicate runtime initialized'); }, 2, []);
        __d(function (global, require, importDefault, importAll, module, exports, dependencyMap) {
          const React = require(dependencyMap[0]);
          const runtime = require(dependencyMap[1]);
          exports.default = function HookMfe() {
            if (React.marker !== 'host-react') throw new Error('renderer mismatch');
            return runtime.useIsMfe() ? runtime.useMicroFrontendSharedState().source : 'not-mfe';
          };
        }, 0, [1, 2]);
      `,
    });

    const module = await loadBundleArchiveModule<MicroFrontendModule>(
      manifest,
      {
        readArchive: () => archive,
        externalModules: {
          react: hostReact,
          '@bunin/react-native-micro-frontend/runtime': hostRuntime,
        },
      },
    );

    expect(module.default()).toBe('host-runtime');
  });

  test('uses registered host external modules when loader options omit externalModules', async () => {
    const registeredReact = {
      createElement: (type: string, props: unknown, children: unknown) => ({
        type,
        props,
        children,
        owner: 'registered-host-react',
      }),
    };
    registerBundleArchiveExternalModules({ react: registeredReact });

    const archive = createFixtureArchive({
      name: manifest.name,
      entryModuleId: 0,
      moduleGlobalName: '__rnm_mfe_module__',
      sharedModules: [{ name: 'react', moduleId: 1 }],
      metroModuleId: { react: 1 },
      externalModules: ['react'],
      bundleCode: `
        (function (global) {
          const modules = new Map();
          global.__d = function (factory, id, dependencyMap) {
            modules.set(id, { factory, dependencyMap, exports: {}, initialized: false });
          };
          global.__r = function (id) {
            const module = modules.get(id);
            if (!module) throw new Error('missing module ' + id);
            if (!module.initialized) {
              module.initialized = true;
              module.factory(global, global.__r, undefined, undefined, module, module.exports, module.dependencyMap);
            }
            return module.exports;
          };
        })(globalThis);
        __d(function () { throw new Error('registered shared React was not used'); }, 1, []);
        __d(function (global, require, importDefault, importAll, module, exports, dependencyMap) {
          const React = require(dependencyMap[0]);
          exports.default = function RegisteredSharedReactMfe() {
            return React.createElement('Text', null, 'registered');
          };
        }, 0, [1]);
      `,
    });

    const module = await loadBundleArchiveModule<MicroFrontendModule>(
      manifest,
      { readArchive: () => archive },
    );

    expect(module.default()).toEqual({
      type: 'Text',
      props: null,
      children: 'registered',
      owner: 'registered-host-react',
    });
  });

  test('does not ship the Hermes-invalid dynamic import Function body literally', () => {
    const source = Bun.file(new URL('./bundle-archive.ts', import.meta.url));
    return expect(source.text()).resolves.not.toContain(
      'return import(specifier)',
    );
  });

  test('extracts archive assets and resolves them through React Native Image before evaluation', async () => {
    const archive = createFixtureArchive({
      name: manifest.name,
      assets: [
        {
          sourcePath: 'src/test.jpg',
          name: 'test',
          type: 'jpg',
          httpServerLocation: '/assets/src',
          scales: [1],
          hash: '074e25',
          width: 550,
          height: 366,
          files: [
            {
              scale: 1,
              archivePath: 'assets/assets/src/test.jpg',
              originalPath: 'src/test.jpg',
            },
          ],
        },
      ],
      assetFiles: [{ path: 'assets/assets/src/test.jpg', contents: 'jpg' }],
      bundleCode: `
        const ReactNative = require('react-native');
        module.exports.default = function AssetUriMfe() {
          return ReactNative.Image.resolveAssetSource({
            sourcePath: 'src/test.jpg',
            name: 'test',
            type: 'jpg',
            httpServerLocation: '/assets/src'
          }).uri;
        };
      `,
    });
    const root = mkdtempSync(join(tmpdir(), 'rnm-asset-cache-'));
    tempRoots.push(root);

    const module = await loadBundleArchiveModule<MicroFrontendModule>(
      manifest,
      {
        readArchive: () => archive,
        assetFileSystem: createDefaultRnmAssetFileSystem(root),
        externalModules: {
          'react-native': {
            Image: { resolveAssetSource: () => ({ uri: 'host://fallback' }) },
          },
        },
      },
    );

    const uri = module.default();
    expect(uri).toContain('/rnm-assets/mfe-feature/1.0.0/ios/');
    expect(uri).toEndWith('/assets/assets/src/test.jpg');
  });

  test('resolves Metro registerAsset ids through inline archive assets without a file-system adapter', async () => {
    const archive = createFixtureArchive({
      name: manifest.name,
      assets: [
        {
          sourcePath: 'src/test.jpg',
          name: 'test',
          type: 'jpg',
          httpServerLocation: '/assets/src',
          scales: [1],
          files: [
            {
              scale: 1,
              archivePath: 'assets/assets/src/test.jpg',
              originalPath: 'src/test.jpg',
            },
          ],
        },
      ],
      assetFiles: [{ path: 'assets/assets/src/test.jpg', contents: 'jpg' }],
      bundleCode: `
        const ReactNative = require('react-native');
        const AssetRegistry = require('react-native/Libraries/Image/AssetRegistry');
        const assetId = AssetRegistry.registerAsset({
          __packager_asset: true,
          httpServerLocation: '/assets/src',
          name: 'test',
          type: 'jpg',
          scales: [1],
          hash: '074e25',
          width: 550,
          height: 366
        });
        module.exports.default = function InlineAssetUriMfe() {
          return ReactNative.Image.resolveAssetSource(assetId).uri;
        };
      `,
    });
    const assetRegistry = {
      registerAsset: () => 9,
      getAssetByID: () => undefined,
    };

    const module = await loadBundleArchiveModule<MicroFrontendModule>(
      manifest,
      {
        readArchive: () => archive,
        externalModules: {
          'react-native': {
            Image: { resolveAssetSource: () => ({ uri: 'host://fallback' }) },
          },
          'react-native/Libraries/Image/AssetRegistry': assetRegistry,
        },
      },
    );

    expect(module.default()).toBe('data:image/jpeg;base64,anBn');
  });

  test('uses a registered blob-util file-system adapter before inline data URI fallback', async () => {
    const archive = createFixtureArchive({
      name: manifest.name,
      assets: [
        {
          sourcePath: 'src/test.jpg',
          name: 'test',
          type: 'jpg',
          httpServerLocation: '/assets/src',
          scales: [1],
          files: [
            {
              scale: 1,
              archivePath: 'assets/assets/src/test.jpg',
              originalPath: 'src/test.jpg',
            },
          ],
        },
      ],
      assetFiles: [{ path: 'assets/assets/src/test.jpg', contents: 'jpg' }],
      bundleCode: `
        const ReactNative = require('react-native');
        const AssetRegistry = require('react-native/Libraries/Image/AssetRegistry');
        const assetId = AssetRegistry.registerAsset({
          httpServerLocation: '/assets/src',
          name: 'test',
          type: 'jpg',
          scales: [1]
        });
        module.exports.default = function RegisteredFsAssetUriMfe() {
          return ReactNative.Image.resolveAssetSource(assetId).uri;
        };
      `,
    });
    const files = new Map<string, string>();
    const directories = new Set<string>();
    registerBundleArchiveAssetFileSystem(
      createReactNativeBlobUtilAssetFileSystem({
        fs: {
          dirs: { CacheDir: '/cache' },
          exists: (path: string) => files.has(path) || directories.has(path),
          mkdir: (path: string) => directories.add(path),
          writeFile: (path: string, contents: string) =>
            files.set(path, contents),
          unlink: (path: string) => {
            files.delete(path);
            directories.delete(path);
          },
        },
      }),
    );

    const module = await loadBundleArchiveModule<MicroFrontendModule>(
      manifest,
      {
        readArchive: () => archive,
        externalModules: {
          'react-native': {
            Image: { resolveAssetSource: () => ({ uri: 'host://fallback' }) },
          },
          'react-native/Libraries/Image/AssetRegistry': {
            registerAsset: () => 11,
          },
        },
      },
    );

    const uri = module.default();
    expect(uri).toStartWith('file:///cache/rnm-assets/mfe-feature/1.0.0/ios/');
    expect(uri).toEndWith('/assets/assets/src/test.jpg');
    expect([...files.keys()].some((path) => path.endsWith('test.jpg'))).toBe(
      true,
    );
  });

  test('preserves callable React Native Image exports while patching asset registration', async () => {
    const archive = createFixtureArchive({
      name: manifest.name,
      assets: [
        {
          sourcePath: 'src/test.jpg',
          name: 'test',
          type: 'jpg',
          httpServerLocation: '/assets/src',
          scales: [1],
          files: [
            {
              scale: 1,
              archivePath: 'assets/assets/src/test.jpg',
              originalPath: 'src/test.jpg',
            },
          ],
        },
      ],
      assetFiles: [{ path: 'assets/assets/src/test.jpg', contents: 'jpg' }],
      bundleCode: `
        const ReactNative = require('react-native');
        const AssetRegistry = require('react-native/Libraries/Image/AssetRegistry');
        const assetId = AssetRegistry.registerAsset({
          httpServerLocation: '/assets/src',
          name: 'test',
          type: 'jpg',
          scales: [1]
        });
        module.exports.default = function CallableImageMfe() {
          return ReactNative.Image({ source: assetId });
        };
      `,
    });
    const hostImage = Object.assign(
      (props: unknown) => ({ type: 'Image', props }),
      { resolveAssetSource: () => ({ uri: 'host://fallback' }) },
    );

    const module = await loadBundleArchiveModule<MicroFrontendModule>(
      manifest,
      {
        readArchive: () => archive,
        externalModules: {
          'react-native': { Image: hostImage },
          'react-native/Libraries/Image/AssetRegistry': {
            registerAsset: () => 3,
          },
        },
      },
    );

    expect(module.default()).toEqual({
      type: 'Image',
      props: { source: 3 },
    });
  });

  test('rejects archives for the wrong MFE name', async () => {
    const archive = createFixtureArchive({
      name: 'other-feature',
      bundleCode: `module.exports.default = function Other() { return null; };`,
    });

    await expect(
      loadBundleArchiveModule(manifest, { readArchive: () => archive }),
    ).rejects.toThrow(
      'Bundle archive name mismatch: expected mfe-feature, got other-feature.',
    );
  });
});

function createFixtureArchive(input: {
  readonly name: string;
  readonly bundleCode: string;
  readonly entryModuleId?: string | number;
  readonly moduleGlobalName?: string;
  readonly externalModules?: readonly string[];
  readonly sharedModules?: readonly {
    readonly name: string;
    readonly moduleId?: string | number;
  }[];
  readonly metroModuleId?: Readonly<Record<string, string | number>>;
  readonly assets?: readonly Record<string, unknown>[];
  readonly assetFiles?: readonly {
    readonly path: string;
    readonly contents: string;
  }[];
}): Uint8Array {
  const manifest = JSON.stringify(
    {
      schemaVersion: 1,
      artifactType: 'react-native-micro-frontend-bundle',
      name: input.name,
      version: '1.0.0',
      platform: 'ios',
      dev: false,
      entryFile: './src/index.tsx',
      bundleFile: 'index.bundle',
      assetsDir: 'assets',
      createdAt: '2026-05-27T00:00:00.000Z',
      ...(input.entryModuleId !== undefined
        ? { entryModuleId: input.entryModuleId }
        : {}),
      ...(input.moduleGlobalName !== undefined
        ? { moduleGlobalName: input.moduleGlobalName }
        : {}),
      ...(input.externalModules !== undefined
        ? { externalModules: input.externalModules }
        : {}),
      ...(input.sharedModules !== undefined
        ? { sharedModules: input.sharedModules }
        : {}),
      ...(input.metroModuleId !== undefined
        ? { metroModuleId: input.metroModuleId }
        : {}),
      ...(input.assets !== undefined ? { assets: input.assets } : {}),
    },
    null,
    2,
  );

  return Bun.gzipSync(
    createTar([
      { path: 'index.bundle', contents: input.bundleCode },
      { path: 'manifest.json', contents: manifest },
      { path: 'assets/.keep', contents: '' },
      ...(input.assetFiles ?? []),
    ]),
  );
}

function createTar(
  entries: readonly { readonly path: string; readonly contents: string }[],
): Uint8Array {
  const chunks: Uint8Array[] = [];

  for (const entry of entries) {
    const body = new TextEncoder().encode(entry.contents);
    chunks.push(createTarHeader(entry.path, body.length));
    chunks.push(body);
    chunks.push(new Uint8Array(padLength(body.length)));
  }

  chunks.push(new Uint8Array(1024));
  return concat(chunks);
}

function createTarHeader(path: string, size: number): Uint8Array {
  const header = new Uint8Array(512);
  writeAscii(header, 0, 100, path);
  writeAscii(header, 100, 8, '0000644\0');
  writeAscii(header, 108, 8, '0000000\0');
  writeAscii(header, 116, 8, '0000000\0');
  writeAscii(header, 124, 12, `${size.toString(8).padStart(11, '0')}\0`);
  writeAscii(header, 136, 12, '00000000000\0');
  writeAscii(header, 148, 8, '        ');
  header[156] = '0'.charCodeAt(0);
  writeAscii(header, 257, 6, 'ustar\0');
  writeAscii(header, 263, 2, '00');

  const checksum = header.reduce((sum, byte) => sum + byte, 0);
  writeAscii(header, 148, 8, `${checksum.toString(8).padStart(6, '0')}\0 `);

  return header;
}

function writeAscii(
  bytes: Uint8Array,
  offset: number,
  length: number,
  value: string,
): void {
  const encoded = new TextEncoder().encode(value);
  bytes.set(encoded.subarray(0, length), offset);
}

function padLength(length: number): number {
  return (512 - (length % 512)) % 512;
}

function concat(chunks: readonly Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;

  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }

  return out;
}
