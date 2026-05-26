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
    `#!/usr/bin/env node\nconst fs = require('node:fs');\nconst path = require('node:path');\nconst args = process.argv.slice(2);\nconst value = (flag) => args[args.indexOf(flag) + 1];\nconst bundleOutput = value('--bundle-output');\nconst assetsDest = value('--assets-dest');\nfs.mkdirSync(path.dirname(bundleOutput), { recursive: true });\nfs.writeFileSync(bundleOutput, 'bundle');\nfs.mkdirSync(assetsDest, { recursive: true });\n`,
  );
  chmodSync(reactNativeBin, 0o755);

  return root;
}

function readManifest(
  root: string,
  name: string,
  platform: 'ios' | 'android',
): Record<string, unknown> {
  return JSON.parse(
    readFileSync(
      join(root, 'dist', 'rnm-bundles', name, platform, 'manifest.json'),
      'utf8',
    ),
  ) as Record<string, unknown>;
}

function printer(): {
  readonly log: (message: string) => void;
  readonly error: (message: string) => void;
} {
  return { log: () => {}, error: () => {} };
}
