import {
  generateMfeBundleArchiveCommands,
  generateMfeBundleCommand,
} from '@bunin/react-native-micro-frontend-metro-adapter';
import type { CliPrinter } from '../cli-output.printer.js';

/**
 * Handles `rnm build <mfe>` by generating Metro bundle commands.
 *
 * This command prints the command by default. Execution is intentionally left to
 * the host package manager runner so dry-run and CI policies remain explicit.
 *
 * @param name MFE name.
 * @param flags CLI flags.
 * @param printer Output sink.
 * @returns Exit code.
 */
export function runBuildCommand(
  name: string | undefined,
  flags: Readonly<Record<string, string | boolean>>,
  printer: CliPrinter,
): number {
  if (!name) {
    printer.error('Usage: rnm build <mfe-name> [--platform ios|android]');
    return 1;
  }

  const platform: 'ios' | 'android' =
    flags.platform === 'android' ? 'android' : 'ios';
  const buildType = typeof flags.type === 'string' ? flags.type : 'ota';
  const entryFile =
    typeof flags.entry === 'string' ? flags.entry : './src/index.tsx';
  const dev = flags.dev === true;

  const bundleOutput = `dist/${name}.${platform}.${buildType}.bundle`;
  const assetsDest = `dist/${name}.${platform}.assets`;

  const bundleInput = {
    entryFile,
    platform,
    dev,
    bundleOutput,
    assetsDest,
  };

  printer.log(`[OK] Metro bundle command for ${name}`);

  if (flags.archive === true) {
    const archiveOutput = `dist/${name}.${platform}.${buildType}.tar.gz`;
    const commands = generateMfeBundleArchiveCommands({
      ...bundleInput,
      archiveOutput,
    });

    for (const command of commands) {
      printer.log(command.join(' '));
    }

    printer.log(`[OK] Bundle archive output: ${archiveOutput}`);
    return 0;
  }

  printer.log(generateMfeBundleCommand(bundleInput).join(' '));

  return 0;
}
