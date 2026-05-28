import type { MfeManifest } from './domain/mfe-manifest.type.js';
import type {
  MicroFrontendBundleLoader,
  MicroFrontendModule,
} from './runtime.js';

/** Manifest stored inside an `rnm bundle` archive. */
export interface MicroFrontendBundleArchiveManifest {
  readonly schemaVersion: 1;
  readonly artifactType: 'react-native-micro-frontend-bundle';
  readonly name: string;
  readonly version: string;
  readonly platform: 'ios' | 'android';
  readonly dev: boolean;
  readonly entryFile: string;
  readonly bundleFile: string;
  readonly assetsDir: string;
  readonly createdAt: string;
  /** Metro entry module id to require after evaluating the bundle. */
  readonly entryModuleId?: string | number;
  /** Global variable used by the bundle/evaluator to expose the entry module. */
  readonly moduleGlobalName?: string;
  /** Host-owned module names that should be used instead of bundled copies. */
  readonly externalModules?: readonly string[];
  /** Shared module metadata emitted by the bundle CLI. */
  readonly sharedModules?: readonly MicroFrontendBundleArchiveSharedModule[];
  /** Shared module name to Metro module id mapping for numeric Metro bundles. */
  readonly metroModuleId?: Readonly<Record<string, string | number>>;
  /** Runtime assets collected from MFE require/import references. */
  readonly assets?: readonly MicroFrontendBundleAsset[];
}

export interface MicroFrontendBundleAsset {
  readonly id?: string | number;
  readonly sourcePath: string;
  readonly name: string;
  readonly type: string;
  readonly httpServerLocation?: string;
  readonly scales?: readonly number[];
  readonly hash?: string;
  readonly width?: number;
  readonly height?: number;
  readonly files: readonly MicroFrontendBundleAssetFile[];
}

export interface MicroFrontendBundleAssetFile {
  readonly scale?: number;
  readonly archivePath: string;
  readonly originalPath?: string;
  readonly platformPath?: string;
}

export interface MicroFrontendBundleArchiveSharedModule {
  readonly name: string;
  readonly moduleId?: string | number;
}

/** Extracted file map keyed by normalized archive-relative path. */
export type MicroFrontendBundleArchiveFiles = ReadonlyMap<string, Uint8Array>;

/** Reads or downloads the compressed archive selected by a registry manifest. */
export type MicroFrontendBundleArchiveReader = (
  manifest: MfeManifest,
) => ArrayBuffer | ArrayBufferView | Promise<ArrayBuffer | ArrayBufferView>;

/** Inflates a gzip-compressed archive payload. */
export type MicroFrontendBundleArchiveGunzip = (
  archiveBytes: Uint8Array,
) => Uint8Array | Promise<Uint8Array>;

/** Evaluates the extracted JS bundle and returns the MFE module. */
export type MicroFrontendBundleArchiveEvaluator<TModule> = (input: {
  readonly manifest: MfeManifest;
  readonly archiveManifest: MicroFrontendBundleArchiveManifest;
  readonly files: MicroFrontendBundleArchiveFiles;
  readonly bundleCode: string;
}) => TModule | Promise<TModule>;

/** Options for the built-in compressed archive loader. */
export type MicroFrontendBundleArchiveRuntime =
  | 'auto'
  | 'node'
  | 'react-native';

/** React Native asset URI or resolved asset object for a bundle archive. */
export type MicroFrontendBundleArchiveAsset =
  | string
  | { readonly uri?: string | undefined }
  | { readonly default?: string | { readonly uri?: string | undefined } }
  | null
  | undefined;

export interface MicroFrontendBundleArchiveAssetFileSystem {
  readonly cacheRoot: string | (() => string | Promise<string>);
  readonly exists?: (path: string) => boolean | Promise<boolean>;
  readonly mkdir: (path: string) => void | Promise<void>;
  readonly writeFile: (path: string, bytes: Uint8Array) => void | Promise<void>;
  readonly readFile?: (path: string) => Uint8Array | Promise<Uint8Array>;
  readonly remove?: (path: string) => void | Promise<void>;
}

export interface PreparedMicroFrontendBundleAssets {
  readonly rootPath: string;
  readonly rootUri: string;
  readonly markerPath: string;
  readonly assetsByKey: ReadonlyMap<string, string>;
}

export interface MicroFrontendBundleArchiveLoaderOptions<TModule> {
  /** Runtime guard. Defaults to auto-detecting React Native. */
  readonly runtime?: MicroFrontendBundleArchiveRuntime;
  /** Base folder used when `bundleArchiveUrl` is relative. Defaults to cwd. */
  readonly hostRoot?: string;
  /** Custom archive fetcher. Use this on React Native to bridge native FS/network. */
  readonly readArchive?: MicroFrontendBundleArchiveReader;
  /** Custom gzip inflater. Use this when the JS runtime has no native gzip API. */
  readonly gunzip?: MicroFrontendBundleArchiveGunzip;
  /** Custom evaluator. Use this to call a production OTA/runtime engine. */
  readonly evaluate?: MicroFrontendBundleArchiveEvaluator<TModule>;
  /** Modules exposed to CommonJS-style bundles during default evaluation. */
  readonly externalModules?: Readonly<Record<string, unknown>>;
  /** Custom require implementation exposed during default evaluation. */
  readonly require?: (specifier: string) => unknown;
  /** Extra globals exposed during default evaluation. */
  readonly globalObject?: Readonly<Record<string, unknown>>;
  /** Global variable fallback read after evaluation. Defaults to __rnm_mfe_module__. */
  readonly moduleGlobalName?: string;
  /** File-system adapter used to extract archive assets before JS evaluation. */
  readonly assetFileSystem?: MicroFrontendBundleArchiveAssetFileSystem;
}

const registeredReactNativeArchiveAssets = new Map<string, string>();
const registeredBundleArchiveExternalModules: Record<string, unknown> = {};
let registeredBundleArchiveAssetFileSystem:
  | MicroFrontendBundleArchiveAssetFileSystem
  | undefined;
const REACT_NATIVE_ASSET_REGISTRY_MODULE =
  'react-native/Libraries/Image/AssetRegistry';
const METRO_GLOBAL_KEYS = [
  '__r',
  '__d',
  '__c',
  '__registerSegment',
  '__METRO_GLOBAL_PREFIX__',
] as const;

/** Registers React Native asset URIs for relative bundleArchiveUrl values. */
export function registerBundleArchiveAsset(
  archiveUrl: string,
  asset: MicroFrontendBundleArchiveAsset,
): void {
  const uri = resolveBundleArchiveAssetUri(asset);

  if (!uri) return;

  for (const key of archiveUrlAliases(archiveUrl)) {
    registeredReactNativeArchiveAssets.set(key, uri);
  }
}

/** Registers multiple React Native asset URIs for relative bundleArchiveUrl values. */
export function registerBundleArchiveAssets(
  assets: Readonly<Record<string, MicroFrontendBundleArchiveAsset>>,
): void {
  for (const [archiveUrl, asset] of Object.entries(assets)) {
    registerBundleArchiveAsset(archiveUrl, asset);
  }
}

/** Registers Host-owned modules used to replace shared modules in bundle archives. */
export function registerBundleArchiveExternalModules(
  modules: Readonly<Record<string, unknown>>,
): void {
  Object.assign(registeredBundleArchiveExternalModules, modules);
}

/** Registers a Host file-system adapter used by bundle archive loaders by default. */
export function registerBundleArchiveAssetFileSystem(
  fileSystem: MicroFrontendBundleArchiveAssetFileSystem | undefined,
): void {
  registeredBundleArchiveAssetFileSystem = fileSystem;
}

/**
 * Creates a Host bundle archive loader that reads/downloads, gunzips,
 * untars, verifies, and evaluates an `rnm bundle` archive.
 *
 * React Native Hosts can use the built-in fetch/gzip/tar/Metro evaluator for
 * http(s), file, data, or blob archive URLs. Provide `readArchive` only when an
 * archive lives in app-private/native storage that fetch cannot read, and
 * provide `evaluate` only when delegating execution to a host OTA engine.
 * Bun/Node tests and CLIs can use the defaults for local file, file://, and
 * http(s) archive URLs.
 */
export function createBundleArchiveLoader<
  TModule = MicroFrontendModule<Record<string, never>>,
>(
  options: MicroFrontendBundleArchiveLoaderOptions<TModule> = {},
): MicroFrontendBundleLoader<TModule> {
  return (manifest) => loadBundleArchiveModule(manifest, options);
}

/** Reads, extracts, verifies, and evaluates one compressed bundle archive. */
export async function loadBundleArchiveModule<
  TModule = MicroFrontendModule<Record<string, never>>,
