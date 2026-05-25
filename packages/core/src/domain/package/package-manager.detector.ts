import type { PackageManagerCommands, PackageManagerDetection, PackageManagerName } from "./package-manager.type.js";

const LOCKFILE_PRIORITY: readonly [string, PackageManagerName][] = [
  ["bun.lockb", "bun"],
  ["bun.lock", "bun"],
  ["deno.json", "deno"],
  ["deno.jsonc", "deno"],
  ["package-lock.json", "npm"],
  ["npm-shrinkwrap.json", "npm"],
  ["pnpm-lock.yaml", "pnpm"],
  ["yarn.lock", "yarn"],
];

/**
 * Detects the package manager using explicit input, config preference, lockfiles, packageManager field, then npm.
 *
 * This function is pure and has no filesystem side effects; callers provide the discovered file names.
 *
 * @param input Detection facts for one project plus optional host/MFE comparison.
 * @returns Package manager detection result and warning bit for cross-project mismatches.
 */
export function detectPackageManager(input: {
  readonly explicit?: PackageManagerName;
  readonly localConfig?: PackageManagerName;
  readonly hostConfig?: PackageManagerName;
  readonly files: readonly string[];
  readonly packageManagerField?: string;
  readonly otherProjectPackageManager?: PackageManagerName;
}): PackageManagerDetection {
  const evidence: string[] = [];
  const choose = (name: PackageManagerName, reason: string): PackageManagerDetection => ({
    name,
    reason,
    evidence,
    crossProjectWarning: Boolean(input.otherProjectPackageManager && input.otherProjectPackageManager !== name),
  });

  if (input.explicit) {
    evidence.push(`explicit:${input.explicit}`);
    return choose(input.explicit, "explicit CLI option");
  }
  if (input.localConfig) {
    evidence.push(`mfe-config:${input.localConfig}`);
    return choose(input.localConfig, "MFE local config");
  }
  if (input.hostConfig) {
    evidence.push(`host-config:${input.hostConfig}`);
    return choose(input.hostConfig, "host config");
  }

  const fileSet = new Set(input.files);
  for (const [lockfile, manager] of LOCKFILE_PRIORITY) {
    if (fileSet.has(lockfile)) {
      evidence.push(lockfile);
      return choose(manager, "lockfile detection");
    }
  }

  const field = input.packageManagerField?.split("@")[0];
  if (field === "bun" || field === "deno" || field === "npm" || field === "pnpm" || field === "yarn") {
    evidence.push(`packageManager:${input.packageManagerField}`);
    return choose(field, "packageManager field");
  }

  evidence.push("default:npm");
  return choose("npm", "default fallback");
}

/**
 * Builds package-manager-specific command arrays without executing them.
 *
 * @param manager Package manager or CLI runtime.
 * @returns Commands for `rnm`, scripts, and dependency installation.
 */
export function createPackageManagerCommands(manager: PackageManagerName): PackageManagerCommands {
  switch (manager) {
    case "bun":
      return {
        executeRnm: ["bunx", "@bunin/react-native-micro-frontend-cli"],
        runScript: (script) => ["bun", "run", script],
        installDependencies: (deps, dev) => ["bun", "add", ...(dev ? ["-d"] : []), ...deps],
      };
    case "deno":
      return {
        executeRnm: ["deno", "run", "-A", "npm:@bunin/react-native-micro-frontend-cli"],
        runScript: (script) => ["deno", "task", script],
        installDependencies: (deps) => ["echo", `Deno projects require manual dependency setup: ${deps.join(" ")}`],
      };
    case "pnpm":
      return {
        executeRnm: ["pnpm", "dlx", "@bunin/react-native-micro-frontend-cli"],
        runScript: (script) => ["pnpm", script],
        installDependencies: (deps, dev) => ["pnpm", "add", ...(dev ? ["-D"] : []), ...deps],
      };
    case "yarn":
      return {
        executeRnm: ["yarn", "dlx", "@bunin/react-native-micro-frontend-cli"],
        runScript: (script) => ["yarn", script],
        installDependencies: (deps, dev) => ["yarn", "add", ...(dev ? ["-D"] : []), ...deps],
      };
    case "npm":
      return {
        executeRnm: ["npx", "@bunin/react-native-micro-frontend-cli"],
        runScript: (script) => ["npm", "run", script],
        installDependencies: (deps, dev) => ["npm", "install", ...(dev ? ["--save-dev"] : ["--save"]), ...deps],
      };
  }
}
