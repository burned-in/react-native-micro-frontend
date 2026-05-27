import type { CliPrinter } from '../cli-output.printer.js';

interface OptionHelp {
  readonly flags: string;
  readonly description: string;
}

interface CommandHelp {
  readonly usage: string;
  readonly description: string;
  readonly options?: readonly OptionHelp[];
  readonly configs?: readonly string[];
  readonly examples?: readonly string[];
}

const commonApplyOptions: readonly OptionHelp[] = [
  {
    flags: '--dry-run',
    description: 'Show detected additions without writing files.',
  },
  {
    flags: '--yes, -y',
    description:
      'Apply every detected addition without interactive confirmation.',
  },
  {
    flags: '--path <path>',
    description:
      'Use an MFE project path directly instead of reading rnm.registry.json.',
  },
  {
    flags: '--no-backup',
    description: 'Do not create .bak files before patching existing files.',
  },
];

const watcherOption: OptionHelp = {
  flags: '--skip-integration',
  description: 'Skip the automatic package -> AOS -> iOS integration watcher.',
};

const commandHelp: Readonly<Record<string, CommandHelp>> = {
  init: {
    usage: 'rnm init [--dry-run] [--config-only] [--full]',
    description:
      'Initialize a host React Native app with RNM config, registry, native contract, and generated include files.',
    options: [
      { flags: '--dry-run', description: 'Print the integration plan only.' },
      {
        flags: '--config-only',
        description: 'Write only react-native-micro-frontend.config.ts.',
      },
      {
        flags: '--full',
        description: 'Generate the full host integration file set.',
      },
    ],
  },
  add: {
    usage:
      'rnm add <mfe-name> --path <path> [--entry <file>] [--version <version>]',
    description:
      'Register an MFE in rnm.registry.json, then watch for missing package/AOS/iOS integration additions unless skipped.',
    options: [
      { flags: '--path <path>', description: 'MFE project path.' },
      { flags: '--entry <file>', description: 'MFE entry file.' },
      { flags: '--version <version>', description: 'MFE version.' },
      {
        flags: '--ota-mode auto|manual|disabled',
        description: 'OTA workflow mode stored in the registry.',
      },
      {
        flags: '--ota-provider hot-updater|expo|custom|none',
        description:
          'OTA provider stored in the registry. expo also makes the watcher show missing expo/expo-updates packages.',
      },
      {
        flags: '--native-policy ask|block|apply-and-disable-ota',
        description: 'How native changes are handled for this MFE.',
      },
      { flags: '--no-ota', description: 'Register the MFE with OTA disabled.' },
      watcherOption,
    ],
    examples: [
      'rnm add payments --path ../payments --ota-provider expo --yes',
      'rnm add payments --path ../payments --ota-provider hot-updater',
    ],
  },
  ios: {
    usage: 'rnm ios <mfe-name> [--path <path>] [--dry-run] [--yes]',
    description:
      'Detect missing iOS pods from the MFE native contract and add them to ios/Podfile.rnm.generated.rb after confirmation.',
    options: commonApplyOptions,
    configs: [
      'MFE rnm.native-contract.json: ios.pods[]',
      'Host generated file: ios/Podfile.rnm.generated.rb',
      'Host link file: ios/Podfile',
      'Expo managed/prebuild: rnm.expo-plugin.cjs + rnm.expo-integration.json',
      'Host lockfile used for detection: ios/Podfile.lock',
    ],
    examples: [
      'rnm ios payments',
      'rnm ios payments --dry-run',
      'rnm ios payments --yes',
    ],
  },
  android: {
    usage: 'rnm android <mfe-name> [--path <path>] [--dry-run] [--yes]',
    description:
      'Detect missing Android Gradle projects, dependencies, and permissions from the MFE native contract and add generated host snippets after confirmation.',
    options: commonApplyOptions,
    configs: [
      'MFE rnm.native-contract.json: android.gradleProjects[], android.gradleDependencies[], android.permissions[]',
      'Host generated files: android/rnm.settings.generated.gradle, android/rnm.generated.gradle, android/AndroidManifest.rnm.generated.xml',
      'Host link files: android/settings.gradle(.kts), android/app/build.gradle(.kts)',
      'Expo managed/prebuild: rnm.expo-plugin.cjs + rnm.expo-integration.json',
    ],
    examples: [
      'rnm android payments',
      'rnm aos payments --dry-run',
      'rnm android payments --yes',
    ],
  },
  aos: {
    usage: 'rnm aos <mfe-name> [--path <path>] [--dry-run] [--yes]',
    description:
      'Detect missing AOS/Android Gradle projects, dependencies, and permissions from the MFE native contract and add generated host snippets after confirmation.',
    options: commonApplyOptions,
    configs: [
      'MFE rnm.native-contract.json: android.gradleProjects[], android.gradleDependencies[], android.permissions[]',
      'Host generated files: android/rnm.settings.generated.gradle, android/rnm.generated.gradle, android/AndroidManifest.rnm.generated.xml',
      'Host link files: android/settings.gradle(.kts), android/app/build.gradle(.kts)',
      'Expo managed/prebuild: rnm.expo-plugin.cjs + rnm.expo-integration.json',
    ],
    examples: [
      'rnm aos payments',
      'rnm aos payments --dry-run',
      'rnm aos payments --yes',
    ],
  },
  package: {
    usage:
      'rnm package <mfe-name> [--path <path>] [--dry-run] [--yes] [--include-dev]',
    description:
      'Detect package dependencies required by an MFE and add missing host package.json dependencies after confirmation.',
    options: [
      ...commonApplyOptions,
      {
        flags: '--include-dev',
        description: 'Also consider the MFE devDependencies. Off by default.',
      },
    ],
    configs: [
      'MFE package.json: dependencies and peerDependencies by default',
      'MFE rnm.native-contract.json: packageDependencies[] when present',
      'Host package.json: dependencies target',
    ],
    examples: [
      'rnm package payments',
      'rnm package payments --dry-run',
      'rnm package payments --yes',
    ],
  },
  packages: {
    usage:
      'rnm packages <mfe-name> [--path <path>] [--dry-run] [--yes] [--include-dev]',
    description: 'Alias for rnm package.',
    options: commonApplyOptions,
  },
  all: {
    usage: 'rnm all <mfe-name> [--path <path>] [--dry-run] [--yes]',
    description:
      'Run every MFE host integration in order: package -> AOS -> iOS.',
    options: commonApplyOptions,
    configs: [
      'package: host package.json dependencies',
      'AOS: android/rnm.settings.generated.gradle, android/rnm.generated.gradle, android/AndroidManifest.rnm.generated.xml',
      'iOS: ios/Podfile.rnm.generated.rb',
      'Expo managed/prebuild: Expo config plugin files when ios/android folders do not exist yet',
    ],
    examples: [
      'rnm all payments',
      'rnm all payments --dry-run',
      'rnm all payments --yes',
    ],
  },
  integrate: {
    usage:
      'rnm integrate [ios|android|aos|packages|all] [mfe-name] [--dry-run] [--yes] [--manual-guide]',
    description:
      'Create generated integration files, or run targeted iOS/Android/package integration when a target is provided.',
    options: [
      ...commonApplyOptions,
      {
        flags: '--manual-guide',
        description: 'Write docs/rnm-integration-guide.md for manual setup.',
      },
      {
        flags: '--full',
        description: 'Generate the full safe integration file set.',
      },
    ],
    configs: [
      'Host react-native-micro-frontend.config.ts/.mjs/.cjs package.sync, ios.pods, android.integration',
      'Registry rnm.registry.json for MFE path resolution',
      'Generated native include files under ios/ and android/',
    ],
    examples: [
      'rnm integrate --yes',
      'rnm integrate all payments --dry-run',
      'rnm integrate ios payments --yes',
    ],
  },
  sync: {
    usage: 'rnm sync <mfe-name> --apply-native|--block-native',
    description:
      'Update registry native-change policy after a native diff decision.',
    options: [
      {
        flags: '--apply-native',
        description: 'Mark native changes as applied and disable OTA.',
      },
      {
        flags: '--block-native',
        description: 'Block the MFE until native changes are applied.',
      },
    ],
  },
  bundle: {
    usage:
      'rnm bundle [mfe-name] [--platform ios|android|all] [--entry <file>] [--host <path>] [--update-registry]',
    description:
      'Build a React Native bundle archive containing only the JS bundle, Metro assets, and manifest.',
    options: [
      {
        flags: '--platform ios|android|all',
        description: 'Target platform. Defaults to ios.',
      },
      { flags: '--entry <file>', description: 'Entry file to bundle.' },
      { flags: '--out-dir <dir>', description: 'Output directory.' },
      { flags: '--dev', description: 'Create a development bundle.' },
      {
        flags: '--yes, -y',
        description:
          'Apply detected Host archive registration imports without prompting.',
      },
      {
        flags: '--host <path>',
        description: 'Copy the archive into a host .bundle/rnm directory.',
      },
      {
        flags: '--update-registry',
        description: 'Update the host registry bundleArchiveUrl after copying.',
      },
      {
        flags: '--register-archives',
        description:
          'Import generated rnm.bundle-archives from the detected Host entry file.',
      },
      {
        flags: '--no-register-archives',
        description:
          'Generate rnm.bundle-archives.ts but do not patch Host entry.',
      },
      {
        flags: '--host-entry <file>',
        description:
          'Host entry file to patch when auto-registering archive assets.',
      },
      watcherOption,
    ],
    configs: [
      'MFE defaults: mfe.config.ts, mfe.config.mjs, mfe.config.cjs, or mfe.config.json',
      'Optional Host registry update: rnm.registry.json bundleArchiveUrl',
      'Optional Host entry import: rnm.bundle-archives.ts registers copied .tar.gz assets for React Native',
    ],
  },
  build: {
    usage:
      'rnm build <mfe-name> [--platform ios|android] [--type ota|bundle] [--archive]',
    description: 'Print Metro bundle/archive commands without executing them.',
  },
  publish: {
    usage:
      'rnm publish <mfe-name> [--provider hot-updater|expo|custom] [--channel <name>] [--package-manager <pm>]',
    description:
      'Watch for missing package/AOS/iOS additions, then run the OTA eligibility gate and print deploy commands.',
    options: [
      {
        flags: '--provider hot-updater|expo|custom',
        description:
          'Deploy-command provider to print. Defaults to the registry OTA provider.',
      },
      {
        flags: '--ota-provider hot-updater|expo|custom',
        description: 'Alias for --provider.',
      },
      {
        flags: '--channel <name>',
        description:
          'Hot Updater channel or Expo EAS channel. Defaults to production.',
      },
      {
        flags: '--branch <name>',
        description: 'Expo EAS branch to update instead of a channel.',
      },
      {
        flags: '--message <text>',
        description:
          'Expo EAS update message. Defaults to RNM <name>@<version>.',
      },
      {
        flags: '--platform ios|android|all',
        description: 'Expo EAS target platform. Defaults to all.',
      },
      {
        flags: '--environment <name>',
        description: 'Expo EAS environment name.',
      },
      {
        flags: '--auto',
        description:
          'Use Expo EAS auto mode instead of channel/branch/message flags.',
      },
      {
        flags: '--non-interactive',
        description: 'Pass --non-interactive to Expo EAS Update.',
      },
      {
        flags: '--package-manager bun|npm|pnpm|yarn|deno',
        description: 'Package manager used to print the deploy command.',
      },
      watcherOption,
    ],
    examples: [
      'rnm publish payments --provider expo --channel production --platform all',
      'rnm publish payments --provider expo --branch preview --non-interactive',
      'rnm publish payments --provider hot-updater --channel production',
    ],
  },
  expo: {
    usage:
      'rnm expo <mfe-name> [--channel <name>|--branch <name>|--auto] [--platform ios|android|all]',
    description:
      'Watch for missing integration additions, run the OTA eligibility gate, then print an Expo EAS Update deploy command.',
    options: [
      {
        flags: '--channel <name>',
        description: 'Expo EAS channel. Defaults to production.',
      },
      {
        flags: '--branch <name>',
        description: 'Expo EAS branch to update instead of a channel.',
      },
      {
        flags: '--message <text>',
        description:
          'Expo EAS update message. Defaults to RNM <name>@<version>.',
      },
      {
        flags: '--platform ios|android|all',
        description: 'Expo EAS target platform. Defaults to all.',
      },
      {
        flags: '--environment <name>',
        description: 'Expo EAS environment name.',
      },
      {
        flags: '--auto',
        description:
          'Use Expo EAS auto mode instead of channel/branch/message flags.',
      },
      {
        flags: '--non-interactive',
        description: 'Pass --non-interactive to Expo EAS Update.',
      },
      {
        flags: '--package-manager bun|npm|pnpm|yarn|deno',
        description: 'Package manager used to print the EAS command.',
      },
      watcherOption,
    ],
    configs: [
      'MFE rnm.registry.json: ota.provider can be expo',
      'Expo EAS Update command: eas update',
      'Automatic integration watcher: package -> AOS -> iOS before publish safety checks',
    ],
    examples: [
      'rnm add payments --path ../payments --ota-provider expo',
      'rnm expo payments --channel production --platform all',
      'rnm expo payments --branch preview --non-interactive',
      'rnm publish payments --provider expo --auto',
    ],
  },
  diff: {
    usage: 'rnm diff <mfe-name>',
    description:
      'Compare host and MFE native contracts and show native-change deltas.',
  },
  verify: {
    usage: 'rnm verify <mfe-name>',
    description:
      'Watch for missing package/AOS/iOS additions, then verify whether a registered MFE is safe to load via OTA.',
    options: [watcherOption],
  },
  status: {
    usage: 'rnm status',
    description: 'Print registered MFE status from rnm.registry.json.',
  },
  doctor: {
    usage: 'rnm doctor',
    description: 'Inspect host React Native integration state.',
  },
  rollback: {
    usage: 'rnm rollback --yes',
    description: 'Restore known .bak files produced by integration commands.',
    options: [
      { flags: '--yes, -y', description: 'Required to restore backups.' },
    ],
  },
};