>(
  manifest: MfeManifest,
  options: MicroFrontendBundleArchiveLoaderOptions<TModule> = {},
): Promise<TModule> {
  const archiveBytes = toUint8Array(
    await (options.readArchive
      ? options.readArchive(manifest)
      : readBundleArchive(manifest, options.hostRoot, options.runtime)),
  );
  const tarBytes = await (
    options.gunzip ?? ((bytes) => gunzipArchive(bytes, options.runtime))
  )(archiveBytes);
  const files = extractTarFiles(tarBytes);
  const archiveManifest = readBundleManifest(files, manifest);
  const bundlePath = archiveManifest.bundleFile;
  const bundleBytes = files.get(bundlePath);

  if (!bundleBytes) {
    throw new Error(`Bundle archive is missing ${bundlePath}.`);
  }

  const bundleCode = decodeUtf8(bundleBytes);
  const assetFileSystem =
    options.assetFileSystem ?? registeredBundleArchiveAssetFileSystem;
  const preparedAssets = assetFileSystem
    ? await prepareBundleArchiveAssets({
        manifest,
        archiveManifest,
        archiveBytes,
        files,
        fileSystem: assetFileSystem,
      })
    : prepareInlineBundleArchiveAssets(archiveManifest, files);

  if (options.evaluate) {
    return await options.evaluate({
      manifest,
      archiveManifest,
      files,
      bundleCode,
    });
  }

  const externalModules = patchReactNativeAssetResolver(
    resolveBundleArchiveExternalModules(options.externalModules),
    archiveManifest,
    preparedAssets,
  );

  return evaluateCommonJsBundle<TModule>({
    manifest,
    archiveManifest,
    bundleCode,
    ...(externalModules !== undefined ? { externalModules } : {}),
    ...(options.require !== undefined ? { require: options.require } : {}),
    ...(options.globalObject !== undefined
      ? { globalObject: options.globalObject }
      : {}),
    ...(options.moduleGlobalName !== undefined
      ? { moduleGlobalName: options.moduleGlobalName }
      : {}),
  });
}

function resolveBundleArchiveExternalModules(
  externalModules: Readonly<Record<string, unknown>> | undefined,
): Readonly<Record<string, unknown>> | undefined {
  const registeredEntries = Object.entries(
    registeredBundleArchiveExternalModules,
  );

  if (registeredEntries.length === 0) return externalModules;

  return {
    ...registeredBundleArchiveExternalModules,
    ...(externalModules ?? {}),
  };
}

/** Creates a Node/Bun-compatible file-system adapter for bundle asset extraction. */
export function createDefaultRnmAssetFileSystem(
  cacheRoot = '.rnm-assets-cache',
): MicroFrontendBundleArchiveAssetFileSystem {
  return {
    cacheRoot,
    async exists(path) {
      const { existsSync } =
        await importNodeBuiltin<typeof import('node:fs')>('fs');
      return existsSync(path);
    },
    async mkdir(path) {
      const { mkdir } =
        await importNodeBuiltin<typeof import('node:fs/promises')>(
          'fs/promises',
        );
      await mkdir(path, { recursive: true });
    },
    async writeFile(path, bytes) {
      const { dirname } =
        await importNodeBuiltin<typeof import('node:path')>('path');
      const { mkdir, writeFile } =
        await importNodeBuiltin<typeof import('node:fs/promises')>(
          'fs/promises',
        );
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, bytes);
    },
    async readFile(path) {
      const { readFile } =
        await importNodeBuiltin<typeof import('node:fs/promises')>(
          'fs/promises',
        );
      return toUint8Array(await readFile(path));
    },
    async remove(path) {
      const { rm } =
        await importNodeBuiltin<typeof import('node:fs/promises')>(
          'fs/promises',
        );
      await rm(path, { force: true, recursive: true });
    },
  };
}

/** Creates a React Native file-system adapter backed by `react-native-blob-util`. */
export function createReactNativeBlobUtilAssetFileSystem(
  blobUtilModule: unknown,
  cacheRoot?: string,
): MicroFrontendBundleArchiveAssetFileSystem {
  const blobUtil = resolveReactNativeBlobUtilModule(blobUtilModule);
  const blobFs = resolveReactNativeBlobUtilFs(blobUtil);
  const resolvedCacheRoot =
    cacheRoot ??
    readNestedString(blobFs, ['dirs', 'CacheDir']) ??
    readNestedString(blobFs, ['dirs', 'DocumentDir']);

  if (!resolvedCacheRoot) {
    throw new Error(
      'react-native-blob-util did not expose fs.dirs.CacheDir or fs.dirs.DocumentDir.',
    );
  }

  const exists = async (path: string): Promise<boolean> =>
    Boolean(await callBlobUtilFsMethod(blobFs, 'exists', path));
  const mkdir = async (path: string): Promise<void> => {
    if (await exists(path)) return;
    try {
      await callBlobUtilFsMethod(blobFs, 'mkdir', path);
    } catch (error) {
      if (!(await exists(path))) throw error;
    }
  };

  return {
    cacheRoot: resolvedCacheRoot,
    exists,
    mkdir,
    async writeFile(path, bytes) {
      const parent = runtimeDirname(path);
      if (parent && parent !== path) await mkdir(parent);
      await callBlobUtilFsMethod(
        blobFs,
        'writeFile',
        path,
        base64Encode(bytes),
        'base64',
      );
    },
    async readFile(path) {
      const encoded = await callBlobUtilFsMethod(
        blobFs,
        'readFile',
        path,
        'base64',
      );
      if (typeof encoded !== 'string') {
        throw new Error(
          `react-native-blob-util readFile(${path}) did not return a base64 string.`,
        );
      }
      return base64Decode(encoded);
    },
    async remove(path) {
      try {
        await callBlobUtilFsMethod(blobFs, 'unlink', path);
      } catch {
        // Removing a cache path is best-effort because old extractions may not exist.
      }
    },
  };
}

async function prepareBundleArchiveAssets(input: {
  readonly manifest: MfeManifest;
  readonly archiveManifest: MicroFrontendBundleArchiveManifest;
  readonly archiveBytes: Uint8Array;
  readonly files: MicroFrontendBundleArchiveFiles;
  readonly fileSystem: MicroFrontendBundleArchiveAssetFileSystem;
}): Promise<PreparedMicroFrontendBundleAssets | undefined> {
  const assets = input.archiveManifest.assets ?? [];
  if (assets.length === 0) return undefined;

  const cacheRoot = await resolveAssetCacheRoot(input.fileSystem.cacheRoot);
  const bundleHash = hashBytes(input.archiveBytes);
  const rootPath = joinRuntimePath(
    cacheRoot,
    'rnm-assets',
    safePathSegment(input.archiveManifest.name),
    safePathSegment(input.archiveManifest.version),
    input.archiveManifest.platform,
    bundleHash,
  );
  const markerPath = joinRuntimePath(rootPath, '.rnm-assets-ready.json');
  const marker = {
    name: input.archiveManifest.name,
    version: input.archiveManifest.version,
    platform: input.archiveManifest.platform,
    bundleHash,
    assetCount: assets.length,
  };

  if (await assetFileExists(input.fileSystem, markerPath)) {
    return createPreparedAssetMap(rootPath, markerPath, assets);
  }

  const tempRoot = `${rootPath}.tmp-${Date.now().toString(36)}`;
  if (input.fileSystem.remove) await input.fileSystem.remove(tempRoot);
  await input.fileSystem.mkdir(tempRoot);

  for (const asset of assets) {
    for (const file of asset.files) {
      const bytes = input.files.get(normalizeArchivePath(file.archivePath));
      if (!bytes) {
        throw new Error(
          `Bundle archive asset is missing ${file.archivePath} for ${asset.sourcePath}.`,
        );
      }
      await input.fileSystem.writeFile(
        joinRuntimePath(tempRoot, file.archivePath),
        bytes,
      );
    }
  }

  await input.fileSystem.writeFile(
    joinRuntimePath(tempRoot, '.rnm-assets-ready.json'),
    encodeUtf8(`${JSON.stringify(marker, null, 2)}\n`),
  );

  if (input.fileSystem.remove) await input.fileSystem.remove(rootPath);

  // The adapter intentionally stays small; without a native rename primitive we
  // copy from the completed temp tree into the deterministic final tree and write
  // the marker last, so readers only reuse fully marked extractions.
  for (const asset of assets) {
    for (const file of asset.files) {
      const bytes = input.files.get(normalizeArchivePath(file.archivePath));
      if (!bytes) continue;
      await input.fileSystem.writeFile(
        joinRuntimePath(rootPath, file.archivePath),
        bytes,
      );
    }
  }
  await input.fileSystem.writeFile(
    markerPath,
    encodeUtf8(`${JSON.stringify(marker, null, 2)}\n`),
  );
  if (input.fileSystem.remove) await input.fileSystem.remove(tempRoot);

  return createPreparedAssetMap(rootPath, markerPath, assets);
}

function createPreparedAssetMap(
  rootPath: string,
  markerPath: string,
  assets: readonly MicroFrontendBundleAsset[],
): PreparedMicroFrontendBundleAssets {
  const assetsByKey = new Map<string, string>();
  for (const asset of assets) {
    const primary = asset.files[0];
    if (!primary) continue;
    const uri = pathToFileUri(joinRuntimePath(rootPath, primary.archivePath));
    for (const key of assetLookupKeys(asset)) {
      assetsByKey.set(key, uri);
    }
    for (const file of asset.files) {
      assetsByKey.set(
        normalizeArchivePath(file.archivePath),
        pathToFileUri(joinRuntimePath(rootPath, file.archivePath)),
      );
    }
  }

  return {
    rootPath,
    rootUri: pathToFileUri(rootPath),
    markerPath,
    assetsByKey,
  };
}

