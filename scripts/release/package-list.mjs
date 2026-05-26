import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const packageDirs = [
  'packages/core',
  'packages/native-contract',
  'packages/hot-updater-adapter',
  'packages/metro-adapter',
  'packages/integration',
  'packages/config',
  'packages/react-native-runtime',
  'packages/cli',
];

export const packageOrder = publishOrderFor(packageDirs);

export function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function packageNameFor(packageDir) {
  const packageJsonPath = join(packageDir, 'package.json');
  const packageJson = readJson(packageJsonPath);

  return packageJson.name;
}

export function internalPackageNames() {
  return new Set(packageDirs.map((packageDir) => packageNameFor(packageDir)));
}

export function publishOrderFor(packageDirs) {
  const packageEntries = packageDirs.map((packageDir) => {
    const packageJson = readJson(join(packageDir, 'package.json'));

    return {
      dir: packageDir,
      json: packageJson,
      name: packageJson.name,
    };
  });
  const packageDirByName = new Map(
    packageEntries.map((entry) => [entry.name, entry.dir]),
  );
  const orderedDirs = [];
  const stateByDir = new Map();

  for (const entry of packageEntries) {
    visit(entry.dir, packageEntries, packageDirByName, stateByDir, orderedDirs);
  }

  return orderedDirs;
}

function visit(dir, packageEntries, packageDirByName, stateByDir, orderedDirs) {
  const state = stateByDir.get(dir);

  if (state === 'visited') {
    return;
  }

  if (state === 'visiting') {
    throw new Error(`Circular internal package dependency detected at ${dir}`);
  }

  const entry = packageEntries.find((packageEntry) => packageEntry.dir === dir);

  if (!entry) {
    throw new Error(`Unknown package directory: ${dir}`);
  }

  stateByDir.set(dir, 'visiting');

  for (const dependencyName of internalDependencyNames(entry.json)) {
    const dependencyDir = packageDirByName.get(dependencyName);

    if (dependencyDir) {
      visit(
        dependencyDir,
        packageEntries,
        packageDirByName,
        stateByDir,
        orderedDirs,
      );
    }
  }

  stateByDir.set(dir, 'visited');
  orderedDirs.push(dir);
}

function internalDependencyNames(packageJson) {
  const dependencyNames = [];

  for (const field of [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
  ]) {
    const dependencies = packageJson[field];

    if (dependencies) {
      dependencyNames.push(...Object.keys(dependencies));
    }
  }

  return dependencyNames;
}
