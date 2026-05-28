import { afterEach, expect, test } from 'bun:test';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runAddCommand } from './add.command.js';
import { runInitCommand } from './init.command.js';

const tempRoots: string[] = [];

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { force: true, recursive: true });
  }
});

test('rnm init generates and imports bundle archive asset registration', () => {
  const root = createHostFixture();

  const result = runInitCommand(root, {}, printer());

  expect(result).toBe(0);
  expect(existsSync(join(root, 'rnm.bundle-archives.ts'))).toBe(true);
  expect(readFileSync(join(root, 'index.ts'), 'utf8')).toStartWith(
    "import './rnm.bundle-archives';\n",
  );
  expect(
    readFileSync(join(root, 'rnm.bundle-archives.ts'), 'utf8'),
  ).not.toContain("require('react-native-blob-util')");
  expect(
    readFileSync(join(root, 'rnm.bundle-archives.ts'), 'utf8'),
  ).not.toContain("import ReactNativeBlobUtil from 'react-native-blob-util'");
  expect(
    readFileSync(join(root, 'rnm.bundle-archives.ts'), 'utf8'),
  ).not.toContain('declare const require');
  expect(
    readFileSync(join(root, 'rnm.bundle-archives.ts'), 'utf8'),
  ).not.toContain('ReactNative.NativeModules');
  expect(
    readFileSync(join(root, 'rnm.bundle-archives.ts'), 'utf8'),
  ).not.toContain('registerBundleArchiveAssetFileSystem');
  expect(readFileSync(join(root, 'rnm.bundle-archives.ts'), 'utf8')).toContain(
    'react-native/Libraries/Image/AssetRegistry',
  );
});

test('rnm add refreshes and imports bundle archive asset registration', () => {
  const root = createHostFixture();

  const result = runAddCommand(
    root,
    'payments',
    { path: '../payments' },
    printer(),
  );

  expect(result).toBe(0);
  expect(
    JSON.parse(readFileSync(join(root, 'rnm.registry.json'), 'utf8')),
  ).toMatchObject({
    mfes: {
      payments: {
        name: 'payments',
        path: '../payments',
      },
    },
  });
  expect(readFileSync(join(root, 'index.ts'), 'utf8')).toStartWith(
    "import './rnm.bundle-archives';\n",
  );
  expect(
    readFileSync(join(root, 'rnm.bundle-archives.ts'), 'utf8'),
  ).not.toContain('createReactNativeBlobUtilAssetFileSystem');
});

test('rnm add can skip host entry import while still generating registration', () => {
  const root = createHostFixture();

  const result = runAddCommand(
    root,
    'payments',
    { path: '../payments', 'no-register-archives': true },
    printer(),
  );

  expect(result).toBe(0);
  expect(existsSync(join(root, 'rnm.bundle-archives.ts'))).toBe(true);
  expect(readFileSync(join(root, 'index.ts'), 'utf8')).not.toContain(
    'rnm.bundle-archives',
  );
});

function createHostFixture(): string {
  const root = mkdtempSync(join(tmpdir(), 'rnm-host-init-add-'));
  tempRoots.push(root);
  writeFileSync(
    join(root, 'package.json'),
    '{"dependencies":{"react-native-blob-util":"^0.24.6"}}\n',
  );
  writeFileSync(
    join(root, 'index.ts'),
    "import { AppRegistry } from 'react-native';\n",
  );
  return root;
}

function printer(): {
  readonly log: (message: string) => void;
  readonly error: (message: string) => void;
} {
  return { log: () => {}, error: () => {} };
}
