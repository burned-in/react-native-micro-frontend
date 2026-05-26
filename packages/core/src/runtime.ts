import type { ComponentType, ReactElement, ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import type {
  MfeManifest,
  MfeRegistry,
  OtaProvider,
} from './domain/mfe-manifest.type.js';

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

/** Default module shape expected from an MFE entry bundle. */
export interface MicroFrontendModule<
  TProps extends object = Record<string, never>,
> {
  /** Root React component exported by the MFE entry file. */
  readonly default: ComponentType<TProps>;
}

/** Host-owned function that resolves and evaluates one MFE bundle. */
export type MicroFrontendBundleLoader<TModule> = (
  manifest: MfeManifest,
) => TModule | Promise<TModule>;

/** Loader callbacks for each supported Host bundle transport. */
export interface MicroFrontendBundleLoaders<TModule> {
  /** Loader used when `manifest.ota.provider` is `hot-updater`. */
  readonly hotUpdater?: MicroFrontendBundleLoader<TModule>;
  /** Loader used when `manifest.embeddedBundlePath` is present. */
  readonly embedded?: MicroFrontendBundleLoader<TModule>;
  /** Loader used for custom OTA URLs, keys, or provider-specific metadata. */
  readonly custom?: MicroFrontendBundleLoader<TModule>;
  /** Last-resort loader when no transport-specific callback matches. */
  readonly fallback?: MicroFrontendBundleLoader<TModule>;
}

/** Direct loader metadata overrides for apps that do not store values in config. */
export interface MicroFrontendDirectLoadOptions {
  /** Overrides `manifest.ota.provider` for this load call. */
  readonly provider?: OtaProvider;
  /** Overrides or supplies `manifest.embeddedBundlePath`. */
  readonly embeddedBundlePath?: string;
  /** Overrides or supplies `manifest.otaBundleUrl`. */
  readonly otaBundleUrl?: string;
  /** Overrides or supplies `manifest.bundleArchiveUrl`. */
  readonly bundleArchiveUrl?: string;
}

/** Host loader callbacks plus optional direct metadata overrides. */
export interface MicroFrontendLoadOptions<TModule>
  extends MicroFrontendBundleLoaders<TModule>,
    MicroFrontendDirectLoadOptions {}

/** Loader returned by createMicroFrontendLoader. */
export type ConfiguredMicroFrontendLoader<TModule> = (
  manifest: MfeManifest,
  options?: MicroFrontendLoadOptions<TModule>,
) => TModule | Promise<TModule>;

/**
 * Resolves an MFE module with a Host-provided transport implementation.
 *
 * The runtime intentionally does not download or evaluate JavaScript bundles.
 * This helper only picks the correct Host callback from registry metadata.
 *
 * Loader selection order:
 * 1. Hot Updater callback when `ota.provider` is `hot-updater`
 * 2. Custom callback when `ota.provider` is `custom`, `otaBundleUrl`, or `bundleArchiveUrl` exists
 * 3. Embedded callback when `embeddedBundlePath` exists
 * 4. Fallback callback
 *
 * @param manifest Registry manifest that passed the runtime safety gate.
 * @param loaders Host bundle transport callbacks.
 * @returns The evaluated MFE module.
 */
export async function loadMicroFrontendModule<TModule>(
  manifest: MfeManifest,
  options: MicroFrontendLoadOptions<TModule> = {},
): Promise<TModule> {
  const resolvedManifest = resolveMicroFrontendLoadManifest(manifest, options);
  const loader = selectMicroFrontendBundleLoader(resolvedManifest, options);

  if (!loader) {
    throw new Error(
      `No bundle loader configured for MFE "${resolvedManifest.name}" ` +
        `(provider: ${resolvedManifest.ota.provider}).`,
    );
  }

  return await loader(resolvedManifest);
}

/**
 * Creates a reusable Host loader with shared transport callbacks.
 *
 * Registry config is used by default. Per-call `options` can directly supply or
 * override provider, embedded path, OTA URL, or bundle archive URL when an app
 * does not store those values in `rnm.registry.json`.
 *
 * @param defaultOptions Shared Host loader callbacks and optional metadata.
 * @returns Function suitable for MicroFrontendComponent's `load` prop.
 */
export function createMicroFrontendLoader<TModule>(
  defaultOptions: MicroFrontendLoadOptions<TModule> = {},
): ConfiguredMicroFrontendLoader<TModule> {
  return (manifest, options) =>
    loadMicroFrontendModule(manifest, {
      ...defaultOptions,
      ...options,
    });
}

function resolveMicroFrontendLoadManifest(
  manifest: MfeManifest,
  options: MicroFrontendDirectLoadOptions,
): MfeManifest {
  return {
    ...manifest,
    ota: {
      ...manifest.ota,
      provider: options.provider ?? manifest.ota.provider,
    },
    ...(options.embeddedBundlePath !== undefined
      ? { embeddedBundlePath: options.embeddedBundlePath }
      : {}),
    ...(options.otaBundleUrl !== undefined
      ? { otaBundleUrl: options.otaBundleUrl }
      : {}),
    ...(options.bundleArchiveUrl !== undefined
      ? { bundleArchiveUrl: options.bundleArchiveUrl }
      : {}),
  };
}

function selectMicroFrontendBundleLoader<TModule>(
  manifest: MfeManifest,
  loaders: MicroFrontendBundleLoaders<TModule>,
): MicroFrontendBundleLoader<TModule> | undefined {
  if (manifest.ota.provider === 'hot-updater' && loaders.hotUpdater) {
    return loaders.hotUpdater;
  }

  if (
    (manifest.ota.provider === 'custom' ||
      manifest.otaBundleUrl ||
      manifest.bundleArchiveUrl) &&
    loaders.custom
  ) {
    return loaders.custom;
  }

  if (manifest.embeddedBundlePath && loaders.embedded) {
    return loaders.embedded;
  }

  return loaders.fallback;
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
 * MicroFrontendComponent marks the loaded feature subtree as an MFE
 * automatically. Host apps only need to pass `isMfe` manually for custom
 * loaders that render a feature without MicroFrontendComponent.
 *
 * @returns Whether the current provider subtree is an MFE.
 */
export function useIsMfe(): boolean {
  const runtime = useContext(MicroFrontendContext);

  return runtime?.isMfe ?? false;
}

type MicroFrontendFallback =
  | ReactNode
  | ((state: RuntimeMfeState) => ReactNode);

type MicroFrontendErrorFallback =
  | ReactNode
  | ((error: unknown, state: RuntimeMfeState) => ReactNode);

interface LoadedMicroFrontendState<TProps extends object> {
  readonly Component: ComponentType<TProps> | null;
  readonly error: unknown | null;
}

/** Props for MicroFrontendComponent. */
export interface MicroFrontendComponentProps<
  TProps extends object = Record<string, never>,
> {
  /** Registered MFE name. */
  readonly name: string;
  /** Host-owned loader that resolves `manifest` into an entry module. */
  readonly load: ConfiguredMicroFrontendLoader<MicroFrontendModule<TProps>>;
  /** Optional direct metadata overrides for this mount point. */
  readonly loadOptions?: MicroFrontendLoadOptions<MicroFrontendModule<TProps>>;
  /** Props forwarded to the loaded MFE root component. */
  readonly componentProps?: TProps;
  /** Rendered while loading or when the runtime blocks/misses the MFE. */
  readonly fallback: MicroFrontendFallback;
  /** Optional render output for loader failures. Defaults to `fallback`. */
  readonly errorFallback?: MicroFrontendErrorFallback;
}

/**
 * Mounts a registered MFE after the runtime safety gate passes.
 *
 * `useMicroFrontend()` still owns missing/blocked/nativeHash decisions. The
 * `load` prop owns Host-specific bundle transport such as Hot Updater,
 * embedded bundles, or a custom CDN loader.
 *
 * @param props Component props.
 * @returns Loaded MFE root component or fallback UI.
 */
export function MicroFrontendComponent<
  TProps extends object = Record<string, never>,
>(props: MicroFrontendComponentProps<TProps>): ReactElement {
  const runtime = useContext(MicroFrontendContext);
  const mfe = useMicroFrontend(props.name);
  const [loaded, setLoaded] = useState<LoadedMicroFrontendState<TProps>>({
    Component: null,
    error: null,
  });

  useEffect(() => {
    if (mfe.status !== 'ready' || !mfe.manifest) {
      setLoaded({ Component: null, error: null });
      return;
    }

    let mounted = true;

    setLoaded({ Component: null, error: null });
    Promise.resolve(props.load(mfe.manifest, props.loadOptions))
      .then((module) => {
        if (mounted) {
          setLoaded({ Component: module.default, error: null });
        }
      })
      .catch((error: unknown) => {
        if (mounted) {
          setLoaded({ Component: null, error });
        }
      });

    return () => {
      mounted = false;
    };
  }, [mfe.status, mfe.manifest, props.load, props.loadOptions]);

  if (mfe.status !== 'ready') {
    return React.createElement(
      React.Fragment,
      null,
      renderMicroFrontendFallback(props.fallback, mfe),
    );
  }

  if (loaded.error) {
    return React.createElement(
      React.Fragment,
      null,
      renderMicroFrontendErrorFallback(
        props.errorFallback,
        props.fallback,
        loaded.error,
        mfe,
      ),
    );
  }

  if (!loaded.Component) {
    return React.createElement(
      React.Fragment,
      null,
      renderMicroFrontendFallback(props.fallback, {
        ...mfe,
        status: 'loading',
        reason: 'MFE bundle is loading.',
      }),
    );
  }

  const componentProps = props.componentProps ?? ({} as TProps);
  const component = React.createElement(loaded.Component, componentProps);

  if (!runtime) return component;

  return React.createElement(
    MicroFrontendContext.Provider,
    {
      value: createMicroFrontendRuntime(runtime.registry, runtime.sharedState, {
        isMfe: true,
      }),
    },
    component,
  );
}

function renderMicroFrontendFallback(
  fallback: MicroFrontendFallback,
  state: RuntimeMfeState,
): ReactNode {
  return typeof fallback === 'function' ? fallback(state) : fallback;
}

function renderMicroFrontendErrorFallback(
  errorFallback: MicroFrontendErrorFallback | undefined,
  fallback: MicroFrontendFallback,
  error: unknown,
  state: RuntimeMfeState,
): ReactNode {
  if (errorFallback !== undefined) {
    return typeof errorFallback === 'function'
      ? errorFallback(error, state)
      : errorFallback;
  }

  return renderMicroFrontendFallback(fallback, {
    ...state,
    status: 'blocked',
    reason: error instanceof Error ? error.message : 'MFE bundle load failed.',
  });
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
