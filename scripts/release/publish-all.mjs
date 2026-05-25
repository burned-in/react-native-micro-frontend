#!/usr/bin/env bun
import { spawnSync } from 'node:child_process';
import { packageOrder } from './package-list.mjs';

const dryRun = process.argv.includes('--dry-run');
const tagIndex = process.argv.indexOf('--tag');
const tag = tagIndex >= 0 ? process.argv[tagIndex + 1] : 'latest';
const accessIndex = process.argv.indexOf('--access');
const access = accessIndex >= 0 ? process.argv[accessIndex + 1] : 'public';

if (!tag) {
  console.error('--tag requires a tag value');
  process.exit(1);
}

if (!access) {
  console.error('--access requires public or restricted');
  process.exit(1);
}

for (const packageDir of packageOrder) {
  const args = [
    'publish',
    '--cwd',
    `./${packageDir}`,
    '--access',
    access,
    '--tag',
    tag,
  ];

  if (dryRun) {
    args.push('--dry-run');
  }

  run('bun', args);
}

console.log(
  dryRun ? '[publish] dry-run complete' : '[publish] publish complete',
);

function run(command, args) {
  console.log(`\n$ ${command} ${args.join(' ')}`);

  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      npm_config_cache:
        process.env.npm_config_cache ?? '/private/tmp/npm-cache',
    },
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
