import { describe, expect, test } from 'bun:test';
import type { MfeManifest, MfeRegistry } from './domain/mfe-manifest.type.js';
import {
  createMicroFrontendLoader,
  createMicroFrontendRuntime,
  loadMicroFrontendModule,
} from './runtime.js';

describe('createMicroFrontendRuntime', () => {
  const registry: MfeRegistry = {
    schemaVersion: 1,
    hostNativeHash: 'host-hash',
    mfes: {},
  };

  test('exposes host-owned shared state to MFE runtime consumers', () => {
    const sharedState = {
      session: {
        userId: 'user_123',
      },
      locale: 'en-US',
      featureFlags: {
        checkoutV2: true,
      },
    };

    const runtime = createMicroFrontendRuntime(registry, sharedState);

    expect(runtime.sharedState).toEqual(sharedState);
  });

  test('marks the runtime as a host shell by default', () => {
    const runtime = createMicroFrontendRuntime(registry);

    expect(runtime.isMfe).toBe(false);
  });

  test('marks the runtime as an MFE when requested', () => {
    const runtime = createMicroFrontendRuntime(registry, {}, { isMfe: true });

    expect(runtime.isMfe).toBe(true);
  });
});

describe('loadMicroFrontendModule', () => {
  const activeManifest: MfeManifest = {
    name: 'mfe-feature',
    version: '1.0.0',
    entry: './src/index.tsx',
    path: '../mfe-feature',
    ota: {
      enabled: true,
      mode: 'manual',
      provider: 'hot-updater',
    },
    nativeChangePolicy: 'ask',
    status: 'active',
  };

  test('uses the Hot Updater loader for hot-updater manifests', async () => {
    const module = { default: 'hot-updater-module' };

    await expect(
      loadMicroFrontendModule(activeManifest, {
        hotUpdater: (manifest) => ({
          ...module,
          name: manifest.name,
        }),
      }),
    ).resolves.toEqual({
      default: 'hot-updater-module',
      name: 'mfe-feature',
    });
  });

  test('uses the embedded loader when an embedded bundle path exists', async () => {
    const manifest: MfeManifest = {
      ...activeManifest,
      ota: {
        enabled: false,
        mode: 'disabled',
        provider: 'none',
      },
      embeddedBundlePath: 'dist/mfe-feature.ios.bundle',
    };

    await expect(
      loadMicroFrontendModule(manifest, {
        embedded: (mfe) => ({
          default: mfe.embeddedBundlePath,
        }),
      }),
    ).resolves.toEqual({
      default: 'dist/mfe-feature.ios.bundle',
    });
  });

  test('uses the custom loader for custom OTA metadata', async () => {
    const manifest: MfeManifest = {
      ...activeManifest,
      ota: {
        enabled: true,
        mode: 'manual',
        provider: 'custom',
      },
      otaBundleUrl: 'https://cdn.example.com/mfe-feature.bundle',
    };

    await expect(
      loadMicroFrontendModule(manifest, {
        custom: (mfe) => ({
          default: mfe.otaBundleUrl,
        }),
      }),
    ).resolves.toEqual({
      default: 'https://cdn.example.com/mfe-feature.bundle',
    });
  });

  test('throws when no matching Host loader is configured', async () => {
    await expect(loadMicroFrontendModule(activeManifest, {})).rejects.toThrow(
      'No bundle loader configured for MFE "mfe-feature" (provider: hot-updater).',
    );
  });

  test('creates a reusable loader that reads registry config by default', async () => {
    const load = createMicroFrontendLoader({
      hotUpdater: (manifest) => ({
        default: manifest.ota.provider,
      }),
    });

    await expect(load(activeManifest)).resolves.toEqual({
      default: 'hot-updater',
    });
  });

  test('allows direct per-call metadata options when config omits them', async () => {
    const load = createMicroFrontendLoader({
      custom: (manifest) => ({
        default: manifest.otaBundleUrl,
      }),
    });

    await expect(
      load(activeManifest, {
        provider: 'custom',
        otaBundleUrl: 'https://cdn.example.com/override.bundle',
      }),
    ).resolves.toEqual({
      default: 'https://cdn.example.com/override.bundle',
    });
  });
});
