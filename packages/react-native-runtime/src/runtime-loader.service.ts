import type { MfeRegistry } from '@bunin/react-native-micro-frontend';
import type { RuntimeMfeState, RuntimeRegistrySource } from './runtime.type.js';

/**
 * Resolves a runtime registry from an object or lazy loader.
 *
 * @param source Registry object or async loader.
 * @returns Resolved registry.
 */
export async function resolveRuntimeRegistry(
  source: RuntimeRegistrySource,
): Promise<MfeRegistry> {
  return typeof source === 'function' ? await source() : source;
}

/**
 * Computes runtime state for one MFE from a registry.
 *
 * Runtime loading is blocked when the registry marks an MFE blocked or when its
 * nativeHash does not match the host nativeHash.
 *
 * @param registry Runtime registry.
 * @param name MFE name.
 * @returns Runtime state for the requested MFE.
 */
export function getRuntimeMfeState(
  registry: MfeRegistry,
  name: string,
): RuntimeMfeState {
  const manifest = registry.mfes[name];
  if (!manifest)
    return { name, status: 'missing', reason: 'MFE is not registered.' };
  if (manifest.status === 'blocked')
    return {
      name,
      status: 'blocked',
      manifest,
      reason: manifest.blockedReason ?? 'MFE is blocked.',
    };
  if (
    registry.hostNativeHash &&
    manifest.nativeHash &&
    registry.hostNativeHash !== manifest.nativeHash
  )
    return {
      name,
      status: 'blocked',
      manifest,
      reason: 'nativeHash mismatch.',
    };
  return { name, status: 'ready', manifest };
}
