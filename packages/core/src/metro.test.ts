import { describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createMicroFrontendExtraNodeModules,
  withReactNativeMicroFrontendMetroConfig,
} from './metro.js';

const createPackageJson = (
  root: string,
  dependencies: Readonly<Record<string, string>>,
) => {
  writeFileSync(
    join(root, 'package.json'),
    `${JSON.stringify({ dependencies }, null, 2)}\n`,
  );
};

const createNodeModule = (root: string, packageName: string) => {
  mkdirSync(join(root, 'node_modules', ...packageName.split('/')), {
    recursive: true,
  });
};

describe('withReactNativeMicroFrontendMetroConfig', () => {
  test('watches registered MFE roots and maps shared packages to host node_modules', () => {
    const workspace = mkdtempSync(join(tmpdir(), 'rnm-metro-'));
    const hostRoot = join(workspace, 'host-app');
    const mfeRoot = join(workspace, 'mfe-feature');

    mkdirSync(hostRoot, { recursive: true });
    mkdirSync(mfeRoot, { recursive: true });
    createPackageJson(hostRoot, {
      '@bunin/react-native-micro-frontend': '0.2.0',
      react: '19.0.0',
      'react-native': '0.81.0',
      'react-native-safe-area-context': '5.0.0',
    });
    createPackageJson(mfeRoot, {
      react: '19.0.0',
      'react-native': '0.81.0',
      'react-native-safe-area-context': '5.0.0',
    });

    for (const packageName of [
      '@bunin/react-native-micro-frontend',
      'react',
      'react-native',
      'react-native-safe-area-context',
    ]) {
      createNodeModule(hostRoot, packageName);
    }

    writeFileSync(
      join(hostRoot, 'rnm.registry.json'),
      JSON.stringify({
        schemaVersion: 1,
        mfes: {
          'mfe-feature': {
            name: 'mfe-feature',
            version: '1.0.0',
            entry: './src/index.tsx',
            path: '../mfe-feature',
            ota: { enabled: false, mode: 'disabled', provider: 'none' },
            nativeChangePolicy: 'ask',
            status: 'active',
          },
        },
      }),
    );

    const config = withReactNativeMicroFrontendMetroConfig(hostRoot, {
      resolver: {
        extraNodeModules: {
          react: '/custom/react',
        },
      },
    });

    expect(config.watchFolders).toContain(mfeRoot);
    expect(config.resolver?.nodeModulesPaths).toContain(
      join(hostRoot, 'node_modules'),
    );
    expect(config.resolver?.unstable_enablePackageExports).toBe(true);
    expect(config.resolver?.assetExts).toEqual(['gz', 'tgz', 'tar']);
    expect(config.resolver?.extraNodeModules?.react).toBe('/custom/react');
    expect(config.resolver?.extraNodeModules?.['react-native']).toBe(
      join(hostRoot, 'node_modules', 'react-native'),
    );
    expect(
      config.resolver?.extraNodeModules?.['react-native-safe-area-context'],
    ).toBe(join(hostRoot, 'node_modules', 'react-native-safe-area-context'));
  });

  test('allows direct extraNodeModules generation with exclusions', () => {
    const workspace = mkdtempSync(join(tmpdir(), 'rnm-metro-'));
    const hostRoot = join(workspace, 'host-app');

    mkdirSync(hostRoot, { recursive: true });
    createPackageJson(hostRoot, {
      react: '19.0.0',
      'react-native': '0.81.0',
    });
    createNodeModule(hostRoot, 'react');
    createNodeModule(hostRoot, 'react-native');

    const extraNodeModules = createMicroFrontendExtraNodeModules(
      hostRoot,
      {
        schemaVersion: 1,
        mfes: {},
      },
      { excludeSharedPackages: ['react-native'] },
    );

    expect(extraNodeModules.react).toBe(
      join(hostRoot, 'node_modules', 'react'),
    );
    expect(extraNodeModules['react-native']).toBeUndefined();
  });
});