function prepareInlineBundleArchiveAssets(
  archiveManifest: MicroFrontendBundleArchiveManifest,
  files: MicroFrontendBundleArchiveFiles,
): PreparedMicroFrontendBundleAssets | undefined {
  const assets = archiveManifest.assets ?? [];
  if (assets.length === 0) return undefined;

  const assetsByKey = new Map<string, string>();
  for (const asset of assets) {
    const primary = asset.files[0];
    if (!primary) continue;
    const primaryBytes = files.get(normalizeArchivePath(primary.archivePath));
    if (!primaryBytes) continue;
    const primaryUri = bytesToDataUri(primaryBytes, mimeTypeForAsset(asset));

    for (const key of assetLookupKeys(asset)) {
      assetsByKey.set(key, primaryUri);
    }

    for (const file of asset.files) {
      const bytes = files.get(normalizeArchivePath(file.archivePath));
      if (!bytes) continue;
      assetsByKey.set(
        normalizeArchivePath(file.archivePath),
        bytesToDataUri(bytes, mimeTypeForArchivePath(file.archivePath)),
      );
    }
  }

  return assetsByKey.size > 0
    ? {
        rootPath: 'inline',
        rootUri: 'data:',
        markerPath: 'inline',
        assetsByKey,
      }
    : undefined;
}

function patchReactNativeAssetResolver(
  externalModules: Readonly<Record<string, unknown>> | undefined,
  archiveManifest: MicroFrontendBundleArchiveManifest,
  preparedAssets: PreparedMicroFrontendBundleAssets | undefined,
): Readonly<Record<string, unknown>> | undefined {
  if (!preparedAssets || !externalModules) {
    return externalModules;
  }

  const reactNative = isRecord(externalModules['react-native'])
    ? externalModules['react-native']
    : undefined;
  const assetRegistryModule =
    externalModules[REACT_NATIVE_ASSET_REGISTRY_MODULE];
  const assetRegistry =
    resolveAssetRegistryObject(assetRegistryModule) ??
    resolveReactNativeAssetRegistry(reactNative) ??
    {};
  const resolveHostImage = createReactNativeImageResolver(reactNative);
  const runtimeRegisteredAssetUris = new Map<string, string>();
  const patchedAssetRegistry = patchAssetRegistryForPreparedAssets(
    assetRegistry,
    archiveManifest,
    preparedAssets,
    runtimeRegisteredAssetUris,
  );
  const resolveFromPrepared = (source: unknown): unknown => {
    if (
      (typeof source === 'number' || typeof source === 'string') &&
      runtimeRegisteredAssetUris.has(String(source))
    ) {
      return { uri: runtimeRegisteredAssetUris.get(String(source)) };
    }

    const uri = resolvePreparedAssetUri(
      source,
      archiveManifest,
      preparedAssets,
    );
    if (uri) {
      return isRecord(source) ? { ...source, uri } : { uri };
    }

    const image = resolveHostImage();
    const originalResolve = isRecord(image)
      ? image.resolveAssetSource
      : undefined;

    return typeof originalResolve === 'function'
      ? originalResolve.call(image, source)
      : source;
  };

  return {
    ...externalModules,
    ...(reactNative
      ? {
          'react-native': patchReactNativeModuleExport(
            reactNative,
            createPatchedImageModule(resolveHostImage, resolveFromPrepared),
            patchedAssetRegistry,
          ),
        }
      : {}),
    ...(assetRegistryModule !== undefined
      ? {
          [REACT_NATIVE_ASSET_REGISTRY_MODULE]: patchAssetRegistryModuleExport(
            assetRegistryModule,
            patchedAssetRegistry,
          ),
        }
      : {}),
  };
}

function createReactNativeImageResolver(
  reactNative: Readonly<Record<string, unknown>> | undefined,
): () => unknown {
  let resolved = false;
  let image: unknown;

  return () => {
    if (!resolved) {
      image = isObjectLike(reactNative?.Image) ? reactNative.Image : {};
      resolved = true;
    }
    return image;
  };
}

function resolveReactNativeAssetRegistry(
  reactNative: Readonly<Record<string, unknown>> | undefined,
): Readonly<Record<string, unknown>> | undefined {
  if (!reactNative) return undefined;
  const assetRegistry = reactNative.AssetRegistry;
  return isRecord(assetRegistry) ? assetRegistry : undefined;
}

function patchReactNativeModuleExport(
  reactNative: Readonly<Record<string, unknown>>,
  patchedImage: unknown,
  patchedAssetRegistry: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  return cloneObjectWithValueOverrides(reactNative, {
    Image: patchedImage,
    AssetRegistry: patchedAssetRegistry,
  });
}

function createPatchedImageModule(
  resolveImage: () => unknown,
  resolveAssetSource: (source: unknown) => unknown,
): unknown {
  const patchedImage = function patchedReactNativeImage(
    this: unknown,
    ...args: unknown[]
  ) {
    const image = resolveImage();
    if (typeof image === 'function') {
      return image.apply(this, args);
    }
    return undefined;
  };

  if (typeof Proxy === 'function') {
    return new Proxy(patchedImage, {
      apply(_target, thisArgument, args) {
        const image = resolveImage();
        if (typeof image === 'function') {
          return Reflect.apply(image, thisArgument, args);
        }
        return undefined;
      },
      get(_target, property, receiver) {
        if (property === 'resolveAssetSource') return resolveAssetSource;
        const image = resolveImage();
        return isObjectLike(image)
          ? Reflect.get(image, property, receiver)
          : undefined;
      },
      getOwnPropertyDescriptor(_target, property) {
        if (property === 'resolveAssetSource') {
          return {
            configurable: true,
            enumerable: true,
            value: resolveAssetSource,
            writable: true,
          };
        }
        const image = resolveImage();
        return isObjectLike(image)
          ? Object.getOwnPropertyDescriptor(image, property)
          : undefined;
      },
      has(_target, property) {
        return (
          property === 'resolveAssetSource' ||
          (isObjectLike(resolveImage()) && property in Object(resolveImage()))
        );
      },
      ownKeys() {
        const image = resolveImage();
        const keys = isObjectLike(image) ? Reflect.ownKeys(image) : [];
        return [...new Set([...keys, 'resolveAssetSource'])];
      },
    });
  }

  return Object.assign(patchedImage, { resolveAssetSource });
}

function patchAssetRegistryForPreparedAssets(
  assetRegistry: Readonly<Record<string, unknown>>,
  archiveManifest: MicroFrontendBundleArchiveManifest,
  preparedAssets: PreparedMicroFrontendBundleAssets,
  runtimeRegisteredAssetUris: Map<string, string>,
): Readonly<Record<string, unknown>> {
  const originalRegisterAsset = assetRegistry.registerAsset;
  const originalGetAssetByID = assetRegistry.getAssetByID;
  let fallbackAssetId = 1;

  const registerAsset = (assetData: unknown): unknown => {
    const uri = resolvePreparedAssetUri(
      assetData,
      archiveManifest,
      preparedAssets,
    );
    const assetDataWithUri =
      uri && isRecord(assetData) ? { ...assetData, uri } : assetData;
    const id =
      typeof originalRegisterAsset === 'function'
        ? originalRegisterAsset.call(assetRegistry, assetDataWithUri)
        : fallbackAssetId++;

    if (
      uri &&
      (typeof id === 'string' ||
        typeof id === 'number' ||
        typeof id === 'boolean')
    ) {
      runtimeRegisteredAssetUris.set(String(id), uri);
    }

    return id;
  };

  const getAssetByID = (id: unknown): unknown => {
    const originalAsset =
      typeof originalGetAssetByID === 'function'
        ? originalGetAssetByID.call(assetRegistry, id)
        : undefined;
    const registeredUri =
      typeof id === 'number' || typeof id === 'string'
        ? runtimeRegisteredAssetUris.get(String(id))
        : undefined;
    if (registeredUri) {
      return isRecord(originalAsset)
        ? { ...originalAsset, uri: registeredUri }
        : { uri: registeredUri };
    }

    const asset = findManifestAssetById(archiveManifest, id);
    if (asset) {
      const uri = resolvePreparedAssetUri(
        asset,
        archiveManifest,
        preparedAssets,
      );
      return uri ? { ...asset, uri } : asset;
    }

    return originalAsset;
  };

  return cloneObjectWithValueOverrides(assetRegistry, {
    registerAsset,
    getAssetByID,
  });
}

function resolveAssetRegistryObject(
  moduleValue: unknown,
): Readonly<Record<string, unknown>> | undefined {
  if (!isRecord(moduleValue)) return undefined;
  if (
    typeof moduleValue.registerAsset === 'function' ||
    typeof moduleValue.getAssetByID === 'function'
  ) {
    return moduleValue;
  }
  return isRecord(moduleValue.default) ? moduleValue.default : undefined;
}

function patchAssetRegistryModuleExport(
  moduleValue: unknown,
  patchedAssetRegistry: Readonly<Record<string, unknown>>,
): unknown {
  if (!isRecord(moduleValue)) return patchedAssetRegistry;
  if ('default' in moduleValue) {
    return cloneObjectWithDescriptorOverrides(moduleValue, {
      ...Object.getOwnPropertyDescriptors(patchedAssetRegistry),
      default: {
        configurable: true,
        enumerable: true,
        value: patchedAssetRegistry,
        writable: true,
      },
    });
  }
  return patchedAssetRegistry;
}

function cloneObjectWithValueOverrides(
  object: Readonly<Record<string, unknown>>,
  overrides: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  const descriptors = Object.fromEntries(
    Object.entries(Object.getOwnPropertyDescriptors(object)).filter(
      ([key]) => !(key in overrides),
    ),
  );
  const clone = Object.create(Object.getPrototypeOf(object)) as Record<
    string,
    unknown
  >;
  Object.defineProperties(clone, descriptors);

  for (const [key, value] of Object.entries(overrides)) {
    const descriptor = Object.getOwnPropertyDescriptor(object, key);
    Object.defineProperty(clone, key, {
      configurable: true,
      enumerable: descriptor?.enumerable ?? true,
      value,
      writable: true,
    });
  }

  return clone;
}

