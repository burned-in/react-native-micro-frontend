import type { NativeContract, NativeContractChange } from "@bunin/react-native-micro-frontend";

/**
 * Compares host and MFE native contracts and returns binary-affecting changes.
 *
 * This function is pure and intentionally treats RN version, Hermes, New
 * Architecture and nativeHash differences as store-release blockers.
 *
 * @param host Host native contract.
 * @param mfe MFE native contract.
 * @returns Native contract changes sorted by area/key discovery order.
 */
export function detectNativeContractChanges(host: NativeContract, mfe: NativeContract): readonly NativeContractChange[] {
  const changes: NativeContractChange[] = [];
  addScalarChange(changes, "react-native", "version", host.reactNativeVersion ?? "unknown", mfe.reactNativeVersion ?? "unknown");
  addScalarChange(changes, "hermes", "enabled", host.hermes, mfe.hermes);
  addScalarChange(changes, "new-architecture", "enabled", host.newArchitecture, mfe.newArchitecture);
  diffMap(changes, "package", "packageDependencies", mapPackage(host), mapPackage(mfe));
  diffMap(changes, "ios", "pods", mapPods(host), mapPods(mfe));
  diffMap(changes, "android", "gradleProjects", mapGradleProjects(host), mapGradleProjects(mfe));
  diffMap(changes, "android", "gradleDependencies", mapGradleDeps(host), mapGradleDeps(mfe));
  diffSet(changes, "android", "permissions", new Set(host.android.permissions), new Set(mfe.android.permissions));
  if (host.nativeHash && mfe.nativeHash && host.nativeHash !== mfe.nativeHash) {
    changes.push({ area: "hash", kind: "mismatch", key: "nativeHash", hostValue: host.nativeHash, mfeValue: mfe.nativeHash, nativeBinaryChange: true });
  }
  return changes;
}

function addScalarChange(changes: NativeContractChange[], area: NativeContractChange["area"], key: string, hostValue: string, mfeValue: string): void {
  if (hostValue !== mfeValue) changes.push({ area, kind: "changed", key, hostValue, mfeValue, nativeBinaryChange: true });
}
function diffMap(changes: NativeContractChange[], area: NativeContractChange["area"], label: string, host: Map<string, string>, mfe: Map<string, string>): void {
  for (const [key, mfeValue] of mfe) {
    const hostValue = host.get(key);
    if (hostValue === undefined) changes.push({ area, kind: "added", key: `${label}.${key}`, mfeValue, nativeBinaryChange: true });
    else if (hostValue !== mfeValue) changes.push({ area, kind: "changed", key: `${label}.${key}`, hostValue, mfeValue, nativeBinaryChange: true });
  }
}
function diffSet(changes: NativeContractChange[], area: NativeContractChange["area"], label: string, host: Set<string>, mfe: Set<string>): void {
  for (const value of mfe) if (!host.has(value)) changes.push({ area, kind: "added", key: `${label}.${value}`, mfeValue: value, nativeBinaryChange: true });
}
function mapPackage(contract: NativeContract): Map<string, string> { return new Map(contract.packageDependencies.filter((dep) => dep.native).map((dep) => [dep.name, dep.version])); }
function mapPods(contract: NativeContract): Map<string, string> { return new Map(contract.ios.pods.map((pod) => [pod.name, pod.version ?? "*"])); }
function mapGradleProjects(contract: NativeContract): Map<string, string> { return new Map(contract.android.gradleProjects.map((project) => [project.name, project.path ?? "*"])); }
function mapGradleDeps(contract: NativeContract): Map<string, string> { return new Map(contract.android.gradleDependencies.map((dep) => [`${dep.configuration}:${dep.notation}`, dep.notation])); }
