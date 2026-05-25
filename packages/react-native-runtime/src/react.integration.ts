import React, { createContext, useContext } from "react";
import type { ReactElement, ReactNode } from "react";
import type { MfeRegistry } from "@bunin/react-native-micro-frontend";
import { createMicroFrontendRuntime } from "./micro-frontend-runtime.js";
import type { MicroFrontendRuntime } from "./micro-frontend-runtime.js";
import type { MicroFrontendSharedState, RuntimeMfeState } from "./runtime.type.js";

const MicroFrontendContext = createContext<MicroFrontendRuntime | null>(null);

/** Props for MicroFrontendProvider. */
export interface MicroFrontendProviderProps {
  /** Registry snapshot. File-path loading is intentionally delegated to host code. */
  readonly registry: MfeRegistry;
  /** Host-owned shared state exposed to MFEs through runtime hooks. */
  readonly sharedState?: MicroFrontendSharedState;
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
export function MicroFrontendProvider(props: MicroFrontendProviderProps): ReactElement {
  return React.createElement(
    MicroFrontendContext.Provider,
    {
      value: createMicroFrontendRuntime(props.registry, props.sharedState),
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
      status: "missing",
      reason: "MicroFrontendProvider is missing.",
    };
  }

  return runtime.getMfe(name);
}

/**
 * Reads host-owned shared state provided by MicroFrontendProvider.
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
export function MicroFrontendScreen(props: MicroFrontendScreenProps): ReactElement {
  const mfe = useMicroFrontend(props.name);

  return React.createElement(
    React.Fragment,
    null,
    mfe.status === "ready" ? props.fallback : props.fallback,
  );
}
