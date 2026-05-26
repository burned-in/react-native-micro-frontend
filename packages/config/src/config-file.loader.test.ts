import { afterEach, expect, test } from 'bun:test';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  loadMfeConfigFile,
  loadReactNativeMicroFrontendConfig,
} from './config-file.loader.js';

const tempRoots: string[] = [];

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { force: true, recursive: true });
  }
});

test('loads host config from cjs and mjs module files', () => {
  expect(loadHostProvider('react-native-micro-frontend.config.cjs')).toBe(
    'custom',
  );
  expect(loadHostProvider('react-native-micro-frontend.config.mjs')).toBe(
    'custom',
  );
});

test('loads mfe config from cjs and mjs module files', () => {
  expect(loadMfeEntry('mfe.config.cjs')).toBe('./src/cjs.tsx');
  expect(loadMfeEntry('mfe.config.mjs')).toBe('./src/mjs.tsx');
});

function loadHostProvider(filename: string): string | undefined {
  const root = createTempRoot();
  writeFileSync(
    join(root, filename),
    moduleSource(filename, './src/index.tsx'),
  );

  const result = loadReactNativeMicroFrontendConfig(root, filename);

  expect(result.ok).toBe(true);
  return result.ok ? result.value.ota.provider : undefined;
}

function loadMfeEntry(filename: string): string | undefined {
  const root = createTempRoot();
  const entry = `./src/${filename.split('.').at(-1)}.tsx`;
  writeFileSync(join(root, filename), moduleSource(filename, entry));

  const result = loadMfeConfigFile(root, filename);

  expect(result.ok).toBe(true);
  return result.ok ? result.value?.entry : undefined;
}

function moduleSource(filename: string, entry: string): string {
  const config = JSON.stringify({
    name: 'config-feature',
    version: '1.0.0',
    entry,
    ota: { enabled: true, mode: 'manual', provider: 'custom' },
    nativeChangePolicy: 'ask',
    mfes: {},
  });

  return filename.endsWith('.cjs')
    ? `module.exports = ${config};\n`
    : `export default ${config};\n`;
}

function createTempRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'rnm-config-loader-'));
  tempRoots.push(root);
  writeFileSync(join(root, 'package.json'), '{}\n');

  return root;
}
