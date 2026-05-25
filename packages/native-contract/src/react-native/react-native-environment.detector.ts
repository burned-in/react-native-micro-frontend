import type { NativeRuntimeFlag } from '@bunin/react-native-micro-frontend';

/**
 * Detects the React Native version from package.json dependencies.
 *
 * @param packageJson Parsed package.json.
 * @returns Version range or null when unavailable.
 */
export function detectReactNativeVersion(packageJson: {
  readonly dependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
}): string | null {
  return (
    packageJson.dependencies?.['react-native'] ??
    packageJson.devDependencies?.['react-native'] ??
    null
  );
}

/**
 * Detects Hermes enablement from common React Native config files.
 *
 * @param files File contents keyed by project-relative path.
 * @returns Hermes flag state.
 */
export function detectHermesFlag(
  files: Readonly<Record<string, string>>,
): NativeRuntimeFlag {
  const combined = Object.entries(files)
    .filter(([path]) =>
      /gradle|Podfile|app\.json|react-native\.config/.test(path),
    )
    .map(([, text]) => text)
    .join('\n');
  if (
    /hermesEnabled\s*[:=]\s*true|enableHermes\s*[:=]\s*true|:hermes_enabled\s*=>\s*true/.test(
      combined,
    )
  )
    return 'enabled';
  if (
    /hermesEnabled\s*[:=]\s*false|enableHermes\s*[:=]\s*false|:hermes_enabled\s*=>\s*false/.test(
      combined,
    )
  )
    return 'disabled';
  return 'unknown';
}

/**
 * Detects React Native New Architecture enablement from common project files.
 *
 * @param files File contents keyed by project-relative path.
 * @returns New Architecture flag state.
 */
export function detectNewArchitectureFlag(
  files: Readonly<Record<string, string>>,
): NativeRuntimeFlag {
  const combined = Object.entries(files)
    .filter(([path]) =>
      /gradle|Podfile|gradle\.properties|app\.json/.test(path),
    )
    .map(([, text]) => text)
    .join('\n');
  if (
    /newArchEnabled\s*[:=]\s*true|RCT_NEW_ARCH_ENABLED\s*=\s*1|newArchEnabled=true/.test(
      combined,
    )
  )
    return 'enabled';
  if (
    /newArchEnabled\s*[:=]\s*false|RCT_NEW_ARCH_ENABLED\s*=\s*0|newArchEnabled=false/.test(
      combined,
    )
  )
    return 'disabled';
  return 'unknown';
}
