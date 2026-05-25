#!/usr/bin/env bun
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  internalPackageNames,
  packageOrder,
  readJson,
} from './package-list.mjs';

const bumpKinds = new Set(['patch', 'minor', 'major']);
const rawVersion = process.argv[2];

if (!rawVersion) {
  console.error(
    'Usage: bun scripts/release/version-all.mjs <version|patch|minor|major>',
  );
  process.exit(1);
}

const rootPackagePath = 'package.json';
const rootPackageJson = readJson(rootPackagePath);
const currentVersion = rootPackageJson.version;
const nextVersion = bumpKinds.has(rawVersion)
  ? bumpVersion(currentVersion, rawVersion)
  : normalizeVersion(rawVersion);

const internalNames = internalPackageNames();

writePackageJson(rootPackagePath, {
  ...rootPackageJson,
  version: nextVersion,
});

for (const packageDir of packageOrder) {
  const packageJsonPath = join(packageDir, 'package.json');
  const packageJson = readJson(packageJsonPath);
  const updatedPackageJson = updateInternalDependencyVersions(
    {
      ...packageJson,
      version: nextVersion,
    },
    internalNames,
    nextVersion,
  );

  writePackageJson(packageJsonPath, updatedPackageJson);
  console.log(`[version] ${packageJson.name} -> ${nextVersion}`);
}

console.log(`[version] root -> ${nextVersion}`);

function bumpVersion(version, bumpKind) {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-.+)?$/.exec(version);

  if (!match) {
    throw new Error(`Cannot bump non-semver version: ${version}`);
  }

  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);

  if (bumpKind === 'major') {
    return `${major + 1}.0.0`;
  }

  if (bumpKind === 'minor') {
    return `${major}.${minor + 1}.0`;
  }

  return `${major}.${minor}.${patch + 1}`;
}

function normalizeVersion(version) {
  const normalizedVersion = version.replace(/^v/, '');

  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(normalizedVersion)) {
    throw new Error(`Invalid semver version: ${version}`);
  }

  return normalizedVersion;
}

function updateInternalDependencyVersions(packageJson, internalNames, version) {
  for (const field of [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
  ]) {
    const dependencies = packageJson[field];

    if (!dependencies) {
      continue;
    }

    for (const dependencyName of Object.keys(dependencies)) {
      if (internalNames.has(dependencyName)) {
        dependencies[dependencyName] = version;
      }
    }
  }

  return packageJson;
}

function writePackageJson(path, packageJson) {
  const previousText = readFileSync(path, 'utf8');
  const trailingNewline = previousText.endsWith('\n') ? '\n' : '';
  const nextText = JSON.stringify(packageJson, null, 2) + trailingNewline;

  writeFileSync(path, nextText);
}
