import type { MfeRegistry } from '@bunin/react-native-micro-frontend';
import type {
  MicroFrontendRuntimeOptions,
  MicroFrontendSharedState,
  RuntimeMfeState,
} from './runtime.type.js';
import { getRuntimeMfeState } from './runtime-loader.service.js';

/** Runtime facade that can be used outside React for tests or custom hosts. */
export interface MicroFrontendRuntime {
  /** Current registry snapshot. */
  readonly registry: MfeRegistry;
  /** Shared host-owned state snapshot available to MFEs. */
  readonly sharedState: MicroFrontendSharedState;
  /** True when the current tree is running as an MFE rather than the host shell. */
  readonly isMfe: boolean;
  /** Gets MFE state by name. */
  readonly getMfe: (name: string) => RuntimeMfeState;
}

/**
 * Creates a runtime facade from a registry snapshot.
 *
 * @param registry Registry snapshot.
 * @param sharedState Host-owned shared state snapshot.
 * @param options Runtime environment flags.
 * @returns Runtime facade with lookup helpers.
 */
export function createMicroFrontendRuntime(
  registry: MfeRegistry,
  sharedState: MicroFrontendSharedState = {},
  options: MicroFrontendRuntimeOptions = {},
): MicroFrontendRuntime {
  return {
    registry,
    sharedState,
    isMfe: options.isMfe ?? false,
    getMfe: (name) => getRuntimeMfeState(registry, name),
  };
}
