import type { HostProjectAnalysis } from './host-project.analyzer.js';

/** A file that `rnm integrate` may generate or patch. */
export interface PlannedFileChange {
  readonly path: string;
  readonly action: 'create' | 'patch' | 'skip';
  readonly reason: string;
  readonly requiresConfirm: boolean;
}

/** Safe integration plan for an existing host app. */
export interface IntegrationPlan {
  readonly mode:
    | 'safe-minimal'
    | 'full'
    | 'config-only'
    | 'dry-run'
    | 'manual-guide';
  readonly summary: readonly string[];
  readonly changes: readonly PlannedFileChange[];
  readonly warnings: readonly string[];
}

/**
 * Creates a conservative integration plan from host-project analysis.
 *
 * The plan prefers generated include files over direct project-file mutation and
 * flags every direct patch as confirmation-required.
 *
 * @param analysis Host project detection result.
 * @param mode Requested integration mode.
 * @returns Planned changes and warnings.
 */
export function generateIntegrationPlan(
  analysis: HostProjectAnalysis,
  mode: IntegrationPlan['mode'],
): IntegrationPlan {
  const changes: PlannedFileChange[] = [
    {
      path: 'react-native-micro-frontend.config.ts',
      action: mode === 'dry-run' ? 'skip' : 'create',
      reason: 'host configuration',
      requiresConfirm: false,
    },
    {
      path: 'rnm.registry.json',
      action: mode === 'dry-run' ? 'skip' : 'create',
      reason: 'runtime registry',
      requiresConfirm: false,
    },
    {
      path: 'rnm.native-contract.json',
      action: mode === 'dry-run' ? 'skip' : 'create',
      reason: 'host native contract snapshot',
      requiresConfirm: false,
    },
  ];
  if (analysis.iosDetected)
    changes.push({
      path: 'ios/Podfile.rnm.generated.rb',
      action: mode === 'dry-run' ? 'skip' : 'create',
      reason: 'generated iOS include file',
      requiresConfirm: false,
    });
  if (analysis.androidDetected) {
    changes.push({
      path: 'android/rnm.generated.gradle',
      action: mode === 'dry-run' ? 'skip' : 'create',
      reason: 'generated Android app Gradle file',
      requiresConfirm: false,
    });
    changes.push({
      path: 'android/rnm.settings.generated.gradle',
      action: mode === 'dry-run' ? 'skip' : 'create',
      reason: 'generated Android settings Gradle file',
      requiresConfirm: false,
    });
    changes.push({
      path: 'android/AndroidManifest.rnm.generated.xml',
      action: mode === 'dry-run' ? 'skip' : 'create',
      reason: 'generated Android manifest fragment',
      requiresConfirm: false,
    });
  }
  const warnings = [
    ...(analysis.projectType === 'unknown'
      ? ['React Native project was not confidently detected.']
      : []),
    ...(analysis.codePushDetected
      ? [
          'CodePush was detected; avoid double OTA ownership without an explicit policy.',
        ]
      : []),
    ...(analysis.hotUpdaterDetected
      ? [
          'Existing Hot Updater config detected; choose reuse/wrap/separate/disable/manual explicitly.',
        ]
      : []),
  ];
  return {
    mode,
    summary: [
      `Project type: ${analysis.projectType}`,
      `Package manager: ${analysis.packageManager.name}`,
      `iOS: ${analysis.iosDetected ? 'detected' : 'not detected'}`,
      `Android: ${analysis.androidDetected ? 'detected' : 'not detected'}`,
    ],
    changes,
    warnings,
  };
}
