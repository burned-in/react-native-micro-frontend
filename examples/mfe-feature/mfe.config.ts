import { defineMfeConfig } from "@bunin/react-native-micro-frontend";

export default defineMfeConfig({
  name: "mfe-feature",
  version: "1.0.0",
  entry: "./src/index.tsx",
  reactNative: { minVersion: "0.70.0", hermes: "required", newArchitecture: "supported" },
  ota: { enabled: true, mode: "manual" },
  nativeChangePolicy: "ask",
  packageManager: { strategy: "follow-existing-project" },
  package: { sync: "manual", sharedStrategy: "strict-singleton", dependencies: {} },
  ios: { pods: [], mode: "manual" },
  android: { gradleProjects: [], permissions: [], mode: "manual" },
});
