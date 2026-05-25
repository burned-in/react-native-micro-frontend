/** Describes whether a runtime-sensitive React Native switch is enabled, disabled, or undetected. */
export type NativeRuntimeFlag = 'enabled' | 'disabled' | 'unknown';

/** A dependency declared by package.json that may affect the native binary. */
export interface NativePackageDependency {
  /** Package name as declared in package.json. */
  readonly name: string;
  /** Semver or workspace version range. */
  readonly version: string;
  /** Whether this package is likely to include native iOS or Android code. */
  readonly native: boolean;
  /** Human-readable reason for the native classification. */
  readonly reason: string;
}

/** A CocoaPods dependency that participates in the iOS native contract. */
export interface NativePodDependency {
  /** Pod name. */
  readonly name: string;
  /** Optional resolved or requested version. */
  readonly version?: string;
  /** Whether the pod must exist in a compatible host binary. */
  readonly required: boolean;
}

/** Android Gradle project include that participates in the native contract. */
export interface NativeGradleProject {
  /** Gradle project name without a leading colon when possible. */
  readonly name: string;
  /** Relative path to the Android project. */
  readonly path?: string;
  /** Whether the project must exist in a compatible host binary. */
  readonly required: boolean;
}

/** Android native dependency string captured from Gradle files. */
export interface NativeGradleDependency {
  /** Gradle configuration such as implementation or api. */
  readonly configuration: string;
  /** Dependency notation, for example group:name:version or project(:name). */
  readonly notation: string;
}

/** Complete native contract used to decide OTA eligibility and nativeHash compatibility. */
export interface NativeContract {
  /** React Native version included in the binary contract. */
  readonly reactNativeVersion: string | null;
  /** Hermes flag included because changing JS engine requires a native binary. */
  readonly hermes: NativeRuntimeFlag;
  /** New Architecture flag included because Fabric/TurboModule mode changes native ABI expectations. */
  readonly newArchitecture: NativeRuntimeFlag;
  /** Package dependencies that may influence native autolinking. */
  readonly packageDependencies: readonly NativePackageDependency[];
  /** iOS-specific native contract surface. */
  readonly ios: {
    readonly pods: readonly NativePodDependency[];
    readonly infoPlistKeys: Readonly<Record<string, string>>;
  };
  /** Android-specific native contract surface. */
  readonly android: {
    readonly gradleProjects: readonly NativeGradleProject[];
    readonly gradleDependencies: readonly NativeGradleDependency[];
    readonly permissions: readonly string[];
  };
  /** Stable hash calculated from the contract. */
  readonly nativeHash?: string;
  /** ISO timestamp for generated snapshots. */
  readonly generatedAt?: string;
}

/** A concrete native-contract delta between an MFE and a host app. */
export interface NativeContractChange {
  /** Native surface where the change was found. */
  readonly area:
    | 'package'
    | 'ios'
    | 'android'
    | 'react-native'
    | 'hermes'
    | 'new-architecture'
    | 'hash';
  /** Machine-readable change kind. */
  readonly kind: 'added' | 'removed' | 'changed' | 'mismatch';
  /** Human-readable path or logical key. */
  readonly key: string;
  /** Host-side value. */
  readonly hostValue?: string;
  /** MFE-side value. */
  readonly mfeValue?: string;
  /** Whether this delta requires a store binary release. */
  readonly nativeBinaryChange: boolean;
}
