import type { ReactElement, ReactNode } from 'react';
import React, { createContext, useContext } from 'react';
import type { MfeManifest, MfeRegistry } from './domain/mfe-manifest.type.js';

/** Runtime load status for a single MFE. */
export type RuntimeMfeStatus = 'ready' | 'loading' | 'blocked' | 'missing';

/** Runtime state returned by loader APIs and React hooks. */
export interface RuntimeMfeState {
  /** Registered MFE name. */
  readonly name: string;
  /** Current runtime status. */
  readonly status: RuntimeMfeStatus;
  /** Registry manifest when found. */
  readonly manifest?: MfeManifest;
  /** Human-readable blocked or missing reason. */
  readonly reason?: string;
}

/** Source used to initialize the runtime registry. */
export type RuntimeRegistrySource =
  | MfeRegistry
  | (() => MfeRegistry | Promise<MfeRegistry>);

/** Shared host state exposed to MFEs through React context. */
export type MicroFrontendSharedState = Readonly<Record<string, unknown>>;

/** Runtime environment flags exposed through React hooks. */
export interface MicroFrontendRuntimeOptions {
  /** True when the current React tree is executing as an MFE mounted by a host. */
  readonly isMfe?: boolean | undefined;
}

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
 * Resolves a runtime registry from an object or lazy loader.
 *
 * @param source Registry object or async loader.
 * @returns Resolved registry.
 */
export async function resolveRuntimeRegistry(
  source: RuntimeRegistrySource,
): Promise<MfeRegistry> {
  if (typeof source === 'function') {
    return await source();
  }

  return source;
}

/**
 * Computes runtime state for one MFE from a registry.
 *
 * Runtime loading is blocked when the registry marks an MFE blocked or when its
 * nativeHash does not match the host nativeHash.
 *
 * @param registry Runtime registry.
 * @param name MFE name.
 * @returns Runtime state for the requested MFE.
 */
export function getRuntimeMfeState(
  registry: MfeRegistry,
  name: string,
): RuntimeMfeState {
  const manifest = registry.mfes[name];

  if (!manifest) {
    return {
      name,
      status: 'missing',
      reason: 'MFE is not registered.',
    };
  }

  if (manifest.status === 'blocked') {
    return {
      name,
      status: 'blocked',
      manifest,
      reason: manifest.blockedReason ?? 'MFE is blocked.',
    };
  }

  const nativeHashMismatch = Boolean(
    registry.hostNativeHash &&
      manifest.nativeHash &&
      registry.hostNativeHash !== manifest.nativeHash,
  );

  if (nativeHashMismatch) {
    return {
      name,
      status: 'blocked',
      manifest,
      reason: 'nativeHash mismatch.',
    };
  }

  return {
    name,
    status: 'ready',
    manifest,
  };
}

/**
 * Creates a runtime facade from a registry snapshot.
 *
 * @param registry Registry snapshot.
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

const MicroFrontendContext = createContext<MicroFrontendRuntime | null>(null);

/** Props for MicroFrontendProvider. */
export interface MicroFrontendProviderProps {
  /** Registry snapshot. File-path loading is intentionally delegated to host code. */
  readonly registry: MfeRegistry;
  /** Host-owned shared state exposed to MFEs through runtime hooks. */
  readonly sharedState?: MicroFrontendSharedState;
  /** Marks this provider subtree as an MFE runtime instead of the host shell. */
  readonly isMfe?: boolean | undefined;
  /** Child React tree. */
  readonly children: ReactNode;
}

/**
 * Provides a micro frontend registry to runtime hooks and screen components.
 *
 * This component has no filesystem side effects. Host apps decide whether the
 * registry comes from an embedded file, OTA metadata, or custom storage.
 *
 * @param props Provider props.
 * @returns React provider element.
 */
export function MicroFrontendProvider(
  props: MicroFrontendProviderProps,
): ReactElement {
  const runtimeOptions: MicroFrontendRuntimeOptions =
    props.isMfe === undefined ? {} : { isMfe: props.isMfe };

  return React.createElement(
    MicroFrontendContext.Provider,
    {
      value: createMicroFrontendRuntime(
        props.registry,
        props.sharedState,
        runtimeOptions,
      ),
    },
    props.children,
  );
}

/**
 * Reads one MFE runtime state from context.
 *
 * @param name Registered MFE name.
 * @returns Runtime state including blocked/missing reasons.
 */
export function useMicroFrontend(name: string): RuntimeMfeState {
  const runtime = useContext(MicroFrontendContext);

  if (!runtime) {
    return {
      name,
      status: 'missing',
      reason: 'MicroFrontendProvider is missing.',
    };
  }

  return runtime.getMfe(name);
}

/**
 * Reads host-owned shared state provided by MicroFrontendProvider.
 *
 * Use this for lightweight global state that the host intentionally exposes to
 * MFEs, such as auth session snapshots, locale, feature flags, or analytics
 * context. Mutation should stay in the host; MFEs should call host-provided
 * commands/events rather than owning the global store.
 *
 * @returns Shared host state snapshot.
 */
export function useMicroFrontendSharedState<
  TSharedState extends MicroFrontendSharedState = MicroFrontendSharedState,
>(): TSharedState {
  const runtime = useContext(MicroFrontendContext);

  if (!runtime) {
    return {} as TSharedState;
  }

  return runtime.sharedState as TSharedState;
}

/**
 * Returns true when the current component is rendered inside an MFE runtime.
 *
 * Host apps can pass `isMfe` to MicroFrontendProvider when mounting a feature
 * module. Components rendered outside the provider, or inside a host-shell
 * provider, receive `false`.
 *
 * @returns Whether the current provider subtree is an MFE.
 */
export function useIsMfe(): boolean {
  const runtime = useContext(MicroFrontendContext);

  return runtime?.isMfe ?? false;
}

/** Props for MicroFrontendScreen. */
export interface MicroFrontendScreenProps {
  /** Registered MFE name. */
  readonly name: string;
  /** Rendered when the MFE is missing, loading, or blocked. */
  readonly fallback: ReactNode;
}

/**
 * Minimal screen placeholder that enforces runtime block decisions.
 *
 * Actual bundle/component resolution is host-specific; this component keeps the
 * nativeHash/blocking contract in one place and renders fallback for unsafe MFEs.
 *
 * @param props Screen props.
 * @returns React element.
 */
export function MicroFrontendScreen(
  props: MicroFrontendScreenProps,
): ReactElement {
  const mfe = useMicroFrontend(props.name);

  if (mfe.status !== 'ready') {
    return React.createElement(React.Fragment, null, props.fallback);
  }

  return React.createElement(React.Fragment, null, props.fallback);
}
