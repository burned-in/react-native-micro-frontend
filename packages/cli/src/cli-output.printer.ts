/** CLI output sink used to keep command handlers testable. */
export interface CliPrinter {
  readonly log: (message: string) => void;
  readonly error: (message: string) => void;
}

interface FormatOptions {
  readonly color?: boolean;
  readonly error?: boolean;
  readonly multilineErrorPrefix?: boolean;
}

type Paint = (message: string) => string;

interface LevelStyle {
  readonly label: string;
  readonly symbol: string;
  readonly paint: Paint;
}

/**
 * Creates a console-backed CLI printer.
 *
 * @returns Printer using console.log and console.error with RNM formatting.
 */
export function createConsolePrinter(): CliPrinter {
  const color = shouldUseColor();

  return {
    log: (message) => console.log(formatCliMessage(message, { color })),
    error: (message) =>
      console.error(formatCliMessage(message, { color, error: true })),
  };
}

/**
 * Formats an RNM CLI message without coupling command handlers to terminal I/O.
 *
 * The formatter intentionally understands the existing stable tags such as
 * `[OK]`, `[WARN]`, and `[PLAN]`, so commands can remain simple and tests can
 * still inject a plain printer when they need exact output capture.
 *
 * @param message Raw command message.
 * @param options Terminal formatting options.
 * @returns Pretty terminal-safe message.
 */
export function formatCliMessage(
  message: string,
  options: FormatOptions = {},
): string {
  if (message.length === 0) return message;

  const multiline = message.includes('\n');
  return message
    .split('\n')
    .map((line) =>
      formatCliLine(line, {
        ...options,
        error:
          options.error === true &&
          (!multiline || options.multilineErrorPrefix === true),
      }),
    )
    .join('\n');
}

function formatCliLine(line: string, options: FormatOptions): string {
  if (line.length === 0) return line;

  const tagged =
    /^\[(OK|WARN|FAIL|ERROR|PLAN|SKIP|RUN|DRY-RUN|ROLLBACK)\]\s*(.*)$/.exec(
      line,
    );

  if (tagged) {
    return formatTaggedLine(
      tagged[1] ?? 'INFO',
      tagged[2] ?? '',
      options.color === true,
    );
  }

  if (options.error === true) {
    return formatTaggedLine('ERROR', line, options.color === true);
  }

  if (isBoxLine(line)) {
    return paintBoxLine(line, options.color === true);
  }

  if (line === 'React Native Micro Frontend CLI') {
    return `${paint('✦', cyan, options.color === true)} ${paint(
      line,
      boldCyan,
      options.color === true,
    )}`;
  }

  if (
    /^(Usage|Commands|Options|Related configs\/files|Examples|Helpful examples):$/.test(
      line,
    )
  ) {
    return paint(line, boldCyan, options.color === true);
  }

  const commandExample = /^(?: {2})?(rnm\s.+)$/.exec(line);
  if (commandExample) {
    const indent = line.startsWith('  ') ? '  ' : '';
    return `${indent}${paint(commandExample[1] ?? '', cyan, options.color === true)}`;
  }

  const optionLine =
    /^ {2}(--?[A-Za-z0-9][^ ]*(?:, --?[A-Za-z0-9][^ ]*)?)(\s+)(.+)$/.exec(line);
  if (optionLine) {
    return `  ${paint(optionLine[1] ?? '', cyan, options.color === true)}${optionLine[2] ?? ''}${optionLine[3] ?? ''}`;
  }

  const listLine = /^ {2}- (.+)$/.exec(line);
  if (listLine) {
    return `  ${paint('•', dim, options.color === true)} ${listLine[1]}`;
  }

  return line;
}

function formatTaggedLine(
  rawLevel: string,
  message: string,
  color: boolean,
): string {
  const style = levelStyle(rawLevel);
  const label = style.label.padEnd(8);
  const body = message.length > 0 ? ` ${message}` : '';
  return `${paint(style.symbol, style.paint, color)} ${paint(
    label,
    compose(style.paint, bold),
    color,
  )}${paint('│', dim, color)}${body}`;
}

function levelStyle(level: string): LevelStyle {
  switch (level) {
    case 'OK':
      return { label: 'done', symbol: '✓', paint: green };
    case 'WARN':
      return { label: 'warn', symbol: '⚠', paint: yellow };
    case 'FAIL':
    case 'ERROR':
      return { label: 'error', symbol: '✖', paint: red };
    case 'PLAN':
      return { label: 'plan', symbol: '◆', paint: blue };
    case 'SKIP':
      return { label: 'skip', symbol: '↷', paint: gray };
    case 'RUN':
      return { label: 'run', symbol: '▶', paint: cyan };
    case 'DRY-RUN':
      return { label: 'dry-run', symbol: '◇', paint: magenta };
    case 'ROLLBACK':
      return { label: 'rollback', symbol: '↩', paint: yellow };
    default:
      return { label: level.toLowerCase(), symbol: '•', paint: gray };
  }
}

function paintBoxLine(line: string, color: boolean): string {
  if (!color) return line;
  if (/OTA DISABLED|MFE BLOCKED|BLOCKED|DISABLED/.test(line)) {
    return yellow(bold(line));
  }
  if (/Build new|Submit to|Native binary|missing from/.test(line)) {
    return bold(line);
  }
  return dim(line);
}

function isBoxLine(line: string): boolean {
  return /^[┌├└│]/.test(line);
}

function shouldUseColor(): boolean {
  if (process.env.NO_COLOR) return false;
  if (process.env.FORCE_COLOR && process.env.FORCE_COLOR !== '0') return true;
  return Boolean(process.stdout.isTTY);
}

function paint(message: string, painter: Paint, enabled: boolean): string {
  return enabled ? painter(message) : message;
}

function compose(first: Paint, second: Paint): Paint {
  return (message) => first(second(message));
}

function ansi(open: number, close: number): Paint {
  return (message) => `\u001B[${open}m${message}\u001B[${close}m`;
}

const bold = ansi(1, 22);
const dim = ansi(2, 22);
const red = ansi(31, 39);
const green = ansi(32, 39);
const yellow = ansi(33, 39);
const blue = ansi(34, 39);
const magenta = ansi(35, 39);
const cyan = ansi(36, 39);
const gray = ansi(90, 39);

const boldCyan = compose(cyan, bold);
