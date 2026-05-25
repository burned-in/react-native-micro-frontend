import type { NativeContract } from "@bunin/react-native-micro-frontend";
import { parseGradleDependencies, parseGradleProjects } from "./android/gradle.parser.js";
import { parseAndroidManifestPermissions } from "./android/android-manifest.parser.js";
import { attachNativeHash } from "./hash/native-hash.calculator.js";
import { parsePodfileLock } from "./ios/podfile-lock.parser.js";
import { readNativePackageDependencies } from "./package/package-json-native-dependency.reader.js";
import { detectHermesFlag, detectNewArchitectureFlag, detectReactNativeVersion } from "./react-native/react-native-environment.detector.js";

/** Snapshot of project files used for native contract generation. */
export interface NativeContractProjectSnapshot {
  /** Parsed package.json content. */
  readonly packageJson: { readonly dependencies?: Record<string, string>; readonly devDependencies?: Record<string, string>; readonly peerDependencies?: Record<string, string> };
  /** Project-relative file contents. */
  readonly files: Readonly<Record<string, string>>;
}

/**
 * Generates a native contract from an in-memory project snapshot.
 *
 * This function is pure. Callers own file reads, which keeps parsing and hashing
 * testable and reusable in CLI, CI and future IDE integrations.
 *
 * @param snapshot Parsed package.json and relevant native file contents.
 * @returns Native contract with calculated nativeHash.
 */
export function generateNativeContract(snapshot: NativeContractProjectSnapshot): NativeContract {
  const settingsText = snapshot.files["android/settings.gradle"] ?? snapshot.files["android/settings.gradle.kts"] ?? "";
  const buildText = snapshot.files["android/app/build.gradle"] ?? snapshot.files["android/app/build.gradle.kts"] ?? "";
  const manifestText = snapshot.files["android/app/src/main/AndroidManifest.xml"] ?? "";
  const podfileLockText = snapshot.files["ios/Podfile.lock"] ?? "";
  const contract: NativeContract = {
    reactNativeVersion: detectReactNativeVersion(snapshot.packageJson),
    hermes: detectHermesFlag(snapshot.files),
    newArchitecture: detectNewArchitectureFlag(snapshot.files),
    packageDependencies: readNativePackageDependencies(snapshot.packageJson),
    ios: { pods: parsePodfileLock(podfileLockText), infoPlistKeys: {} },
    android: {
      gradleProjects: parseGradleProjects(settingsText),
      gradleDependencies: parseGradleDependencies(buildText),
      permissions: parseAndroidManifestPermissions(manifestText),
    },
  };
  return attachNativeHash(contract);
}
