import type { MfeConfig } from '../domain/config.type.js';
import type { MfeManifest, MfeRegistry } from '../domain/mfe-manifest.type.js';

/**
 * Creates an empty registry object for a host app.
 *
 * @param hostNativeHash Optional initial host nativeHash.
 * @returns Registry with schemaVersion 1 and no MFEs.
 */
export function createEmptyRegistry(hostNativeHash?: string): MfeRegistry {
  return hostNativeHash
    ? { schemaVersion: 1, hostNativeHash, mfes: {} }
    : { schemaVersion: 1, mfes: {} };
}

/**
 * Converts an MFE config into a registry manifest.
 *
 * The function is pure and does not check whether bundle files exist.
 *
 * @param config MFE config.
 * @param hostPath Optional path from the host root to the MFE root.
 * @returns Registry-ready MFE manifest.
 */
export function createMfeManifest(
  config: MfeConfig,
  hostPath?: string,
): MfeManifest {
  return {
    name: config.name,
    version: config.version,
    entry: config.entry,
    path: config.path ?? hostPath ?? '.',
    ota: {
      enabled: config.ota.enabled,
      mode: config.ota.mode,
      provider: config.ota.provider ?? 'hot-updater',
    },
    nativeChangePolicy: config.nativeChangePolicy,
    status: 'active',
  };
}
