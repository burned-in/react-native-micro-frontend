import type { MfeRegistry } from "@bunin/react-native-micro-frontend";
import { getRuntimeMfeState } from "./runtime-loader.service.js";
import type { MicroFrontendSharedState, RuntimeMfeState } from "./runtime.type.js";

/** Runtime facade that can be used outside React for tests or custom hosts. */
export interface MicroFrontendRuntime {
  /** Current registry snapshot. */
  readonly registry: MfeRegistry;
  /** Shared host-owned state snapshot available to MFEs. */
  readonly sharedState: MicroFrontendSharedState;
  /** Gets MFE state by name. */
  readonly getMfe: (name: string) => RuntimeMfeState;
}

/**
 * Creates a runtime facade from a registry snapshot.
 *
 * @param registry Registry snapshot.
 * @param sharedState Host-owned shared state snapshot.
 * @returns Runtime facade with lookup helpers.
 */
export function createMicroFrontendRuntime(
  registry: MfeRegistry,
  sharedState: MicroFrontendSharedState = {},
): MicroFrontendRuntime {
  return {
    registry,
    sharedState,
    getMfe: (name) => getRuntimeMfeState(registry, name),
  };
}
