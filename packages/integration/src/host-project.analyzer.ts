import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { detectPackageManager } from "@bunin/react-native-micro-frontend";
import type { PackageManagerDetection } from "@bunin/react-native-micro-frontend";

/** Detection result for an existing React Native host app. */
export interface HostProjectAnalysis {
  readonly root: string;
  readonly reactNativeVersion: string | null;
  readonly projectType: "bare-react-native" | "expo" | "unknown";
  readonly packageManager: PackageManagerDetection;
  readonly iosDetected: boolean;
  readonly androidDetected: boolean;
  readonly podfileDetected: boolean;
  readonly podfileLockDetected: boolean;
  readonly metroConfigDetected: boolean;
  readonly babelConfigDetected: boolean;
  readonly hotUpdaterDetected: boolean;
  readonly codePushDetected: boolean;
  readonly typeScriptDetected: boolean;
  readonly monorepoDetected: boolean;
}

/**
 * Analyzes a host project root without modifying files.
 *
 * @param root Host app root.
 * @returns Detection summary used by init, integrate, and doctor.
 */
export function analyzeHostProject(root: string): HostProjectAnalysis {
  const packageJson = readPackageJson(root);
  const files = safeReaddir(root);
  const dependencies = { ...(packageJson.dependencies ?? {}), ...(packageJson.devDependencies ?? {}) };
  return {
    root,
    reactNativeVersion: dependencies["react-native"] ?? null,
    projectType: dependencies.expo ? "expo" : dependencies["react-native"] ? "bare-react-native" : "unknown",
    packageManager: detectPackageManager(packageJson.packageManager ? { files, packageManagerField: packageJson.packageManager } : { files }),
    iosDetected: existsSync(join(root, "ios")),
    androidDetected: existsSync(join(root, "android")),
    podfileDetected: existsSync(join(root, "ios", "Podfile")),
    podfileLockDetected: existsSync(join(root, "ios", "Podfile.lock")),
    metroConfigDetected: ["metro.config.js", "metro.config.ts", "metro.config.cjs", "metro.config.mjs"].some((file) => existsSync(join(root, file))),
    babelConfigDetected: ["babel.config.js", "babel.config.cjs", "babel.config.json"].some((file) => existsSync(join(root, file))),
    hotUpdaterDetected: ["hot-updater.config.ts", "hot-updater.config.js"].some((file) => existsSync(join(root, file))) || Boolean(dependencies["@hot-updater/react-native"] || dependencies["hot-updater"]),
    codePushDetected: Boolean(dependencies["react-native-code-push"] || dependencies["@microsoft/react-native-code-push"]),
    typeScriptDetected: existsSync(join(root, "tsconfig.json")) || files.some((file) => file.endsWith(".ts") || file.endsWith(".tsx")),
    monorepoDetected: Boolean(packageJson.workspaces) || existsSync(join(root, "pnpm-workspace.yaml")) || existsSync(join(root, "turbo.json")) || existsSync(join(root, "nx.json")),
  };
}

function readPackageJson(root: string): { dependencies?: Record<string, string>; devDependencies?: Record<string, string>; packageManager?: string; workspaces?: unknown } {
  const path = join(root, "package.json");
  if (!existsSync(path)) return {};
  return JSON.parse(readFileSync(path, "utf8")) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string>; packageManager?: string; workspaces?: unknown };
}
function safeReaddir(root: string): string[] { try { return readdirSync(root); } catch { return []; } }
