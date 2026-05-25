/** Supported JavaScript package manager or CLI runtime. */
export type PackageManagerName = "bun" | "deno" | "npm" | "pnpm" | "yarn";

/** Evidence produced while detecting a package manager. */
export interface PackageManagerDetection {
  /** Final detected package manager. */
  readonly name: PackageManagerName;
  /** Why that package manager won. */
  readonly reason: string;
  /** Lockfiles or packageManager fields considered during detection. */
  readonly evidence: readonly string[];
  /** True when host and MFE package managers differ and should be warned. */
  readonly crossProjectWarning: boolean;
}

/** Command set for invoking scripts, dlx, and dependency installation. */
export interface PackageManagerCommands {
  readonly executeRnm: readonly string[];
  readonly runScript: (scriptName: string) => readonly string[];
  readonly installDependencies: (dependencies: readonly string[], dev: boolean) => readonly string[];
}
