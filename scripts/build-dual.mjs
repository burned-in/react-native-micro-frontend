import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const external = [
  '@bunin/react-native-micro-frontend',
  '@bunin/react-native-micro-frontend-config',
  '@bunin/react-native-micro-frontend-hot-updater-adapter',
  '@bunin/react-native-micro-frontend-integration',
  '@bunin/react-native-micro-frontend-metro-adapter',
  '@bunin/react-native-micro-frontend-native-contract',
  '@bunin/react-native-micro-frontend-runtime',
  'react',
  'react-native',
];

const packages = [
  {
    root: 'packages/core',
    entries: {
      index: 'src/index.ts',
      'hot-updater': 'src/hot-updater.ts',
      'bundle-archive': 'src/bundle-archive.ts',
      runtime: 'src/runtime.ts',
      metro: 'src/metro.ts',
    },
  },
  { root: 'packages/config', entries: { index: 'src/index.ts' } },
  { root: 'packages/native-contract', entries: { index: 'src/index.ts' } },
  { root: 'packages/hot-updater-adapter', entries: { index: 'src/index.ts' } },
  { root: 'packages/metro-adapter', entries: { index: 'src/index.ts' } },
  { root: 'packages/integration', entries: { index: 'src/index.ts' } },
  { root: 'packages/react-native-runtime', entries: { index: 'src/index.ts' } },
  { root: 'packages/cli', entries: { index: 'src/index.ts' } },
];

for (const pkg of packages) {
  for (const [name, entry] of Object.entries(pkg.entries)) {
    await buildOne({
      entry: join(pkg.root, entry),
      outfile: join(pkg.root, 'dist', 'mjs', `${name}.mjs`),
      format: 'esm',
    });
    await buildOne({
      entry: join(pkg.root, entry),
      outfile: join(pkg.root, 'dist', 'cjs', `${name}.cjs`),
      format: 'cjs',
    });
  }
}

async function buildOne({ entry, outfile, format }) {
  mkdirSync(dirname(outfile), { recursive: true });
  const result = await Bun.build({
    entrypoints: [entry],
    external,
    format,
    minify: false,
    outdir: dirname(outfile),
    packages: 'external',
    sourcemap: 'external',
    target: 'node',
    naming: outfile.slice(outfile.lastIndexOf('/') + 1),
  });

  if (!result.success) {
    for (const log of result.logs) {
      console.error(log);
    }
    throw new Error(`Bun build failed for ${entry} (${format})`);
  }
}
