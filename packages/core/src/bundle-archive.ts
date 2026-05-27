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
export interface MicroFrontendBundleArchiveLoaderOptions<TModule> {
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
}

/**
 * Creates a Host custom loader that reads/downloads, gunzips, untars, verifies,
 * and evaluates an `rnm bundle` archive.
 *
 * React Native Hosts should usually provide `readArchive` and may provide
 * `gunzip`/`evaluate` to bridge app-controlled native storage and the selected
 * OTA runtime engine. Bun/Node tests and CLIs can use the defaults for local
 * file, file://, and http(s) archive URLs.
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
      : readBundleArchive(manifest, options.hostRoot)),
  );
  const tarBytes = await (options.gunzip ?? gunzipArchive)(archiveBytes);
  const files = extractTarFiles(tarBytes);
  const archiveManifest = readBundleManifest(files, manifest);
  const bundlePath = archiveManifest.bundleFile;
  const bundleBytes = files.get(bundlePath);

  if (!bundleBytes) {
    throw new Error(`Bundle archive is missing ${bundlePath}.`);
  }

  const bundleCode = decodeUtf8(bundleBytes);

  if (options.evaluate) {
    return await options.evaluate({
      manifest,
      archiveManifest,
      files,
      bundleCode,
    });
  }

  return evaluateCommonJsBundle<TModule>({
    manifest,
    archiveManifest,
    bundleCode,
    ...(options.externalModules !== undefined
      ? { externalModules: options.externalModules }
      : {}),
    ...(options.require !== undefined ? { require: options.require } : {}),
    ...(options.globalObject !== undefined
      ? { globalObject: options.globalObject }
      : {}),
    ...(options.moduleGlobalName !== undefined
      ? { moduleGlobalName: options.moduleGlobalName }
      : {}),
  });
}

async function readBundleArchive(
  manifest: MfeManifest,
  hostRoot?: string,
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

  const filePath = archiveUrl.startsWith('file://')
    ? fileUrlToPath(archiveUrl)
    : resolveArchivePath(hostRoot, archiveUrl);
  const bun = getBunRuntime();

  if (bun?.file) {
    return await bun.file(filePath).arrayBuffer();
  }

  const { readFile } = await import('node:fs/promises');
  return await readFile(filePath);
}

async function gunzipArchive(bytes: Uint8Array): Promise<Uint8Array> {
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

  const { gunzipSync } = await import('node:zlib');
  return toUint8Array(gunzipSync(bytes));
}

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
  const runtimeGlobal: Record<string, unknown> = {
    ...(input.globalObject ?? {}),
  };
  const moduleGlobalName = input.moduleGlobalName ?? '__rnm_mfe_module__';
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

  runtimeGlobal.globalThis = runtimeGlobal;
  runtimeGlobal.global = runtimeGlobal;
  runtimeGlobal.self = runtimeGlobal;
  runtimeGlobal.window = runtimeGlobal;
  runtimeGlobal.module = module;
  runtimeGlobal.exports = module.exports;

  const evaluate = new Function(
    'module',
    'exports',
    'require',
    'globalThis',
    'global',
    'self',
    'window',
    '__DEV__',
    `${input.bundleCode}\n//# sourceURL=rnm://${input.manifest.name}/${input.archiveManifest.bundleFile}`,
  );

  evaluate(
    module,
    module.exports,
    requireFn,
    runtimeGlobal,
    runtimeGlobal,
    runtimeGlobal,
    runtimeGlobal,
    input.archiveManifest.dev,
  );

  const exported = hasExports(module.exports)
    ? module.exports
    : runtimeGlobal[moduleGlobalName];

  if (typeof exported === 'function') {
    return { default: exported } as TModule;
  }

  if (isRecord(exported) && 'default' in exported) {
    return exported as TModule;
  }

  throw new Error(
    `Bundle ${input.archiveManifest.name} did not export a React component module.`,
  );
}

function hasExports(value: unknown): boolean {
  if (typeof value === 'function') return true;
  if (!isRecord(value)) return false;

  return Object.keys(value).length > 0;
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

function decodeUtf8(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
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
