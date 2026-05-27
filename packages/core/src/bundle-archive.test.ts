import { afterEach, describe, expect, test } from 'bun:test';
import { Buffer } from 'node:buffer';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createBundleArchiveLoader,
  loadBundleArchiveModule,
  registerBundleArchiveAsset,
} from './bundle-archive.js';
import type { MfeManifest } from './domain/mfe-manifest.type.js';
import type { MicroFrontendModule } from './runtime.js';

interface TestProps {
  readonly title?: string;
}

const tempRoots: string[] = [];

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { force: true, recursive: true });
  }
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

  test('does not ship the Hermes-invalid dynamic import Function body literally', () => {
    const source = Bun.file(new URL('./bundle-archive.ts', import.meta.url));
    return expect(source.text()).resolves.not.toContain(
      'return import(specifier)',
    );
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
    },
    null,
    2,
  );

  return Bun.gzipSync(
    createTar([
      { path: 'index.bundle', contents: input.bundleCode },
      { path: 'manifest.json', contents: manifest },
      { path: 'assets/.keep', contents: '' },
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
