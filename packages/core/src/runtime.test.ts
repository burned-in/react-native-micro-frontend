import { describe, expect, test } from "bun:test";
import { createMicroFrontendRuntime } from "./runtime.js";
import type { MfeRegistry } from "./domain/mfe-manifest.type.js";

describe("createMicroFrontendRuntime", () => {
  test("exposes host-owned shared state to MFE runtime consumers", () => {
    const registry: MfeRegistry = {
      schemaVersion: 1,
      hostNativeHash: "host-hash",
      mfes: {},
    };

    const sharedState = {
      session: {
        userId: "user_123",
      },
      locale: "en-US",
      featureFlags: {
        checkoutV2: true,
      },
    };

    const runtime = createMicroFrontendRuntime(registry, sharedState);

    expect(runtime.sharedState).toEqual(sharedState);
  });
});
