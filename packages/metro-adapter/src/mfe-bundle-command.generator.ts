/** Input used to generate a Metro bundle command for an MFE. */
export interface MfeBundleCommandInput {
  readonly entryFile: string;
  readonly platform: 'ios' | 'android';
  readonly dev: boolean;
  readonly bundleOutput: string;
  readonly assetsDest: string;
}

/** Input used to generate compressed archive commands for an MFE bundle. */
export interface MfeBundleArchiveCommandInput extends MfeBundleCommandInput {
  readonly archiveOutput: string;
}

/**
 * Creates a React Native Metro bundle command for an MFE entry file.
 *
 * @param input Bundle target options.
 * @returns Command array that can be executed by the host package manager.
 */
export function generateMfeBundleCommand(
  input: MfeBundleCommandInput,
): readonly string[] {
  return [
    'react-native',
    'bundle',
    '--entry-file',
    input.entryFile,
    '--platform',
    input.platform,
    '--dev',
    String(input.dev),
    '--bundle-output',
    input.bundleOutput,
    '--assets-dest',
    input.assetsDest,
  ];
}

/**
 * Creates shell commands that bundle an MFE and compress the bundle plus assets.
 *
 * The archive command intentionally uses a plain `tar -czf` shape so CI can
 * inspect or replace it. The resulting `.tar.gz` can be uploaded to a CDN,
 * object storage, or a custom OTA service and referenced by bundleArchiveUrl.
 *
 * @param input Bundle target and archive output options.
 * @returns Command arrays: first Metro bundle, then archive compression.
 */
export function generateMfeBundleArchiveCommands(
  input: MfeBundleArchiveCommandInput,
): readonly (readonly string[])[] {
  return [
    generateMfeBundleCommand(input),
    ['tar', '-czf', input.archiveOutput, input.bundleOutput, input.assetsDest],
  ];
}
