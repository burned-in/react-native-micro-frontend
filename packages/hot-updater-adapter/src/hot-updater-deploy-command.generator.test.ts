import { describe, expect, test } from "bun:test";
import { generateHotUpdaterDeployCommand } from "./hot-updater-deploy-command.generator.js";

describe("generateHotUpdaterDeployCommand", () => {
  test("generates Hot Updater deploy commands for every supported package manager", () => {
    expect(commandFor("bun")).toEqual(["bunx", "hot-updater", "deploy", "-p", "ios", "-c", "production"]);
    expect(commandFor("npm")).toEqual(["npx", "hot-updater", "deploy", "-p", "ios", "-c", "production"]);
    expect(commandFor("pnpm")).toEqual(["pnpm", "dlx", "hot-updater", "deploy", "-p", "ios", "-c", "production"]);
    expect(commandFor("yarn")).toEqual(["yarn", "dlx", "hot-updater", "deploy", "-p", "ios", "-c", "production"]);
    expect(commandFor("deno")).toEqual(["deno", "run", "-A", "npm:hot-updater", "deploy", "-p", "ios", "-c", "production"]);
  });

  test("keeps existing deployment scripts package-manager-specific", () => {
    expect(generateHotUpdaterDeployCommand({
      packageManager: "bun",
      platform: "android",
      channel: "staging",
      existingScript: "deploy:ota",
    })).toEqual(["bun", "run", "deploy:ota", "--", "-p", "android", "-c", "staging"]);
  });
});

function commandFor(packageManager: "bun" | "deno" | "npm" | "pnpm" | "yarn") {
  return generateHotUpdaterDeployCommand({
    packageManager,
    platform: "ios",
    channel: "production",
  });
}