const commandOrder = [
  'init',
  'add',
  'ios',
  'aos',
  'android',
  'package',
  'packages',
  'integrate',
  'all',
  'sync',
  'bundle',
  'build',
  'publish',
  'expo',
  'diff',
  'verify',
  'status',
  'doctor',
  'rollback',
];

/** Prints global or command-specific CLI help. */
export function runHelpCommand(
  command: string | undefined,
  printer: CliPrinter,
): number {
  if (command && commandHelp[command]) {
    printCommandHelp(command, commandHelp[command], printer);
    return 0;
  }

  printer.log('React Native Micro Frontend CLI');
  printer.log('');
  printer.log('Usage:');
  printer.log('  rnm <command> [options]');
  printer.log('');
  printer.log('Commands:');
  for (const name of commandOrder) {
    const help = commandHelp[name];
    if (help) printer.log(`  ${name.padEnd(10)} ${help.description}`);
  }
  printer.log('');
  printer.log('Helpful examples:');
  printer.log('  rnm init --yes');
  printer.log('  rnm add payments --path ../payments');
  printer.log('  rnm all payments --dry-run');
  printer.log('  rnm package payments');
  printer.log('  rnm ios payments --yes');
  printer.log('  rnm android payments --yes');
  printer.log('  rnm expo payments --channel production --platform all');
  printer.log('');
  printer.log('Run `rnm <command> --help` or `rnm <command> -h` for details.');
  return 0;
}

function printCommandHelp(
  name: string,
  help: CommandHelp,
  printer: CliPrinter,
): void {
  printer.log(`rnm ${name}`);
  printer.log('');
  printer.log(help.description);
  printer.log('');
  printer.log('Usage:');
  printer.log(`  ${help.usage}`);

  if (help.options?.length) {
    printer.log('');
    printer.log('Options:');
    for (const option of help.options) {
      printer.log(`  ${option.flags.padEnd(48)} ${option.description}`);
    }
  }

  if (help.configs?.length) {
    printer.log('');
    printer.log('Related configs/files:');
    for (const config of help.configs) {
      printer.log(`  - ${config}`);
    }
  }

  if (help.examples?.length) {
    printer.log('');
    printer.log('Examples:');
    for (const example of help.examples) {
      printer.log(`  ${example}`);
    }
  }
}
