import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  analyzeHostProject,
  createDefaultHostConfigTemplate,
  createGeneratedIntegrationFiles,
  generateIntegrationPlan,
  generateManualIntegrationGuide,
} from "@bunin/react-native-micro-frontend-integration";
import type { CliPrinter } from "../cli-output.printer.js";

/**
 * Handles `rnm integrate` for safe generated-file integration and manual guides.
 *
 * Side effects: writes generated files only with `--yes` or `--manual-guide`.
 * Direct native project patches are not performed by this conservative command.
 *
 * @param root Project root.
 * @param flags CLI flags.
 * @param printer Output sink.
 * @returns Exit code.
 */
export function runIntegrateCommand(
  root: string,
  flags: Readonly<Record<string, string | boolean>>,
  printer: CliPrinter,
): number {
  const mode = flags["manual-guide"]
    ? "manual-guide"
    : flags["dry-run"]
      ? "dry-run"
      : flags.full
        ? "full"
        : "safe-minimal";

  const analysis = analyzeHostProject(root);
  const plan = generateIntegrationPlan(analysis, mode);

  for (const line of plan.summary) {
    printer.log(line);
  }

  for (const change of plan.changes) {
    printer.log(`[PLAN] ${change.action} ${change.path} - ${change.reason}`);
  }

  if (flags["manual-guide"] === true) {
    const guide = generateManualIntegrationGuide(plan);

    write(root, "docs/rnm-integration-guide.md", guide);
    printer.log("[OK] docs/rnm-integration-guide.md generated.");

    return 0;
  }

  if (flags["dry-run"] === true) {
    return 0;
  }

  if (flags.yes !== true) {
    printer.error("Use --yes to write generated integration files in non-interactive mode.");
    return 1;
  }

  write(root, "react-native-micro-frontend.config.ts", createDefaultHostConfigTemplate());

  for (const file of createGeneratedIntegrationFiles()) {
    write(root, file.path, file.contents);
  }

  printer.log("[OK] Generated integration files written.");
  return 0;
}

function write(root: string, path: string, contents: string): void {
  const target = join(root, path);

  mkdirSync(dirname(target), {
    recursive: true,
  });

  writeFileSync(target, contents);
}
