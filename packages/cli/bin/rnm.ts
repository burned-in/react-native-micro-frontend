#!/usr/bin/env bun
import { parseCliArgs } from '../src/cli-args.parser.js';
import { createConsolePrinter } from '../src/cli-output.printer.js';
import { runAddCommand } from '../src/commands/add.command.js';
import { runBuildCommand } from '../src/commands/build.command.js';
import { runDiffCommand } from '../src/commands/diff.command.js';
import { runDoctorCommand } from '../src/commands/doctor.command.js';
import { runInitCommand } from '../src/commands/init.command.js';
import { runIntegrateCommand } from '../src/commands/integrate.command.js';
import { runPublishCommand } from '../src/commands/publish.command.js';
import { runRollbackCommand } from '../src/commands/rollback.command.js';
import { runStatusCommand } from '../src/commands/status.command.js';
import { runSyncCommand } from '../src/commands/sync.command.js';
import { runVerifyCommand } from '../src/commands/verify.command.js';

const args = parseCliArgs(process.argv.slice(2));
const printer = createConsolePrinter();
const root = process.cwd();

const exitCode = (() => {
  switch (args.command) {
    case 'init':
      return runInitCommand(root, args.flags, printer);
    case 'doctor':
      return runDoctorCommand(root, printer);
    case 'status':
      return runStatusCommand(root, printer);
    case 'verify':
      return runVerifyCommand(root, args.positional[0], printer);
    case 'add':
      return runAddCommand(root, args.positional[0], args.flags, printer);
    case 'diff':
      return runDiffCommand(root, args.positional[0], printer);
    case 'sync':
      return runSyncCommand(root, args.positional[0], args.flags, printer);
    case 'build':
      return runBuildCommand(args.positional[0], args.flags, printer);
    case 'publish':
      return runPublishCommand(root, args.positional[0], args.flags, printer);
    case 'integrate':
      return runIntegrateCommand(root, args.flags, printer);
    case 'rollback':
      return runRollbackCommand(root, args.flags, printer);
    default:
      printer.log(
        'rnm commands: init, add, diff, sync, verify, build, publish, status, doctor, integrate, rollback',
      );
      return 0;
  }
})();

process.exitCode = exitCode;
