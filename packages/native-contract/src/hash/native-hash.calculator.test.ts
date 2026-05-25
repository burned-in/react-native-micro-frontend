import { describe, expect, test } from 'bun:test';
import type { NativeContract } from '@bunin/react-native-micro-frontend';
import { calculateNativeHash } from './native-hash.calculator.js';

const contract: NativeContract = {
  reactNativeVersion: '0.76.0',
  hermes: 'enabled',
  newArchitecture: 'enabled',
  packageDependencies: [
    {
      name: 'react-native-mmkv',
      version: '^3.0.0',
      native: true,
      reason: 'test',
    },
  ],
  ios: {
    pods: [{ name: 'RNMMKV', version: '3.0.0', required: true }],
    infoPlistKeys: {},
  },
  android: {
    gradleProjects: [{ name: 'react-native-mmkv', required: true }],
    gradleDependencies: [],
    permissions: ['android.permission.CAMERA'],
  },
};

describe('calculateNativeHash', () => {
  test('is stable and includes runtime flags', () => {
    const hash = calculateNativeHash(contract);
    expect(hash).toStartWith('sha256:');
    expect(
      calculateNativeHash({
        ...contract,
        generatedAt: 'later',
        nativeHash: 'ignored',
      }),
    ).toBe(hash);
    expect(calculateNativeHash({ ...contract, hermes: 'disabled' })).not.toBe(
      hash,
    );
  });
});
