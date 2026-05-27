import { describe, expect, test } from 'bun:test';
import {
  createBundleArchiveLoader,
  loadBundleArchiveModule,
} from './bundle-archive.js';
import type { MfeManifest } from './domain/mfe-manifest.type.js';
import type { MicroFrontendModule } from './runtime.js';

interface TestProps {
  readonly title?: string;
}

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
