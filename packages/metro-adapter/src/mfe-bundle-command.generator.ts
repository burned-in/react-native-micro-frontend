/** Input used to generate a Metro bundle command for an MFE. */
export interface MfeBundleCommandInput {
  readonly entryFile: string;
  readonly platform: "ios" | "android";
  readonly dev: boolean;
  readonly bundleOutput: string;
  readonly assetsDest: string;
}

/**
 * Creates a React Native Metro bundle command for an MFE entry file.
 *
 * @param input Bundle target options.
 * @returns Command array that can be executed by the host package manager.
 */
export function generateMfeBundleCommand(input: MfeBundleCommandInput): readonly string[] {
  return [
    "react-native",
    "bundle",
    "--entry-file", input.entryFile,
    "--platform", input.platform,
    "--dev", String(input.dev),
    "--bundle-output", input.bundleOutput,
    "--assets-dest", input.assetsDest,
  ];
}
