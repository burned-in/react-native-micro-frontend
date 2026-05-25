import { describe, expect, test } from 'bun:test';
import type { MfeRegistry } from './domain/mfe-manifest.type.js';
import { createMicroFrontendRuntime } from './runtime.js';

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
