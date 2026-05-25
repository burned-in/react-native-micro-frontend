import type { CliPrinter } from '../cli-output.printer.js';

/**
 * Handles commands whose domain services exist but require host-specific project state.
 *
 * This command is intentionally explicit rather than silently pretending to sync
 * native changes. It keeps destructive actions behind future confirmation flows.
 *
 * @param command Command name.
 * @param printer Output sink.
 * @returns Exit code.
 */
export function runPlaceholderCommand(
  command: string,
  printer: CliPrinter,
): number {
  printer.log(
    `[WARN] rnm ${command} requires an initialized host project and command-specific inputs.`,
  );
  printer.log(
    'Implemented safety policy: dry-run/verification primitives are available; native patching requires explicit --yes or interactive confirmation in a host app.',
  );
  return 0;
}
