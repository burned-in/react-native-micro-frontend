import type { MfeManifest, MfeRegistry } from "@bunin/react-native-micro-frontend";

/** Runtime load status for a single MFE. */
export type RuntimeMfeStatus = "ready" | "loading" | "blocked" | "missing";

/** Shared host state exposed to MFEs through React context. */
export type MicroFrontendSharedState = Readonly<Record<string, unknown>>;

/** Runtime state returned by loader APIs and React hooks. */
export interface RuntimeMfeState {
  readonly name: string;
  readonly status: RuntimeMfeStatus;
  readonly manifest?: MfeManifest;
  readonly reason?: string;
}

/** Source used to initialize the runtime registry. */
export type RuntimeRegistrySource = MfeRegistry | (() => MfeRegistry | Promise<MfeRegistry>);
