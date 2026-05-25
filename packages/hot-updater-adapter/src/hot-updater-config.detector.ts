import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** Existing Hot Updater detection result. */
export interface HotUpdaterDetection {
  readonly detected: boolean;
  readonly configPath?: string;
  readonly packageDetected: boolean;
  readonly wrapCallDetected: boolean;
  readonly envDetected: boolean;
  readonly deployScriptDetected: boolean;
}

/**
 * Detects existing Hot Updater configuration without modifying files.
 *
 * @param root Host project root.
 * @returns Detection details for integration choices.
 */
export function detectHotUpdater(root: string): HotUpdaterDetection {
  const packageJsonPath = join(root, "package.json");
  const packageJson = existsSync(packageJsonPath) ? JSON.parse(readFileSync(packageJsonPath, "utf8")) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string>; scripts?: Record<string, string> } : {};
  const configPath = ["hot-updater.config.ts", "hot-updater.config.js"].find((file) => existsSync(join(root, file)));
  const configText = configPath ? readFileSync(join(root, configPath), "utf8") : "";
  const deps = { ...(packageJson.dependencies ?? {}), ...(packageJson.devDependencies ?? {}) };
  const base = {
    detected: Boolean(configPath || deps["@hot-updater/react-native"] || deps["hot-updater"]),
    packageDetected: Boolean(deps["@hot-updater/react-native"] || deps["hot-updater"]),
    wrapCallDetected: /HotUpdater\.wrap\(/.test(configText),
    envDetected: existsSync(join(root, ".env.hotupdater")),
    deployScriptDetected: Object.values(packageJson.scripts ?? {}).some((script) => script.includes("hot-updater") && script.includes("deploy")),
  };
  return configPath ? { ...base, configPath } : base;
}
