import { readFileSync } from "node:fs";
import { join } from "node:path";

export const packageOrder = [
  "packages/core",
  "packages/native-contract",
  "packages/hot-updater-adapter",
  "packages/metro-adapter",
  "packages/integration",
  "packages/config",
  "packages/react-native-runtime",
  "packages/cli",
];

export function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function packageNameFor(packageDir) {
  const packageJsonPath = join(packageDir, "package.json");
  const packageJson = readJson(packageJsonPath);

  return packageJson.name;
}

export function internalPackageNames() {
  return new Set(packageOrder.map((packageDir) => packageNameFor(packageDir)));
}
