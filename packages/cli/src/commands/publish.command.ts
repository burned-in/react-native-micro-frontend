import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  MfeRegistry,
  OtaProvider,
  PackageManagerName,
} from '@bunin/react-native-micro-frontend';
import {
  checkOtaEligibility,
  formatOtaEligibility,
} from '@bunin/react-native-micro-frontend';
import { generateHotUpdaterDeployCommand } from '@bunin/react-native-micro-frontend-hot-updater-adapter';
import type { CliPrinter } from '../cli-output.printer.js';

/**
 * Handles `rnm publish <mfe>` by running the OTA eligibility gate and printing deploy commands.
 *
 * This command does not publish unless a future command runner is explicitly
 * wired. It prevents unsafe OTA by failing on nativeHash mismatch/block states.
 *
 * @param root Project root.
 * @param name MFE name.
 * @param flags CLI flags.
 * @param printer Output sink.
 * @returns Exit code.
 */
export function runPublishCommand(
  root: string,
  name: string | undefined,
  flags: Readonly<Record<string, string | boolean>>,
  printer: CliPrinter,
): number {
  if (!name) {
    printer.error('Usage: rnm publish <mfe-name>');
    return 1;
  }

  const registryPath = join(root, 'rnm.registry.json');

  if (!existsSync(registryPath)) {
    printer.error('rnm.registry.json not found.');
    return 1;
  }

  const registry = JSON.parse(
    readFileSync(registryPath, 'utf8'),
  ) as MfeRegistry;
  const mfe = registry.mfes[name];

  if (!mfe) {
    printer.error(`MFE not registered: ${name}`);
    return 1;
  }

  const nativeHashMismatch = Boolean(
    registry.hostNativeHash &&
      mfe.nativeHash &&
      registry.hostNativeHash !== mfe.nativeHash,
  );

  const result = checkOtaEligibility({
    otaEnabled: mfe.ota.enabled && flags['no-ota'] !== true,
    mfeBlocked: mfe.status === 'blocked',
    reactNativeVersionMismatch: false,
    hermesSettingMismatch: false,
    newArchitectureSettingMismatch: false,
    nativeChanged: false,
    nativeHashMismatch,
  });

  for (const line of formatOtaEligibility(result)) {
    printer.log(line);
  }

  if (!result.otaPossible) {
    printer.error(
      'OTA PUBLISH BLOCKED. Required: Store release or native contract fix.',
    );
    return 1;
  }

  const packageManager = packageManagerFlag(flags['package-manager']);
  const channel =
    typeof flags.channel === 'string' ? flags.channel : 'production';
  const provider = providerFlag(
    flags.provider ?? flags['ota-provider'],
    mfe.ota.provider,
  );

  if (provider === 'expo') {
    const deployOptions: ExpoEasUpdateCommandOptions = {
      packageManager,
      channel,
      message: stringFlag(flags.message) ?? `RNM ${name}@${mfe.version}`,
      platform: platformFlag(flags.platform),
      auto: flags.auto === true,
      nonInteractive: flags['non-interactive'] === true,
    };
    const branch = stringFlag(flags.branch);
    const environment = stringFlag(flags.environment);
    if (branch) deployOptions.branch = branch;
    if (environment) deployOptions.environment = environment;
    const deployCommand = generateExpoEasUpdateCommand(deployOptions);

    printer.log(shellJoin(deployCommand));
    return 0;
  }

  if (provider === 'none') {
    printer.error(
      'OTA provider is none. Use --provider expo or --provider hot-updater when you want to print a deploy command.',
    );
    return 1;
  }

  if (provider === 'custom') {
    printer.log(
      'Custom OTA provider selected. RNM safety checks passed; run your custom deploy command with this MFE artifact.',
    );
    return 0;
  }

  for (const platform of ['ios', 'android'] as const) {
    const deployCommand = generateHotUpdaterDeployCommand({
      packageManager,
      platform,
      channel,
    });

    printer.log(shellJoin(deployCommand));
  }

  return 0;
}

interface ExpoEasUpdateCommandOptions {
  readonly packageManager: PackageManagerName;
  readonly channel: string;
  branch?: string;
  readonly message: string;
  readonly platform: 'ios' | 'android' | 'all';
  environment?: string;
  readonly auto: boolean;
  readonly nonInteractive: boolean;
}

function generateExpoEasUpdateCommand(
  options: ExpoEasUpdateCommandOptions,
): readonly string[] {
  const command = easUpdateCommandPrefix(options.packageManager);

  if (options.auto) {
    command.push('--auto');
  } else if (options.branch) {
    command.push('--branch', options.branch);
  } else {
    command.push('--channel', options.channel);
  }

  if (!options.auto) {
    command.push('--message', options.message);
  }

  command.push('--platform', options.platform);

  if (options.environment) {
    command.push('--environment', options.environment);
  }

  if (options.nonInteractive) {
    command.push('--non-interactive');
  }

  return command;
}

function easUpdateCommandPrefix(packageManager: PackageManagerName): string[] {
  switch (packageManager) {
    case 'bun':
      return ['bunx', 'eas-cli@latest', 'update'];
    case 'pnpm':
      return ['pnpm', 'dlx', 'eas-cli@latest', 'update'];
    case 'yarn':
      return ['yarn', 'dlx', 'eas-cli@latest', 'update'];
    case 'deno':
      return ['deno', 'run', '-A', 'npm:eas-cli', 'update'];
    default:
      return ['npx', 'eas-cli@latest', 'update'];
  }
}

function providerFlag(
  value: string | boolean | undefined,
  fallback: OtaProvider,
): OtaProvider {
  if (
    value === 'hot-updater' ||
    value === 'expo' ||
    value === 'none' ||
    value === 'custom'
  ) {
    return value;
  }

  return fallback;
}

function platformFlag(
  value: string | boolean | undefined,
): 'ios' | 'android' | 'all' {
  if (value === 'ios' || value === 'android' || value === 'all') {
    return value;
  }

  return 'all';
}

function stringFlag(value: string | boolean | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function shellJoin(args: readonly string[]): string {
  return args.map(quoteShellArg).join(' ');
}

function quoteShellArg(arg: string): string {
  if (/^[A-Za-z0-9_/:=@%+.,~-]+$/.test(arg)) {
    return arg;
  }

  return `'${arg.replaceAll("'", "'\\''")}'`;
}

function packageManagerFlag(
  value: string | boolean | undefined,
): PackageManagerName {
  if (
    value === 'bun' ||
    value === 'deno' ||
    value === 'pnpm' ||
    value === 'yarn' ||
    value === 'npm'
  ) {
    return value;
  }

  return 'npm';
}
