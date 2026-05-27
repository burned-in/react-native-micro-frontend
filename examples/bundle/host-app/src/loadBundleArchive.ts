import type { MfeManifest } from '@bunin/react-native-micro-frontend';
import { createBundleArchiveLoader } from '@bunin/react-native-micro-frontend/bundle-archive';
import type { MicroFrontendModule } from '@bunin/react-native-micro-frontend/runtime';

/**
 * Custom compressed bundle archive loader.
 *
 * The runtime selects this callback from `bundleArchiveUrl`; this loader then
 * reads/downloads the archive, gunzips it, extracts `index.bundle` +
 * `manifest.json`, and evaluates the JS bundle into a React component module.
 *
 * React Native production apps can pass app-specific `readArchive`, `gunzip`, or
 * `evaluate` bridges to `createBundleArchiveLoader()` when native storage or an
 * OTA engine owns those steps.
 */
const defaultBundleArchiveLoader =
  createBundleArchiveLoader<MicroFrontendModule<Record<string, unknown>>>();

export async function loadBundleArchive<TProps extends object>(
  manifest: MfeManifest,
): Promise<MicroFrontendModule<TProps>> {
  return (await defaultBundleArchiveLoader(
    manifest,
  )) as MicroFrontendModule<TProps>;
}
