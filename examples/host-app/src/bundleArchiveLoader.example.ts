import type { MfeManifest } from '@bunin/react-native-micro-frontend';
import type { MicroFrontendModule } from '@bunin/react-native-micro-frontend/runtime';

/**
 * Example shape for a custom compressed bundle archive loader.
 *
 * Real apps should download manifest.bundleArchiveUrl, verify integrity, unpack
 * the .tar.gz into app-controlled storage, then evaluate the bundle with their
 * OTA/runtime engine. The runtime package only selects this callback after the
 * registry safety gate passes; it intentionally does not execute remote code.
 */
export async function loadBundleArchive<TProps extends object>(
  manifest: MfeManifest,
): Promise<MicroFrontendModule<TProps>> {
  if (!manifest.bundleArchiveUrl) {
    throw new Error(`bundleArchiveUrl is missing for ${manifest.name}.`);
  }

  throw new Error(
    `Download, verify, unpack, and evaluate ${manifest.bundleArchiveUrl} in your host OTA layer.`,
  );
}
