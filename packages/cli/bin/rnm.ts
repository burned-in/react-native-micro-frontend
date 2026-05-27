#!/usr/bin/env bun
import { relative, resolve } from 'node:path';
import { parseCliArgs } from '../src/cli-args.parser.js';
import { createConsolePrinter } from '../src/cli-output.printer.js';
import { runAddCommand } from '../src/commands/add.command.js';
import { runBuildCommand } from '../src/commands/build.command.js';
import { runBundleCommand } from '../src/commands/bundle.command.js';
import { runBundleAssetCommand } from '../src/commands/bundle-asset.command.js';
import { runDiffCommand } from '../src/commands/diff.command.js';
import { runDoctorCommand } from '../src/commands/doctor.command.js';
import { runHelpCommand } from '../src/commands/help.command.js';
import { runInitCommand } from '../src/commands/init.command.js';
import { runIntegrateCommand } from '../src/commands/integrate.command.js';
import {
  type NativeIntegrationTarget,
  runNativeIntegrationCommand,
} from '../src/commands/native-integrate.command.js';
import { runPublishCommand } from '../src/commands/publish.command.js';
import { runRollbackCommand } from '../src/commands/rollback.command.js';
import { runStatusCommand } from '../src/commands/status.command.js';
import { runSyncCommand } from '../src/commands/sync.command.js';
import { runVerifyCommand } from '../src/commands/verify.command.js';

const args = parseCliArgs(process.argv.slice(2));
const printer = createConsolePrinter();
const root = process.cwd();

const exitCode = await (async () => {
  if (args.flags.help === true || args.command === 'help') {
    return runHelpCommand(
      args.command === 'help' ? args.positional[0] : args.command,
      printer,
    );
  }

  switch (args.command) {
    case 'init':
      return runInitCommand(root, args.flags, printer);
    case 'doctor':
      return runDoctorCommand(root, printer);
    case 'status':
      return runStatusCommand(root, printer);
    case 'verify':
      return runWithIntegrationWatcher(args.positional[0], () =>
        runVerifyCommand(root, args.positional[0], printer),
      );
    case 'add':
      return runAddWithIntegration();
    case 'diff':
      return runDiffCommand(root, args.positional[0], printer);
    case 'sync':
      return runSyncCommand(root, args.positional[0], args.flags, printer);
    case 'build':
      return runBuildCommand(args.positional[0], args.flags, printer);
    case 'bundle':
      return runBundleWithIntegration();
    case 'bundle-asset':
      return runBundleAssetCommand(
        root,
        args.positional[0],
        args.flags,
        printer,
      );
    case 'publish':
      return runWithIntegrationWatcher(args.positional[0], () =>
        runPublishCommand(root, args.positional[0], args.flags, printer),
      );
    case 'expo':
      return runWithIntegrationWatcher(args.positional[0], () =>
        runPublishCommand(
          root,
          args.positional[0],
          { ...args.flags, provider: 'expo' },
          printer,
        ),
      );
    case 'integrate': {
      const target = parseNativeTarget(args.positional[0]);
      if (!target) {
        return runIntegrateCommand(root, args.flags, printer);
      }
      return runNativeIntegrationCommand(
        root,
        target,
        args.positional[1],
        args.flags,
        printer,
      );
    }
    case 'ios':
      return runNativeIntegrationCommand(
        root,
        'ios',
        args.positional[0],
        args.flags,
        printer,
      );
    case 'aos':
    case 'android':
      return runNativeIntegrationCommand(
        root,
        'aos',
        args.positional[0],
        args.flags,
        printer,
      );
    case 'package':
    case 'packages':
      return runNativeIntegrationCommand(
        root,
        'package',
        args.positional[0],
        args.flags,
        printer,
      );
    case 'all':
      return runNativeIntegrationCommand(
        root,
        'all',
        args.positional[0],
        args.flags,
        printer,
      );
    case 'rollback':
      return runRollbackCommand(root, args.flags, printer);
    default:
      return runHelpCommand(undefined, printer);
  }
})();

process.exitCode = exitCode;

async function runAddWithIntegration(): Promise<number> {
  const name = args.positional[0];
  const addExitCode = runAddCommand(root, name, args.flags, printer);
  if (addExitCode !== 0 || !name || args.flags['skip-integration'] === true) {
    return addExitCode;
  }
  await runNativeIntegrationCommand(
    root,
    'all',
    name,
    optionalIntegrationFlags(args.flags),
    printer,
  );
  return addExitCode;
}

async function runBundleWithIntegration(): Promise<number> {
  const bundleExitCode = runBundleCommand(
    root,
    args.positional[0],
    args.flags,
    printer,
  );
  if (bundleExitCode !== 0 || args.flags['skip-integration'] === true) {
    return bundleExitCode;
  }

  const host =
    typeof args.flags.host === 'string' ? args.flags.host : undefined;
  const name =
    args.positional[0] ??
    (typeof args.flags.name === 'string' ? args.flags.name : undefined);

  if (!host || !name) return bundleExitCode;

  const hostRoot = resolve(root, host);
  await runNativeIntegrationCommand(
    hostRoot,
    'all',
    name,
    optionalIntegrationFlags({
      ...args.flags,
      path: relative(hostRoot, root),
    }),
    printer,
  );
  return bundleExitCode;
}

async function runWithIntegrationWatcher(
  name: string | undefined,
  command: () => number,
): Promise<number> {
  if (name && args.flags['skip-integration'] !== true) {
    await runNativeIntegrationCommand(
      root,
      'all',
      name,
      optionalIntegrationFlags(args.flags),
      printer,
    );
  }

  return command();
}

function optionalIntegrationFlags(
  flags: Readonly<Record<string, string | boolean>>,
): Readonly<Record<string, string | boolean>> {
  return {
    ...flags,
    'allow-skip': true,
  };
}

function parseNativeTarget(
  value: string | undefined,
): NativeIntegrationTarget | null {
  if (
    value === 'ios' ||
    value === 'aos' ||
    value === 'package' ||
    value === 'all'
  ) {
    return value;
  }
  if (value === 'android') return 'aos';
  if (value === 'packages') return 'package';
  return null;
}