function cloneObjectWithDescriptorOverrides(
  object: Readonly<Record<string, unknown>>,
  overrides: PropertyDescriptorMap,
): Record<string, unknown> {
  const descriptors = Object.fromEntries(
    Object.entries(Object.getOwnPropertyDescriptors(object)).filter(
      ([key]) => !(key in overrides),
    ),
  );
  const clone = Object.create(Object.getPrototypeOf(object)) as Record<
    string,
    unknown
  >;
  Object.defineProperties(clone, descriptors);
  Object.defineProperties(clone, overrides);
  return clone;
}

function resolvePreparedAssetUri(
  source: unknown,
  archiveManifest: MicroFrontendBundleArchiveManifest,
  preparedAssets: PreparedMicroFrontendBundleAssets,
): string | undefined {
  for (const key of runtimeAssetLookupKeys(source, archiveManifest)) {
    const uri = preparedAssets.assetsByKey.get(key);
    if (uri) return uri;
  }
  return undefined;
}

function runtimeAssetLookupKeys(
  source: unknown,
  archiveManifest: MicroFrontendBundleArchiveManifest,
): readonly string[] {
  if (typeof source === 'number' || typeof source === 'string')
    return [String(source)];
  if (!isRecord(source)) return [];

  const keys: string[] = [];
  const id = source.id;
  if (typeof id === 'string' || typeof id === 'number') keys.push(String(id));

  const sourcePath = source.sourcePath;
  if (typeof sourcePath === 'string')
    keys.push(normalizeArchivePath(sourcePath));

  const name = source.name;
  const type = source.type;
  const httpServerLocation = source.httpServerLocation;
  if (typeof name === 'string' && typeof type === 'string') {
    keys.push(`${name}.${type}`);
    if (typeof httpServerLocation === 'string') {
      keys.push(`${normalizeArchivePath(httpServerLocation)}/${name}.${type}`);
      keys.push(
        `/assets/${normalizeArchivePath(httpServerLocation).replace(/^assets\//u, '')}/${name}.${type}`,
      );
    }
  }

  const matched = archiveManifest.assets?.find((asset) =>
    assetLookupKeys(asset).some((key) => keys.includes(key)),
  );
  if (matched) keys.push(...assetLookupKeys(matched));

  return [...new Set(keys)];
}

function assetLookupKeys(asset: MicroFrontendBundleAsset): readonly string[] {
  const keys = [
    asset.sourcePath,
    normalizeArchivePath(asset.sourcePath),
    `${asset.name}.${asset.type}`,
  ];
  if (asset.id !== undefined) keys.push(String(asset.id));
  if (asset.httpServerLocation) {
    keys.push(
      `${normalizeArchivePath(asset.httpServerLocation)}/${asset.name}.${asset.type}`,
    );
  }
  return [...new Set(keys)];
}

function findManifestAssetById(
  archiveManifest: MicroFrontendBundleArchiveManifest,
  id: unknown,
): MicroFrontendBundleAsset | undefined {
  return archiveManifest.assets?.find(
    (asset) => asset.id !== undefined && String(asset.id) === String(id),
  );
}

async function resolveAssetCacheRoot(
  cacheRoot: string | (() => string | Promise<string>),
): Promise<string> {
  return typeof cacheRoot === 'function' ? await cacheRoot() : cacheRoot;
}

async function assetFileExists(
  fileSystem: MicroFrontendBundleArchiveAssetFileSystem,
  path: string,
): Promise<boolean> {
  if (fileSystem.exists) return await fileSystem.exists(path);
  if (!fileSystem.readFile) return false;
  try {
    await fileSystem.readFile(path);
    return true;
  } catch {
    return false;
  }
}

function hashBytes(bytes: Uint8Array): string {
  let hash = 0x811c9dc5;
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function safePathSegment(value: string): string {
  return value.replace(/[^A-Za-z0-9._-]/gu, '_');
}

function joinRuntimePath(...parts: readonly string[]): string {
  return parts
    .filter((part) => part.length > 0)
    .join('/')
    .replace(/\/+/gu, '/');
}

function pathToFileUri(path: string): string {
  if (/^[a-z][a-z0-9+.-]*:/iu.test(path)) return path;
  return `file://${path.startsWith('/') ? '' : '/'}${path}`;
}

function runtimeDirname(path: string): string {
  const normalized = path.replace(/\/+$/u, '');
  const index = normalized.lastIndexOf('/');
  if (index <= 0) return index === 0 ? '/' : '';
  return normalized.slice(0, index);
}

function resolveReactNativeBlobUtilModule(
  moduleValue: unknown,
): Readonly<Record<string, unknown>> {
  const candidates = [
    moduleValue,
    isRecord(moduleValue) ? moduleValue.default : undefined,
  ];
  for (const candidate of candidates) {
    if (isRecord(candidate)) return candidate;
  }
  throw new Error('Expected a react-native-blob-util module object.');
}

function resolveReactNativeBlobUtilFs(
  blobUtil: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  const fs = blobUtil.fs;
  if (!isRecord(fs)) {
    throw new Error('react-native-blob-util did not expose fs.');
  }
  return fs;
}

async function callBlobUtilFsMethod(
  blobFs: Readonly<Record<string, unknown>>,
  method: string,
  ...args: readonly unknown[]
): Promise<unknown> {
  const fn = blobFs[method];
  if (typeof fn !== 'function') {
    throw new Error(`react-native-blob-util fs.${method} is not available.`);
  }
  return await fn.apply(blobFs, args);
}

function readNestedString(
  object: Readonly<Record<string, unknown>>,
  path: readonly string[],
): string | undefined {
  let current: unknown = object;
  for (const segment of path) {
    if (!isRecord(current)) return undefined;
    current = current[segment];
  }
  return typeof current === 'string' ? current : undefined;
}

function bytesToDataUri(bytes: Uint8Array, mimeType: string): string {
  return `data:${mimeType};base64,${base64Encode(bytes)}`;
}

function mimeTypeForAsset(asset: MicroFrontendBundleAsset): string {
  return mimeTypeForExtension(asset.type);
}

function mimeTypeForArchivePath(path: string): string {
  const match = path.match(/\.([A-Za-z0-9]+)$/u);
  return mimeTypeForExtension(match?.[1] ?? '');
}

function mimeTypeForExtension(extension: string): string {
  switch (extension.toLowerCase().replace(/^\./u, '')) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'svg':
      return 'image/svg+xml';
    case 'json':
      return 'application/json';
    case 'lottie':
      return 'application/zip';
    case 'pdf':
      return 'application/pdf';
    case 'ttf':
      return 'font/ttf';
    case 'otf':
      return 'font/otf';
    case 'woff':
      return 'font/woff';
    case 'woff2':
      return 'font/woff2';
    case 'mp4':
      return 'video/mp4';
    case 'mov':
      return 'video/quicktime';
    case 'mp3':
      return 'audio/mpeg';
    case 'wav':
      return 'audio/wav';
    default:
      return 'application/octet-stream';
  }
}

function base64Encode(bytes: Uint8Array): string {
  const alphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';

  for (let index = 0; index < bytes.length; index += 3) {
    const byte1 = bytes[index] ?? 0;
    const byte2 = bytes[index + 1] ?? 0;
    const byte3 = bytes[index + 2] ?? 0;
    const hasByte2 = index + 1 < bytes.length;
    const hasByte3 = index + 2 < bytes.length;
    const value = (byte1 << 16) | (byte2 << 8) | byte3;

    output += alphabet[(value >> 18) & 63] ?? '';
    output += alphabet[(value >> 12) & 63] ?? '';
    output += hasByte2 ? (alphabet[(value >> 6) & 63] ?? '') : '=';
    output += hasByte3 ? (alphabet[value & 63] ?? '') : '=';
  }

  return output;
}

function base64Decode(value: string): Uint8Array {
  const clean = value.replace(/[\t\n\f\r ]/gu, '');
  if (clean.length === 0) return new Uint8Array();

  const lookup = new Map<string, number>();
  const alphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  for (let index = 0; index < alphabet.length; index += 1) {
    lookup.set(alphabet[index] ?? '', index);
  }

  const output: number[] = [];
  for (let index = 0; index < clean.length; index += 4) {
    const c1 = clean[index] ?? 'A';
    const c2 = clean[index + 1] ?? 'A';
    const c3 = clean[index + 2] ?? '=';
    const c4 = clean[index + 3] ?? '=';
    const value1 = lookup.get(c1) ?? 0;
    const value2 = lookup.get(c2) ?? 0;
    const value3 = c3 === '=' ? 0 : (lookup.get(c3) ?? 0);
    const value4 = c4 === '=' ? 0 : (lookup.get(c4) ?? 0);
    const triplet = (value1 << 18) | (value2 << 12) | (value3 << 6) | value4;

    output.push((triplet >> 16) & 0xff);
    if (c3 !== '=') output.push((triplet >> 8) & 0xff);
    if (c4 !== '=') output.push(triplet & 0xff);
  }

  return Uint8Array.from(output);
}

function encodeUtf8(value: string): Uint8Array {
  if (typeof TextEncoder === 'function') return new TextEncoder().encode(value);
  return Uint8Array.from([...value].map((char) => char.charCodeAt(0) & 0xff));
}

