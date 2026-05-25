/** Parsed CLI arguments. */
export interface ParsedCliArgs {
  readonly command: string;
  readonly positional: readonly string[];
  readonly flags: Readonly<Record<string, string | boolean>>;
}

/**
 * Parses a small flag set used by rnm commands.
 *
 * @param argv Raw argv excluding runtime executable and script path.
 * @returns Parsed command, positional args, and flags.
 */
export function parseCliArgs(argv: readonly string[]): ParsedCliArgs {
  const [command = "help", ...rest] = argv;
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!token) continue;
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const next = rest[index + 1];
      if (next && !next.startsWith("--")) { flags[key] = next; index += 1; }
      else flags[key] = true;
    } else positional.push(token);
  }
  return { command, positional, flags };
}
