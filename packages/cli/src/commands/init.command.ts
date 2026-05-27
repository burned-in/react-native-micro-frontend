import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  analyzeHostProject,
  createDefaultHostConfigTemplate,
  createGeneratedIntegrationFiles,
  generateIntegrationPlan,
} from '@bunin/react-native-micro-frontend-integration';
import type { CliPrinter } from '../cli-output.printer.js';
import { ensureBundleArchiveRegistration } from './bundle-archive-registration.js';

/**
 * Handles `rnm init` by generating safe minimal config and generated include files.
 *
 * Side effects: writes generated files unless `--dry-run` is provided.
 * Native project files are not patched by this command.
 *
 * @param root Current project root.
 * @param flags CLI flags.
 * @param printer Output sink.
 * @returns Exit code.
 */
export function runInitCommand(
  root: string,
  flags: Readonly<Record<string, string | boolean>>,
  printer: CliPrinter,
): number {
  const analysis = analyzeHostProject(root);
  const mode = flags['dry-run']
    ? 'dry-run'
    : flags.full
      ? 'full'
      : flags['config-only']
        ? 'config-only'
        : 'safe-minimal';
  const plan = generateIntegrationPlan(analysis, mode);
  printer.log('React Native project detected.');
  for (const line of plan.summary) printer.log(line);
  for (const warning of plan.warnings) printer.log(`[WARN] ${warning}`);
  if (mode === 'dry-run') {
    for (const change of plan.changes)
      printer.log(`[DRY-RUN] ${change.path}: ${change.reason}`);
    return 0;
  }
  writeGenerated(
    root,
    'react-native-micro-frontend.config.ts',
    createDefaultHostConfigTemplate(),
  );
  if (mode !== 'config-only')
    for (const file of createGeneratedIntegrationFiles())
      writeGenerated(root, file.path, file.contents);
  if (mode !== 'config-only') {
    ensureBundleArchiveRegistration(root, flags, printer, {
      patchImportByDefault: true,
    });
  }
  printer.log(
    '[OK] @bunin/react-native-micro-frontend initialized with generated include files.',
  );
  return 0;
}

function writeGenerated(root: string, path: string, contents: string): void {
  const target = join(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, contents);
}
