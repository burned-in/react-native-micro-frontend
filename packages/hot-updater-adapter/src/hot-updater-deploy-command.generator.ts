import { createPackageManagerCommands } from "@bunin/react-native-micro-frontend";
import type { PackageManagerName } from "@bunin/react-native-micro-frontend";

/** Input for creating a Hot Updater deployment command. */
export interface HotUpdaterDeployCommandInput {
  readonly packageManager: PackageManagerName;
  readonly platform: "ios" | "android";
  readonly channel: string;
  readonly existingScript?: string;
}

/**
 * Creates a command array that delegates OTA deploy to Hot Updater.
 *
 * @param input Package manager, platform and channel info.
 * @returns Command array ready for display or execution by a command runner.
 */
export function generateHotUpdaterDeployCommand(input: HotUpdaterDeployCommandInput): readonly string[] {
  const commands = createPackageManagerCommands(input.packageManager);
  if (input.existingScript) return [...commands.runScript(input.existingScript), "--", "-p", input.platform, "-c", input.channel];
  switch (input.packageManager) {
    case "bun":
      return ["bunx", "hot-updater", "deploy", "-p", input.platform, "-c", input.channel];
    case "pnpm":
      return ["pnpm", "dlx", "hot-updater", "deploy", "-p", input.platform, "-c", input.channel];
    case "yarn":
      return ["yarn", "dlx", "hot-updater", "deploy", "-p", input.platform, "-c", input.channel];
    case "deno":
      return ["deno", "run", "-A", "npm:hot-updater", "deploy", "-p", input.platform, "-c", input.channel];
    case "npm":
      return ["npx", "hot-updater", "deploy", "-p", input.platform, "-c", input.channel];
  }
}
