import type { MfeManifest } from '@bunin/react-native-micro-frontend';
import type { MicroFrontendModule } from '@bunin/react-native-micro-frontend/runtime';

/**
 * Bundle archive transport boundary.
 *
 * This example intentionally does not import `../../mfe-feature/src/index`.
 * A real Host should read or download manifest.bundleArchiveUrl, verify the
 * archive, unpack index.bundle + assets + manifest.json, and evaluate the JS
 * bundle through its own runtime engine.
 */
export async function loadBundleArchive<TProps extends object>(
  manifest: MfeManifest,
): Promise<MicroFrontendModule<TProps>> {
  if (!manifest.bundleArchiveUrl) {
    throw new Error(`bundleArchiveUrl is missing for ${manifest.name}.`);
  }

  throw new Error(
    `Implement archive evaluation for ${manifest.bundleArchiveUrl} in the Host runtime layer.`,
  );
}