async function readBundleArchive(
  manifest: MfeManifest,
  hostRoot?: string,
  runtime?: MicroFrontendBundleArchiveRuntime,
): Promise<ArrayBuffer | ArrayBufferView> {
  const archiveUrl = manifest.bundleArchiveUrl ?? manifest.otaBundleUrl;

  if (!archiveUrl) {
    throw new Error(`bundleArchiveUrl is missing for ${manifest.name}.`);
  }

  if (/^https?:\/\//u.test(archiveUrl)) {
    const response = await fetch(archiveUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to download ${archiveUrl}: ${response.status} ${response.statusText}`,
      );
    }

    return await response.arrayBuffer();
  }

  if (isReactNativeRuntime(runtime)) {
    return await readReactNativeArchiveUrl(manifest, archiveUrl);
  }

  const filePath = archiveUrl.startsWith('file://')
    ? fileUrlToPath(archiveUrl)
    : resolveArchivePath(hostRoot, archiveUrl);
  const bun = getBunRuntime();

  if (bun?.file) {
    return await bun.file(filePath).arrayBuffer();
  }

  if (!isNodeRuntime()) {
    return await readFetchArchiveUrl(manifest, archiveUrl);
  }

  const { readFile } =
    await importNodeBuiltin<typeof import('node:fs/promises')>('fs/promises');
  return await readFile(filePath);
}

async function gunzipArchive(
  bytes: Uint8Array,
  runtime?: MicroFrontendBundleArchiveRuntime,
): Promise<Uint8Array> {
  if (isReactNativeRuntime(runtime)) {
    return gunzipSyncJavaScript(bytes);
  }

  const bun = getBunRuntime();

  if (bun?.gunzipSync) {
    return toUint8Array(bun.gunzipSync(bytes));
  }

  if (typeof DecompressionStream === 'function') {
    const buffer = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(buffer).set(bytes);
    const stream = new Blob([buffer])
      .stream()
      .pipeThrough(new DecompressionStream('gzip'));
    return toUint8Array(await new Response(stream).arrayBuffer());
  }

  if (!isNodeRuntime()) {
    return gunzipSyncJavaScript(bytes);
  }

  const { gunzipSync } =
    await importNodeBuiltin<typeof import('node:zlib')>('zlib');
  return toUint8Array(gunzipSync(bytes));
}

async function readReactNativeArchiveUrl(
  manifest: MfeManifest,
  archiveUrl: string,
): Promise<ArrayBuffer> {
  const candidates = reactNativeArchiveUrlCandidates(archiveUrl);
  let lastError: unknown;

  for (const candidate of candidates) {
    try {
      return await readFetchArchiveUrl(manifest, candidate);
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    `React Native could not read bundleArchiveUrl "${archiveUrl}" for ${manifest.name}. ` +
      'Use an http(s), file, data, or blob URL, import the generated rnm.bundle-archives module, or provide readArchive for app-private/native storage. ' +
      formatCause(lastError),
  );
}

function reactNativeArchiveUrlCandidates(archiveUrl: string): string[] {
  const candidates = new Set<string>();
  const registered = resolveRegisteredBundleArchiveAssetUri(archiveUrl);

  if (registered) candidates.add(registered);

  if (/^(?:https?|file|data|blob):/u.test(archiveUrl)) {
    candidates.add(archiveUrl);
    return [...candidates];
  }

  const normalized = archiveUrl.replace(/^\.\//u, '');
  candidates.add(`file:///android_asset/${normalized}`);
  candidates.add(`file:///android_asset/${archiveUrl}`);
  candidates.add(archiveUrl);

  return [...candidates];
}

function resolveRegisteredBundleArchiveAssetUri(
  archiveUrl: string,
): string | undefined {
  for (const key of archiveUrlAliases(archiveUrl)) {
    const uri = registeredReactNativeArchiveAssets.get(key);
    if (uri) return uri;
  }

  return undefined;
}

function archiveUrlAliases(archiveUrl: string): string[] {
  const noLeadingDot = archiveUrl.replace(/^\.\//u, '');
  const withLeadingDot = noLeadingDot.startsWith('/')
    ? noLeadingDot
    : `./${noLeadingDot}`;

  return [...new Set([archiveUrl, noLeadingDot, withLeadingDot])];
}

function resolveBundleArchiveAssetUri(
  asset: MicroFrontendBundleArchiveAsset,
): string | undefined {
  if (!asset) return undefined;
  if (typeof asset === 'string') return asset;

  if ('uri' in asset && typeof asset.uri === 'string') return asset.uri;

  if ('default' in asset) {
    return resolveBundleArchiveAssetUri(asset.default);
  }

  return undefined;
}

async function readFetchArchiveUrl(
  manifest: MfeManifest,
  archiveUrl: string,
): Promise<ArrayBuffer> {
  if (typeof fetch !== 'function') {
    throw new Error(
      `No fetch implementation is available to read ${archiveUrl} for ${manifest.name}. Provide readArchive.`,
    );
  }

  const response = await fetch(archiveUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to download ${archiveUrl}: ${response.status} ${response.statusText}`,
    );
  }

  return await response.arrayBuffer();
}

function formatCause(error: unknown): string {
  if (error instanceof Error && error.message) return `Cause: ${error.message}`;
  return 'Cause: unknown fetch failure.';
}

function gunzipSyncJavaScript(bytes: Uint8Array): Uint8Array {
  if (bytes.length < 18 || bytes[0] !== 0x1f || bytes[1] !== 0x8b) {
    throw new Error('Bundle archive is not a gzip payload.');
  }

  const method = bytes[2];
  if (method !== 8) {
    throw new Error(`Unsupported gzip compression method: ${method}.`);
  }

  const flags = bytes[3] ?? 0;
  let offset = 10;

  if (flags & 0x04) {
    offset += 2 + (bytes[offset] ?? 0) + ((bytes[offset + 1] ?? 0) << 8);
  }

  if (flags & 0x08) {
    while (offset < bytes.length && bytes[offset] !== 0) offset += 1;
    offset += 1;
  }

  if (flags & 0x10) {
    while (offset < bytes.length && bytes[offset] !== 0) offset += 1;
    offset += 1;
  }

  if (flags & 0x02) offset += 2;

  const deflateEnd = bytes.length - 8;
  if (offset > deflateEnd) {
    throw new Error('Invalid gzip header.');
  }

  const output = inflateRawSyncJavaScript(bytes.subarray(offset, deflateEnd));
  const expectedSize = readUint32Le(bytes, bytes.length - 4);

  if (output.length >>> 0 !== expectedSize) {
    throw new Error(
      `Invalid gzip size: expected ${expectedSize}, got ${output.length}.`,
    );
  }

  return output;
}

function inflateRawSyncJavaScript(bytes: Uint8Array): Uint8Array {
  const bits = createBitReader(bytes);
  const output: number[] = [];
  let finalBlock = false;

  while (!finalBlock) {
    finalBlock = bits.readBits(1) === 1;
    const blockType = bits.readBits(2);

    if (blockType === 0) {
      bits.alignToByte();
      const len = bits.readBits(16);
      const nlen = bits.readBits(16);
      if (((len ^ 0xffff) & 0xffff) !== nlen) {
        throw new Error('Invalid uncompressed deflate block length.');
      }
      for (let i = 0; i < len; i += 1) output.push(bits.readBits(8));
      continue;
    }

    if (blockType === 1) {
      inflateCompressedBlock(
        bits,
        output,
        FIXED_LITERAL_LENGTH_TREE,
        FIXED_DISTANCE_TREE,
      );
      continue;
    }

    if (blockType === 2) {
      const trees = readDynamicHuffmanTrees(bits);
      inflateCompressedBlock(
        bits,
        output,
        trees.literalLengthTree,
        trees.distanceTree,
      );
      continue;
    }

    throw new Error('Unsupported reserved deflate block type.');
  }

  return Uint8Array.from(output);
}

function inflateCompressedBlock(
  bits: BitReader,
  output: number[],
  literalLengthTree: HuffmanTree,
  distanceTree: HuffmanTree,
): void {
  while (true) {
    const symbol = readHuffmanSymbol(bits, literalLengthTree);

    if (symbol < 256) {
      output.push(symbol);
      continue;
    }

    if (symbol === 256) return;

    const lengthIndex = symbol - 257;
    const baseLength = LENGTH_BASE[lengthIndex];
    const extraLengthBits = LENGTH_EXTRA[lengthIndex];

    if (baseLength === undefined || extraLengthBits === undefined) {
      throw new Error(`Invalid deflate length symbol: ${symbol}.`);
    }

    const length = baseLength + bits.readBits(extraLengthBits);
    const distanceSymbol = readHuffmanSymbol(bits, distanceTree);
    const baseDistance = DISTANCE_BASE[distanceSymbol];
    const extraDistanceBits = DISTANCE_EXTRA[distanceSymbol];

    if (baseDistance === undefined || extraDistanceBits === undefined) {
      throw new Error(`Invalid deflate distance symbol: ${distanceSymbol}.`);
    }

    const distance = baseDistance + bits.readBits(extraDistanceBits);
    if (distance <= 0 || distance > output.length) {
      throw new Error(`Invalid deflate distance: ${distance}.`);
    }

    for (let i = 0; i < length; i += 1) {
      output.push(output[output.length - distance] ?? 0);
    }
  }
}

function readDynamicHuffmanTrees(bits: BitReader): {
  readonly literalLengthTree: HuffmanTree;
  readonly distanceTree: HuffmanTree;
} {
  const literalLengthCount = bits.readBits(5) + 257;
  const distanceCount = bits.readBits(5) + 1;
  const codeLengthCount = bits.readBits(4) + 4;
  const codeLengthLengths = new Array<number>(19).fill(0);

  for (let i = 0; i < codeLengthCount; i += 1) {
    codeLengthLengths[CODE_LENGTH_ORDER[i] ?? 0] = bits.readBits(3);
  }

  const codeLengthTree = buildHuffmanTree(codeLengthLengths);
  const lengths: number[] = [];
  const total = literalLengthCount + distanceCount;

  while (lengths.length < total) {
    const symbol = readHuffmanSymbol(bits, codeLengthTree);

    if (symbol <= 15) {
      lengths.push(symbol);
      continue;
    }

    if (symbol === 16) {
      const repeat = bits.readBits(2) + 3;
      const previous = lengths[lengths.length - 1];
      if (previous === undefined) {
        throw new Error('Invalid deflate repeat code.');
      }
      for (let i = 0; i < repeat; i += 1) lengths.push(previous);
      continue;
    }

    if (symbol === 17) {
      const repeat = bits.readBits(3) + 3;
      for (let i = 0; i < repeat; i += 1) lengths.push(0);
      continue;
    }

    if (symbol === 18) {
      const repeat = bits.readBits(7) + 11;
      for (let i = 0; i < repeat; i += 1) lengths.push(0);
      continue;
    }

    throw new Error(`Invalid deflate code length symbol: ${symbol}.`);
  }

  return {
    literalLengthTree: buildHuffmanTree(lengths.slice(0, literalLengthCount)),
    distanceTree: buildHuffmanTree(lengths.slice(literalLengthCount)),
  };
}

interface BitReader {
  readonly readBits: (count: number) => number;
  readonly alignToByte: () => void;
}

function createBitReader(bytes: Uint8Array): BitReader {
  let bitOffset = 0;

  return {
    readBits(count: number): number {
      let value = 0;
      for (let i = 0; i < count; i += 1) {
        const byte = bytes[bitOffset >> 3];
        if (byte === undefined) {
          throw new Error('Unexpected end of deflate data.');
        }
        value |= ((byte >> (bitOffset & 7)) & 1) << i;
        bitOffset += 1;
      }
      return value;
    },
    alignToByte(): void {
      bitOffset = Math.ceil(bitOffset / 8) * 8;
    },
  };
}

interface HuffmanTree {
  readonly root: HuffmanNode;
}

interface HuffmanNode {
  symbol?: number;
  zero?: HuffmanNode;
  one?: HuffmanNode;
}

function buildHuffmanTree(lengths: readonly number[]): HuffmanTree {
  const root: HuffmanNode = {};
  const maxBits = lengths.reduce((max, length) => Math.max(max, length), 0);
  const blCount = new Array<number>(maxBits + 1).fill(0);

  for (const length of lengths) {
    if (length > 0) blCount[length] = (blCount[length] ?? 0) + 1;
  }

  const nextCode = new Array<number>(maxBits + 1).fill(0);
  let code = 0;
  for (let bits = 1; bits <= maxBits; bits += 1) {
    code = (code + (blCount[bits - 1] ?? 0)) << 1;
    nextCode[bits] = code;
  }

  for (let symbol = 0; symbol < lengths.length; symbol += 1) {
    const length = lengths[symbol] ?? 0;
    if (length === 0) continue;

    const canonicalCode = nextCode[length] ?? 0;
    nextCode[length] = canonicalCode + 1;
    insertHuffmanCode(root, reverseBits(canonicalCode, length), length, symbol);
  }

  return { root };
}

function insertHuffmanCode(
  root: HuffmanNode,
  code: number,
  length: number,
  symbol: number,
): void {
  let node = root;
  for (let i = 0; i < length; i += 1) {
    const bit = (code >> i) & 1;
    if (bit === 0) {
      node.zero ??= {};
      node = node.zero;
    } else {
      node.one ??= {};
      node = node.one;
    }
  }
  node.symbol = symbol;
}

function readHuffmanSymbol(bits: BitReader, tree: HuffmanTree): number {
  let node: HuffmanNode | undefined = tree.root;
  while (node) {
    if (node.symbol !== undefined) return node.symbol;
    node = bits.readBits(1) === 0 ? node.zero : node.one;
  }
  throw new Error('Invalid deflate Huffman code.');
}

function reverseBits(value: number, length: number): number {
  let reversed = 0;
  for (let i = 0; i < length; i += 1) {
    reversed = (reversed << 1) | ((value >> i) & 1);
  }
  return reversed;
}

function readUint32Le(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] ?? 0) |
      ((bytes[offset + 1] ?? 0) << 8) |
      ((bytes[offset + 2] ?? 0) << 16) |
      ((bytes[offset + 3] ?? 0) << 24)) >>>
    0
  );
}

const LENGTH_BASE = [
  3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67,
  83, 99, 115, 131, 163, 195, 227, 258,
] as const;
const LENGTH_EXTRA = [
  0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5,
  5, 5, 0,
] as const;
const DISTANCE_BASE = [
  1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769,
  1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577,
] as const;
const DISTANCE_EXTRA = [
  0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11,
  11, 12, 12, 13, 13,
] as const;
const CODE_LENGTH_ORDER = [
  16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15,
] as const;
const FIXED_LITERAL_LENGTH_TREE = buildHuffmanTree([
  ...new Array<number>(144).fill(8),
  ...new Array<number>(112).fill(9),
  ...new Array<number>(24).fill(7),
  ...new Array<number>(8).fill(8),
]);
const FIXED_DISTANCE_TREE = buildHuffmanTree(new Array<number>(32).fill(5));

function extractTarFiles(bytes: Uint8Array): Map<string, Uint8Array> {
  const files = new Map<string, Uint8Array>();
  let offset = 0;

  while (offset + 512 <= bytes.length) {
    const header = bytes.subarray(offset, offset + 512);

    if (isEmptyBlock(header)) {
      break;
    }

    const name = readTarString(header, 0, 100);
    const prefix = readTarString(header, 345, 155);
    const sizeText = readTarString(header, 124, 12).trim();
    const size = sizeText ? Number.parseInt(sizeText, 8) : 0;
    const typeFlag = header[156];
    const path = normalizeTarPath(prefix ? `${prefix}/${name}` : name);
    const dataOffset = offset + 512;
    const nextOffset = dataOffset + Math.ceil(size / 512) * 512;

    if (!Number.isFinite(size) || size < 0 || nextOffset > bytes.length) {
      throw new Error(`Invalid tar entry size for ${path}.`);
    }

    if (typeFlag === 0 || typeFlag === 48) {
      files.set(path, bytes.slice(dataOffset, dataOffset + size));
    }

    offset = nextOffset;
  }

  return files;
}

function readBundleManifest(
  files: MicroFrontendBundleArchiveFiles,
  manifest: MfeManifest,
): MicroFrontendBundleArchiveManifest {
  const manifestBytes = files.get('manifest.json');

  if (!manifestBytes) {
    throw new Error('Bundle archive is missing manifest.json.');
  }

  const archiveManifest = JSON.parse(
    decodeUtf8(manifestBytes),
  ) as MicroFrontendBundleArchiveManifest;

  if (
    archiveManifest.schemaVersion !== 1 ||
    archiveManifest.artifactType !== 'react-native-micro-frontend-bundle'
  ) {
    throw new Error('Bundle archive manifest is not an RNM bundle artifact.');
  }

  if (archiveManifest.name !== manifest.name) {
    throw new Error(
      `Bundle archive name mismatch: expected ${manifest.name}, got ${archiveManifest.name}.`,
    );
  }

  if (!archiveManifest.bundleFile) {
    throw new Error('Bundle archive manifest is missing bundleFile.');
  }

  if (
    archiveManifest.entryModuleId !== undefined &&
    typeof archiveManifest.entryModuleId !== 'string' &&
    typeof archiveManifest.entryModuleId !== 'number'
  ) {
    throw new Error(
      'Bundle archive manifest entryModuleId must be a string or number.',
    );
  }

  if (
    archiveManifest.moduleGlobalName !== undefined &&
    typeof archiveManifest.moduleGlobalName !== 'string'
  ) {
    throw new Error(
      'Bundle archive manifest moduleGlobalName must be a string.',
    );
  }

  if (
    archiveManifest.externalModules !== undefined &&
    (!Array.isArray(archiveManifest.externalModules) ||
      archiveManifest.externalModules.some((name) => typeof name !== 'string'))
  ) {
    throw new Error(
      'Bundle archive manifest externalModules must be an array of strings.',
    );
  }

  if (
    archiveManifest.sharedModules !== undefined &&
    (!Array.isArray(archiveManifest.sharedModules) ||
      archiveManifest.sharedModules.some(
        (sharedModule) =>
          !isRecord(sharedModule) ||
          typeof sharedModule.name !== 'string' ||
          (sharedModule.moduleId !== undefined &&
            typeof sharedModule.moduleId !== 'string' &&
            typeof sharedModule.moduleId !== 'number'),
      ))
  ) {
    throw new Error(
      'Bundle archive manifest sharedModules must contain name and optional moduleId fields.',
    );
  }

  if (
    archiveManifest.metroModuleId !== undefined &&
    (!isRecord(archiveManifest.metroModuleId) ||
      Object.values(archiveManifest.metroModuleId).some(
        (moduleId) =>
          typeof moduleId !== 'string' && typeof moduleId !== 'number',
      ))
  ) {
    throw new Error(
      'Bundle archive manifest metroModuleId must map module names to string or number ids.',
    );
  }

  return archiveManifest;
}

function evaluateCommonJsBundle<TModule>(input: {
  readonly manifest: MfeManifest;
  readonly archiveManifest: MicroFrontendBundleArchiveManifest;
  readonly bundleCode: string;
  readonly externalModules?: Readonly<Record<string, unknown>>;
  readonly require?: (specifier: string) => unknown;
  readonly globalObject?: Readonly<Record<string, unknown>>;
  readonly moduleGlobalName?: string;
}): TModule {
  const module = { exports: {} as unknown };
  const runtimeGlobal = globalThis as Record<string, unknown>;
  const moduleGlobalName =
    input.moduleGlobalName ??
    input.archiveManifest.moduleGlobalName ??
    '__rnm_mfe_module__';
  const metroGlobalSnapshots = snapshotGlobalProperties(
    runtimeGlobal,
    METRO_GLOBAL_KEYS,
  );
  const restoreGlobalObject = exposeTemporaryGlobals(
    runtimeGlobal,
    input.globalObject,
  );
  const moduleGlobalSnapshot = snapshotGlobalProperty(
    runtimeGlobal,
    moduleGlobalName,
  );
  const metroExternalModules = createMetroExternalModuleMap(
    input.archiveManifest,
    input.externalModules,
  );
  const restoreMetroDefineInterceptors = installMetroDefineInterceptors(
    runtimeGlobal,
    metroExternalModules,
  );
  const requireFn =
    input.require ??
    ((specifier: string) => {
      if (specifier in (input.externalModules ?? {})) {
        return input.externalModules?.[specifier];
      }

      throw new Error(
        `Bundle ${input.archiveManifest.name} requires "${specifier}" but no external module was provided.`,
      );
    });

  delete runtimeGlobal[moduleGlobalName];

  try {
    const evaluate = new Function(
      'module',
      'exports',
      'require',
      'globalThis',
      'global',
      'self',
      'window',
      '__DEV__',
      '__rnmEntryModuleId',
      '__rnmModuleGlobalName',
      `${input.bundleCode}
${createMetroEntryExportFooter()}
//# sourceURL=rnm://${input.manifest.name}/${input.archiveManifest.bundleFile}`,
    );

    const evaluated = evaluate.call(
      runtimeGlobal,
      module,
      module.exports,
      requireFn,
      runtimeGlobal,
      runtimeGlobal,
      runtimeGlobal,
      runtimeGlobal,
      input.archiveManifest.dev,
      input.archiveManifest.entryModuleId,
      moduleGlobalName,
    );
    const exported = selectBundleExport({
      archiveManifest: input.archiveManifest,
      evaluated,
      moduleExports: module.exports,
      moduleGlobal: runtimeGlobal[moduleGlobalName],
    });

    if (isReactComponentModule(exported)) {
      return exported as TModule;
    }

    if (
      input.archiveManifest.entryModuleId === undefined &&
      typeof exported === 'function'
    ) {
      return { default: exported } as TModule;
    }

    throw new Error(
      `Bundle ${input.archiveManifest.name} did not export a React component module.`,
    );
  } finally {
    restoreGlobalProperty(
      runtimeGlobal,
      moduleGlobalName,
      moduleGlobalSnapshot,
    );
    restoreMetroDefineInterceptors();
    restoreGlobalObject();
    restoreGlobalProperties(runtimeGlobal, metroGlobalSnapshots);
  }
}

function createMetroExternalModuleMap(
  archiveManifest: MicroFrontendBundleArchiveManifest,
  externalModules: Readonly<Record<string, unknown>> | undefined,
): ReadonlyMap<
  string | number,
  { readonly name: string; readonly value: unknown }
> {
  const modulesById = new Map<
    string | number,
    { readonly name: string; readonly value: unknown }
  >();

  if (!externalModules) return modulesById;

  for (const sharedModule of archiveManifest.sharedModules ?? []) {
    if (
      sharedModule.moduleId !== undefined &&
      sharedModule.name in externalModules
    ) {
      modulesById.set(sharedModule.moduleId, {
        name: sharedModule.name,
        value: externalModules[sharedModule.name],
      });
    }
  }

  for (const [name, moduleId] of Object.entries(
    archiveManifest.metroModuleId ?? {},
  )) {
    if (name in externalModules) {
      modulesById.set(moduleId, { name, value: externalModules[name] });
    }
  }

  return modulesById;
}

function installMetroDefineInterceptors(
  runtimeGlobal: Record<string, unknown>,
  externalModulesById: ReadonlyMap<
    string | number,
    { readonly name: string; readonly value: unknown }
  >,
): () => void {
  if (externalModulesById.size === 0) return () => {};

  const snapshots = [
    snapshotGlobalDescriptor(runtimeGlobal, '__d'),
    snapshotGlobalDescriptor(runtimeGlobal, '$$RNM_SHARED__d'),
  ];
  let currentDefine = runtimeGlobal.__d;

  const defineProperty = (key: string): void => {
    const descriptor = Object.getOwnPropertyDescriptor(runtimeGlobal, key);
    if (descriptor && descriptor.configurable === false) return;

    Object.defineProperty(runtimeGlobal, key, {
      configurable: true,
      enumerable: descriptor?.enumerable ?? true,
      get() {
        return currentDefine;
      },
      set(value: unknown) {
        currentDefine = wrapMetroDefine(value, externalModulesById);
      },
    });
  };

  defineProperty('__d');
  defineProperty('$$RNM_SHARED__d');

  return () => {
    for (const snapshot of snapshots.reverse()) {
      restoreGlobalDescriptor(runtimeGlobal, snapshot);
    }
  };
}

function wrapMetroDefine(
  candidate: unknown,
  externalModulesById: ReadonlyMap<
    string | number,
    { readonly name: string; readonly value: unknown }
  >,
): unknown {
  if (typeof candidate !== 'function') return candidate;

  return function defineWithHostSharedModule(
    this: unknown,
    factory: unknown,
    moduleId: string | number,
    dependencyMap?: unknown,
    ...rest: unknown[]
  ) {
    const externalModule = externalModulesById.get(moduleId);
    const nextFactory = externalModule
      ? createExternalMetroModuleFactory(
          externalModule.name,
          externalModule.value,
        )
      : factory;

    return candidate.call(this, nextFactory, moduleId, dependencyMap, ...rest);
  };
}

function createExternalMetroModuleFactory(
  name: string,
  value: unknown,
): (
  global: unknown,
  require: unknown,
  importDefault: unknown,
  importAll: unknown,
  module: { exports: unknown },
  exports: unknown,
) => void {
  return function hostSharedMetroModuleFactory(
    _global,
    _require,
    _importDefault,
    _importAll,
    module,
  ) {
    if (!module || typeof module !== 'object') {
      throw new Error(
        `Metro external module ${name} received no module object.`,
      );
    }

    module.exports = value;
  };
}

function isReactNativeRuntime(
  runtime: MicroFrontendBundleArchiveRuntime | undefined,
): boolean {
  if (runtime === 'react-native') return true;
  if (runtime === 'node') return false;

  const global = globalThis as typeof globalThis & {
    readonly navigator?: { readonly product?: string };
    readonly nativeCallSyncHook?: unknown;
    readonly __fbBatchedBridge?: unknown;
  };

  return (
    global.navigator?.product === 'ReactNative' ||
    typeof global.nativeCallSyncHook === 'function' ||
    global.__fbBatchedBridge !== undefined
  );
}

function isNodeRuntime(): boolean {
  return typeof process !== 'undefined' && Boolean(process.versions?.node);
}

function createMetroEntryExportFooter(): string {
  return `;return (() => {
  const g = globalThis;
  const metroRequire = typeof __r === 'function'
    ? __r
    : (g && typeof g.__r === 'function' ? g.__r : undefined);
  const entryModule =
    __rnmEntryModuleId !== undefined && typeof metroRequire === 'function'
      ? metroRequire(__rnmEntryModuleId)
      : undefined;
  if (
    g &&
    __rnmEntryModuleId !== undefined &&
    entryModule !== undefined
  ) {
    g[__rnmModuleGlobalName] = entryModule;
  }
  return {
    entryModule,
    globalModule: g ? g[__rnmModuleGlobalName] : undefined,
  };
})();`;
}

function selectBundleExport(input: {
  readonly archiveManifest: MicroFrontendBundleArchiveManifest;
  readonly evaluated: unknown;
  readonly moduleExports: unknown;
  readonly moduleGlobal: unknown;
}): unknown {
  const evaluated = isRecord(input.evaluated) ? input.evaluated : {};
  const entryModule = evaluated.entryModule;
  const globalModule = evaluated.globalModule ?? input.moduleGlobal;

  if (input.archiveManifest.entryModuleId !== undefined) {
    return entryModule ?? globalModule;
  }

  return (
    globalModule ??
    (hasExports(input.moduleExports) ? input.moduleExports : undefined)
  );
}

function isReactComponentModule(value: unknown): boolean {
  return (
    isRecord(value) &&
    'default' in value &&
    isReactComponentExport(value.default)
  );
}

function isReactComponentExport(value: unknown): boolean {
  if (typeof value === 'function') return true;
  if (!isRecord(value)) return false;

  return '$$typeof' in value;
}

function hasExports(value: unknown): boolean {
  if (typeof value === 'function') return true;
  if (!isRecord(value)) return false;

  return Object.keys(value).length > 0;
}

function exposeTemporaryGlobals(
  runtimeGlobal: Record<string, unknown>,
  globals: Readonly<Record<string, unknown>> | undefined,
): () => void {
  if (!globals) return () => {};

  const snapshots = Object.keys(globals).map(
    (key) => [key, snapshotGlobalProperty(runtimeGlobal, key)] as const,
  );

  for (const [key, value] of Object.entries(globals)) {
    runtimeGlobal[key] = value;
  }

  return () => {
    for (const [key, snapshot] of snapshots.reverse()) {
      restoreGlobalProperty(runtimeGlobal, key, snapshot);
    }
  };
}

function snapshotGlobalProperty(
  runtimeGlobal: Record<string, unknown>,
  key: string,
): { readonly exists: boolean; readonly value: unknown } {
  return {
    exists: Object.hasOwn(runtimeGlobal, key),
    value: runtimeGlobal[key],
  };
}

function restoreGlobalProperty(
  runtimeGlobal: Record<string, unknown>,
  key: string,
  snapshot: { readonly exists: boolean; readonly value: unknown },
): void {
  if (snapshot.exists) {
    runtimeGlobal[key] = snapshot.value;
    return;
  }

  delete runtimeGlobal[key];
}

function snapshotGlobalProperties<TKeys extends readonly string[]>(
  runtimeGlobal: Record<string, unknown>,
  keys: TKeys,
): Map<string, { readonly exists: boolean; readonly value: unknown }> {
  return new Map(
    keys.map((key) => [key, snapshotGlobalProperty(runtimeGlobal, key)]),
  );
}

function restoreGlobalProperties(
  runtimeGlobal: Record<string, unknown>,
  snapshots: ReadonlyMap<
    string,
    { readonly exists: boolean; readonly value: unknown }
  >,
): void {
  for (const [key, snapshot] of snapshots) {
    restoreGlobalProperty(runtimeGlobal, key, snapshot);
  }
}

function snapshotGlobalDescriptor(
  runtimeGlobal: Record<string, unknown>,
  key: string,
): {
  readonly key: string;
  readonly descriptor: PropertyDescriptor | undefined;
} {
  return {
    key,
    descriptor: Object.getOwnPropertyDescriptor(runtimeGlobal, key),
  };
}

function restoreGlobalDescriptor(
  runtimeGlobal: Record<string, unknown>,
  snapshot: {
    readonly key: string;
    readonly descriptor: PropertyDescriptor | undefined;
  },
): void {
  if (snapshot.descriptor) {
    Object.defineProperty(runtimeGlobal, snapshot.key, snapshot.descriptor);
    return;
  }

  delete runtimeGlobal[snapshot.key];
}

function normalizeArchivePath(path: string): string {
  return path.replaceAll('\\', '/').replace(/^\.\//u, '').replace(/^\/+/, '');
}

function normalizeTarPath(path: string): string {
  const normalized = path.replaceAll('\\', '/').replace(/^\.\//u, '');

  if (
    normalized.startsWith('/') ||
    normalized === '..' ||
    normalized.includes('/../') ||
    normalized.startsWith('../')
  ) {
    throw new Error(`Unsafe tar entry path: ${path}.`);
  }

  return normalized;
}

function readTarString(
  bytes: Uint8Array,
  start: number,
  length: number,
): string {
  const slice = bytes.subarray(start, start + length);
  const end = slice.indexOf(0);
  return decodeUtf8(end === -1 ? slice : slice.subarray(0, end));
}

function isEmptyBlock(bytes: Uint8Array): boolean {
  return bytes.every((byte) => byte === 0);
}

type TextDecoderLike = new () => {
  readonly decode: (input: ArrayBuffer | ArrayBufferView) => string;
};

function decodeUtf8(bytes: Uint8Array): string {
  const textDecoder = (globalThis as { readonly TextDecoder?: TextDecoderLike })
    .TextDecoder;

  if (typeof textDecoder === 'function') {
    return new textDecoder().decode(bytes);
  }

  return decodeUtf8JavaScript(bytes);
}

function decodeUtf8JavaScript(bytes: Uint8Array): string {
  let result = '';
  let pendingCodeUnits: number[] = [];
  let offset =
    bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? 3 : 0;

  const flush = (): void => {
    if (pendingCodeUnits.length === 0) return;
    result += String.fromCharCode(...pendingCodeUnits);
    pendingCodeUnits = [];
  };
  const appendCodePoint = (codePoint: number): void => {
    if (codePoint <= 0xffff) {
      pendingCodeUnits.push(codePoint);
    } else {
      const adjusted = codePoint - 0x10000;
      pendingCodeUnits.push(
        0xd800 + (adjusted >> 10),
        0xdc00 + (adjusted & 0x3ff),
      );
    }

    if (pendingCodeUnits.length >= 8192) flush();
  };
  const appendReplacement = (): void => appendCodePoint(0xfffd);

  while (offset < bytes.length) {
    const byte1 = bytes[offset];
    if (byte1 === undefined) break;

    if (byte1 <= 0x7f) {
      appendCodePoint(byte1);
      offset += 1;
      continue;
    }

    if (byte1 >= 0xc2 && byte1 <= 0xdf) {
      const byte2 = bytes[offset + 1];
      if (isUtf8ContinuationByte(byte2)) {
        appendCodePoint(((byte1 & 0x1f) << 6) | (byte2 & 0x3f));
        offset += 2;
        continue;
      }
    } else if (byte1 >= 0xe0 && byte1 <= 0xef) {
      const byte2 = bytes[offset + 1];
      const byte3 = bytes[offset + 2];
      if (isUtf8ContinuationByte(byte2) && isUtf8ContinuationByte(byte3)) {
        const codePoint =
          ((byte1 & 0x0f) << 12) | ((byte2 & 0x3f) << 6) | (byte3 & 0x3f);

        if (codePoint >= 0x800 && !isUtf16Surrogate(codePoint)) {
          appendCodePoint(codePoint);
          offset += 3;
          continue;
        }
      }
    } else if (byte1 >= 0xf0 && byte1 <= 0xf4) {
      const byte2 = bytes[offset + 1];
      const byte3 = bytes[offset + 2];
      const byte4 = bytes[offset + 3];
      if (
        isUtf8ContinuationByte(byte2) &&
        isUtf8ContinuationByte(byte3) &&
        isUtf8ContinuationByte(byte4)
      ) {
        const codePoint =
          ((byte1 & 0x07) << 18) |
          ((byte2 & 0x3f) << 12) |
          ((byte3 & 0x3f) << 6) |
          (byte4 & 0x3f);

        if (codePoint >= 0x10000 && codePoint <= 0x10ffff) {
          appendCodePoint(codePoint);
          offset += 4;
          continue;
        }
      }
    }

    appendReplacement();
    offset += 1;
  }

  flush();
  return result;
}

function isUtf8ContinuationByte(byte: number | undefined): byte is number {
  return byte !== undefined && byte >= 0x80 && byte <= 0xbf;
}

function isUtf16Surrogate(codePoint: number): boolean {
  return codePoint >= 0xd800 && codePoint <= 0xdfff;
}

function toUint8Array(value: ArrayBuffer | ArrayBufferView): Uint8Array {
  if (value instanceof Uint8Array) return value;
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }

  return new Uint8Array(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isObjectLike(value: unknown): value is Record<string, unknown> {
  return (
    (typeof value === 'object' && value !== null) || typeof value === 'function'
  );
}

function resolveArchivePath(
  hostRoot: string | undefined,
  archiveUrl: string,
): string {
  if (!hostRoot || isAbsolutePath(archiveUrl)) {
    return archiveUrl;
  }

  return `${hostRoot.replace(/\/+$/u, '')}/${archiveUrl.replace(/^\.\//u, '')}`;
}

function isAbsolutePath(path: string): boolean {
  return path.startsWith('/') || /^[A-Za-z]:[\\/]/u.test(path);
}

function fileUrlToPath(url: string): string {
  const parsed = new URL(url);

  if (parsed.protocol !== 'file:') {
    throw new Error(`Unsupported archive URL: ${url}.`);
  }

  return decodeURIComponent(parsed.pathname);
}

async function importNodeBuiltin<TModule>(name: string): Promise<TModule> {
  if (!isNodeRuntime()) {
    throw new Error(
      `Node builtin fallback "node:${name}" is only available in Node.js.`,
    );
  }

  // Keep Node-only fallbacks invisible to Metro; it resolves static `node:*`
  // imports even when React Native hosts provide their own archive bridges.
  const importBody = ['return', 'import(specifier)'].join(' ');
  const dynamicImport = Function('specifier', importBody) as (
    specifier: string,
  ) => Promise<TModule>;

  return await dynamicImport(`node:${name}`);
}

function getBunRuntime():
  | {
      readonly file?: (path: string) => {
        readonly arrayBuffer: () => Promise<ArrayBuffer>;
      };
      readonly gunzipSync?: (bytes: Uint8Array) => Uint8Array | ArrayBuffer;
    }
  | undefined {
  return (
    globalThis as typeof globalThis & {
      readonly Bun?: {
        readonly file?: (path: string) => {
          readonly arrayBuffer: () => Promise<ArrayBuffer>;
        };
        readonly gunzipSync?: (bytes: Uint8Array) => Uint8Array | ArrayBuffer;
      };
    }
  ).Bun;
}
