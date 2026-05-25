/** CLI output sink used to keep command handlers testable. */
export interface CliPrinter {
  readonly log: (message: string) => void;
  readonly error: (message: string) => void;
}

/**
 * Creates a console-backed CLI printer.
 *
 * @returns Printer using console.log and console.error.
 */
export function createConsolePrinter(): CliPrinter {
  return {
    log: (message) => console.log(message),
    error: (message) => console.error(message),
  };
}
