import type {
  MfeManifest,
  MfeRegistry,
} from '@bunin/react-native-micro-frontend';

/** Runtime load status for a single MFE. */
export type RuntimeMfeStatus = 'ready' | 'loading' | 'blocked' | 'missing';

/** Shared host state exposed to MFEs through React context. */
export type MicroFrontendSharedState = Readonly<Record<string, unknown>>;

/** Runtime environment flags exposed through React hooks. */
export interface MicroFrontendRuntimeOptions {
  /** True when the current React tree is executing as an MFE mounted by a host. */
  readonly isMfe?: boolean | undefined;
}

/** Runtime state returned by loader APIs and React hooks. */
export interface RuntimeMfeState {
  readonly name: string;
  readonly status: RuntimeMfeStatus;
  readonly manifest?: MfeManifest;
  readonly reason?: string;
}

/** Source used to initialize the runtime registry. */
export type RuntimeRegistrySource =
  | MfeRegistry
  | (() => MfeRegistry | Promise<MfeRegistry>);
