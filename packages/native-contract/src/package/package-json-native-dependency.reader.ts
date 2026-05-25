import type { NativePackageDependency } from "@bunin/react-native-micro-frontend";

const KNOWN_JS_ONLY = new Set(["react", "typescript", "zod", "lodash"]);

/**
 * Classifies package.json dependencies that may influence native autolinking.
 *
 * The classifier is intentionally conservative: unknown React Native-prefixed
 * packages are treated as native until a package-specific manifest says otherwise.
 * The function is pure and does not hit the package registry.
 *
 * @param packageJson Parsed package.json object.
 * @returns Dependency classifications sorted by name.
 */
export function readNativePackageDependencies(packageJson: { readonly dependencies?: Record<string, string>; readonly peerDependencies?: Record<string, string> }): readonly NativePackageDependency[] {
  const deps = { ...(packageJson.dependencies ?? {}), ...(packageJson.peerDependencies ?? {}) };
  return Object.entries(deps).map(([name, version]) => classifyDependency(name, version)).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Classifies one dependency using naming and known JS-only heuristics.
 *
 * @param name Package name.
 * @param version Version range.
 * @returns Native package dependency classification.
 */
export function classifyDependency(name: string, version: string): NativePackageDependency {
  if (KNOWN_JS_ONLY.has(name)) return { name, version, native: false, reason: "known JS-only dependency" };
  if (name === "react-native") return { name, version, native: true, reason: "React Native runtime version is native-contract critical" };
  if (name.startsWith("react-native-") || name.startsWith("@react-native") || name.startsWith("expo-") || name.startsWith("@expo/")) {
    return { name, version, native: true, reason: "React Native ecosystem package may include native code" };
  }
  return { name, version, native: false, reason: "no native signal detected" };
}
