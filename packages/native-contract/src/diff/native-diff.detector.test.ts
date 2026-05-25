import { describe, expect, test } from "bun:test";
import type { NativeContract } from "@bunin/react-native-micro-frontend";
import { detectNativeContractChanges } from "./native-diff.detector.js";

const base: NativeContract = {
  reactNativeVersion: "0.76.0",
  hermes: "enabled",
  newArchitecture: "enabled",
  packageDependencies: [],
  ios: { pods: [], infoPlistKeys: {} },
  android: { gradleProjects: [], gradleDependencies: [], permissions: [] },
};

describe("detectNativeContractChanges", () => {
  test("detects Android permission additions as native binary changes", () => {
    const changes = detectNativeContractChanges(base, { ...base, android: { ...base.android, permissions: ["android.permission.CAMERA"] } });
    expect(changes).toHaveLength(1);
    expect(changes[0]?.nativeBinaryChange).toBe(true);
  });
});
