import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import {
  basename,
  dirname,
  extname,
  join,
  relative,
  resolve,
  sep,
} from 'node:path';
import type { CliPrinter } from '../cli-output.printer.js';

export type BundleAssetPlatform = 'ios' | 'android';

export interface BundleAssetTarget {
  readonly name: string;
  readonly version?: string;
  readonly entryFile: string;
  readonly platform: BundleAssetPlatform;
  readonly outDir: string;
  readonly assetsDest: string;
  readonly bundleOutput?: string;
  readonly manifestOutput?: string;
}

export interface MicroFrontendBundleAssetFile {
  readonly scale?: number;
  readonly archivePath: string;
  readonly originalPath?: string;
  readonly platformPath?: string;
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

export interface BundleAssetResult {
  readonly assets: readonly MicroFrontendBundleAsset[];
  readonly warnings: readonly string[];
}

const requireFromCli = createRequire(import.meta.url);

const CODE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const SOURCE_EXCLUDED_EXTENSIONS = new Set([
  ...CODE_EXTENSIONS,
  '.d.ts',
  '.map',
]);
const DEFAULT_ASSET_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.svg',
  '.bmp',
  '.ico',
  '.ttf',
  '.otf',
  '.woff',
  '.woff2',
  '.json',
  '.lottie',
  '.mp4',
  '.mov',
  '.m4v',
  '.webm',
  '.mp3',
  '.wav',
  '.aac',
  '.m4a',
  '.ogg',
  '.pdf',
]);
const RESOLVE_SOURCE_EXTENSIONS = [
  '.tsx',
  '.ts',
  '.jsx',
  '.js',
  '.mjs',
  '.cjs',
];

interface AssetReference {
  readonly path: string;
  readonly kind: 'static' | 'glob';
}

interface ParsedSourceReferences {
  readonly imports: readonly string[];
  readonly dynamicRequires: readonly string[];
}

interface MetroAssetMetadata {
  readonly id?: string | number;
  readonly name: string;
  readonly type: string;
  readonly httpServerLocation?: string;
  readonly scales?: readonly number[];
  readonly hash?: string;
  readonly width?: number;
  readonly height?: number;
}

/** Handles `rnm bundle-asset <mfe-name>` without requiring MFE authors to manually register assets. */
export function runBundleAssetCommand(
  root: string,
  name: string | undefined,
  flags: Readonly<Record<string, string | boolean>>,
  printer: CliPrinter,
): number {
  const resolvedName = name ?? stringFlag(flags.name);

  if (!resolvedName) {
    printer.error(
      'Usage: rnm bundle-asset <mfe-name> [--platform ios|android|all] [--entry ./src/index.tsx] [--out-dir <dir>]',
    );
    return 1;
  }

  const platforms = platformFlags(flags.platform);
  const entryFile = stringFlag(flags.entry) ?? './src/index.tsx';
  const baseOutDir =
    stringFlag(flags['out-dir']) ?? join('dist', 'rnm-bundles');

  for (const platform of platforms) {
    const outDir = resolve(root, baseOutDir, resolvedName, platform);
    const assetsDest = join(outDir, 'assets');
    const result = bundleAssetsForTarget(
      root,
      {
        name: resolvedName,
        entryFile,
        platform,
        outDir,
        assetsDest,
        manifestOutput: join(outDir, 'asset-manifest.json'),
      },
      flags,
      printer,
    );

    if (!result) return 1;
  }

  return 0;
}

export function bundleAssetsForTarget(
  root: string,
  target: BundleAssetTarget,
  flags: Readonly<Record<string, string | boolean>>,
  printer: CliPrinter,
): BundleAssetResult | null {
  const collectResult = collectBundleAssetReferences(
    root,
    target,
    flags,
    printer,
  );

  if (!collectResult) return null;

  const metroAssets = target.bundleOutput
    ? parseMetroAssetRegistry(readExistingFile(target.bundleOutput))
    : [];
  const referencedAssets = mergeAssetReferences(
    collectResult.assets,
    inferMetroAssetReferences(root, metroAssets),
  );
  const assets = createBundleAssetManifestEntries(
    root,
    target,
    referencedAssets,
    metroAssets,
  );

  rmSync(target.assetsDest, { force: true, recursive: true });
  mkdirSync(target.assetsDest, { recursive: true });

  for (const asset of assets) {
    for (const file of asset.files) {
      if (!file.originalPath) continue;
      const source = resolve(root, file.originalPath);
      const destination = join(target.outDir, file.archivePath);
      mkdirSync(dirname(destination), { recursive: true });
      copyFileSync(source, destination);
    }
  }

  if (target.manifestOutput) {
    writeFileSync(
      target.manifestOutput,
      `${JSON.stringify({ assets }, null, 2)}\n`,
    );
  }

  for (const warning of collectResult.warnings)
    printer.log(`[WARN] ${warning}`);
  printer.log(
    `[OK] Bundle assets: ${assets.length} referenced asset(s) for ${target.name}:${target.platform}`,
  );

  return { assets, warnings: collectResult.warnings };
}

function collectBundleAssetReferences(
  root: string,
  target: BundleAssetTarget,
  flags: Readonly<Record<string, string | boolean>>,
  _printer: CliPrinter,
): {
  readonly assets: readonly AssetReference[];
  readonly warnings: readonly string[];
} | null {
  const entryPath = resolve(root, target.entryFile);

  if (!existsSync(entryPath)) {
    return {
      assets: [],
      warnings: [`Entry file was not found: ${target.entryFile}`],
    };
  }

  const warnings: string[] = [];
  const assetExtensions = resolveProjectAssetExtensions(root, flags);
  const visited = new Set<string>();
  const assetPaths = new Map<string, AssetReference>();
  const queue = [entryPath];

  while (queue.length > 0) {
    const filePath = queue.shift();
    if (!filePath || visited.has(filePath)) continue;
    visited.add(filePath);

    const parsed = parseSourceReferences(filePath);
    for (const dynamicRequire of parsed.dynamicRequires) {
      warnings.push(
        `Dynamic require could not be statically resolved in ${relativePath(root, filePath)}: ${dynamicRequire}`,
      );
    }

    for (const specifier of parsed.imports) {
      if (!isRelativeSpecifier(specifier)) continue;
      const resolved = resolveImportSpecifier(
        root,
        dirname(filePath),
        specifier,
        assetExtensions,
      );
      if (!resolved) continue;

      if (isSourceFile(resolved)) {
        queue.push(resolved);
        continue;
      }

      if (isAssetFile(resolved, assetExtensions)) {
        const normalized = relativePath(root, resolved);
        assetPaths.set(normalized, { path: normalized, kind: 'static' });
      }
    }
  }

  for (const pattern of flagValues(flags, 'asset-glob')) {
    for (const assetPath of collectGlobAssets(root, pattern, assetExtensions)) {
      assetPaths.set(assetPath, { path: assetPath, kind: 'glob' });
    }
  }

  return {
    assets: [...assetPaths.values()].sort((a, b) =>
      a.path.localeCompare(b.path),
    ),
    warnings,
  };
}

function parseSourceReferences(filePath: string): ParsedSourceReferences {
  const sourceText = readFileSync(filePath, 'utf8');
  const ts = requireTypeScript();
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    scriptKindForPath(filePath, ts),
  );
  const imports: string[] = [];
  const dynamicRequires: string[] = [];

  const visit = (node: import('typescript').Node): void => {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      imports.push(node.moduleSpecifier.text);
    } else if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      imports.push(node.moduleSpecifier.text);
    } else if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'require' &&
      node.arguments.length >= 1
    ) {
      const first = node.arguments[0];
      if (!first) return;
      if (ts.isStringLiteralLike(first)) imports.push(first.text);
      else dynamicRequires.push(first.getText(sourceFile));
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return { imports, dynamicRequires };
}

function requireTypeScript(): typeof import('typescript') {
  // TypeScript is used as the AST parser so TS/TSX/JS/JSX imports are not regex-scanned.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return requireFromCli('typescript') as typeof import('typescript');
}

function scriptKindForPath(
  filePath: string,
  ts: typeof import('typescript'),
): import('typescript').ScriptKind {
  switch (extname(filePath)) {
    case '.tsx':
      return ts.ScriptKind.TSX;
    case '.jsx':
      return ts.ScriptKind.JSX;
    case '.js':
    case '.mjs':
    case '.cjs':
      return ts.ScriptKind.JS;
    default:
      return ts.ScriptKind.TS;
  }
}

function resolveImportSpecifier(
  root: string,
  fromDir: string,
  specifier: string,
  assetExtensions: ReadonlySet<string>,
): string | undefined {
  const base = resolve(fromDir, specifier);
  const candidates = hasExtension(base)
    ? [base]
    : [
        ...RESOLVE_SOURCE_EXTENSIONS.map((extension) => `${base}${extension}`),
        ...[...assetExtensions].map((extension) => `${base}${extension}`),
        ...RESOLVE_SOURCE_EXTENSIONS.map((extension) =>
          join(base, `index${extension}`),
        ),
      ];

  for (const candidate of candidates) {
    if (!isInside(root, candidate)) continue;
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }

  return undefined;
}

function mergeAssetReferences(
  ...groups: readonly (readonly AssetReference[])[]
): readonly AssetReference[] {
  const references = new Map<string, AssetReference>();

  for (const group of groups) {
    for (const reference of group) references.set(reference.path, reference);
  }

  return [...references.values()].sort((a, b) => a.path.localeCompare(b.path));
}

function inferMetroAssetReferences(
  root: string,
  metroAssets: readonly MetroAssetMetadata[],
): readonly AssetReference[] {
  const references: AssetReference[] = [];

  for (const asset of metroAssets) {
    for (const candidate of metroAssetSourceCandidates(asset)) {
      const absolute = resolve(root, candidate);
      if (existsSync(absolute) && statSync(absolute).isFile()) {
        references.push({ path: candidate, kind: 'static' });
        break;
      }
    }
  }

  return references;
}

function metroAssetSourceCandidates(
  asset: MetroAssetMetadata,
): readonly string[] {
  const location = asset.httpServerLocation
    ?.replace(/^\/assets\/?/u, '')
    .replace(/^\.\/?/u, '');
  if (!location) return [];

  return (asset.scales?.length ? asset.scales : [1]).map((scale) => {
    const fileName = `${asset.name}${scale === 1 ? '' : `@${scale}x`}.${asset.type}`;
    return normalizeRelativePath(join(location, fileName));
  });
}

function createBundleAssetManifestEntries(
  root: string,
  target: BundleAssetTarget,
  references: readonly AssetReference[],
  metroAssets: readonly MetroAssetMetadata[],
): readonly MicroFrontendBundleAsset[] {
  const entries = references.map((reference) => {
    const sourcePath = reference.path;
    const parsed = parseAssetFileName(sourcePath);
    const metro = findMetroAssetForSource(sourcePath, parsed, metroAssets);
    const scales = metro?.scales?.length ? metro.scales : [parsed.scale];
    const files = findAssetScaleFiles(root, sourcePath, scales).map((file) =>
      createAssetFileEntry(target, sourcePath, file),
    );

    const entry: MicroFrontendBundleAsset = {
      sourcePath,
      name: metro?.name ?? parsed.name,
      type: metro?.type ?? parsed.type,
      httpServerLocation:
        metro?.httpServerLocation ?? httpServerLocationForSource(sourcePath),
      scales: [...new Set(files.map((file) => file.scale ?? 1))].sort(
        (a, b) => a - b,
      ),
      files,
      ...(metro?.id !== undefined ? { id: metro.id } : {}),
      ...(metro?.hash !== undefined ? { hash: metro.hash } : {}),
      ...(metro?.width !== undefined ? { width: metro.width } : {}),
      ...(metro?.height !== undefined ? { height: metro.height } : {}),
    };
    return entry;
  });

  return entries.filter(
    (entry) =>
      entry.files.length > 0 &&
      existsSync(sourcePathAbsolute(root, entry.sourcePath)),
  );
}

function findAssetScaleFiles(
  root: string,
  sourcePath: string,
  requestedScales: readonly number[],
): readonly { readonly path: string; readonly scale: number }[] {
  const absolute = resolve(root, sourcePath);
  const parsed = parseAssetFileName(sourcePath);
  const dir = dirname(absolute);
  const files = new Map<string, { path: string; scale: number }>();

  if (existsSync(absolute)) {
    files.set(sourcePath, { path: sourcePath, scale: parsed.scale });
  }

  if (existsSync(dir)) {
    for (const sibling of readdirSync(dir)) {
      const siblingPath = join(dir, sibling);
      if (!statSync(siblingPath).isFile()) continue;
      const relativeSibling = relativePath(root, siblingPath);
      const siblingParsed = parseAssetFileName(relativeSibling);
      if (
        siblingParsed.name !== parsed.name ||
        siblingParsed.type !== parsed.type
      )
        continue;
      if (!requestedScales.includes(siblingParsed.scale)) continue;
      files.set(relativeSibling, {
        path: relativeSibling,
        scale: siblingParsed.scale,
      });
    }
  }

  return [...files.values()].sort(
    (a, b) => a.scale - b.scale || a.path.localeCompare(b.path),
  );
}

function createAssetFileEntry(
  target: BundleAssetTarget,
  sourcePath: string,
  file: { readonly path: string; readonly scale: number },
): MicroFrontendBundleAssetFile {
  if (target.platform === 'android') {
    const platformPath = androidPlatformPath(file.path, file.scale);
    return {
      scale: file.scale,
      archivePath: toPosixPath(join('assets', platformPath)),
      originalPath: file.path,
      platformPath,
    };
  }

  const parsed = parseAssetFileName(file.path);
  const httpLocation = httpServerLocationForSource(sourcePath).replace(
    /^\/assets\/?/u,
    '',
  );
  const fileName = `${parsed.name}${file.scale === 1 ? '' : `@${file.scale}x`}.${parsed.type}`;
  return {
    scale: file.scale,
    archivePath: toPosixPath(join('assets', 'assets', httpLocation, fileName)),
    originalPath: file.path,
  };
}

function parseMetroAssetRegistry(
  bundleCode: string,
): readonly MetroAssetMetadata[] {
  const assets: MetroAssetMetadata[] = [];
  let searchFrom = 0;

  while (searchFrom < bundleCode.length) {
    const index = bundleCode.indexOf('registerAsset(', searchFrom);
    if (index === -1) break;
    const openParen = index + 'registerAsset'.length;
    const firstArg = parseFirstCallArgument(bundleCode, openParen);
    if (firstArg) {
      const parsed = parseMetroAssetObject(firstArg);
      if (parsed) assets.push(parsed);
    }
    searchFrom = index + 'registerAsset('.length;
  }

  return assets;
}

function parseFirstCallArgument(
  source: string,
  openParenIndex: number,
): string | undefined {
  if (source[openParenIndex] !== '(') return undefined;
  let depth = 0;
  let quote: '"' | "'" | '`' | undefined;
  let escaped = false;
  const start = openParenIndex + 1;

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = undefined;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }

    if (char === '(' || char === '[' || char === '{') depth += 1;
    else if (char === ')' || char === ']' || char === '}') {
      if (depth === 0 && char === ')') return source.slice(start, index).trim();
      depth -= 1;
    } else if (char === ',' && depth === 0) {
      return source.slice(start, index).trim();
    }
  }

  return undefined;
}

function parseMetroAssetObject(source: string): MetroAssetMetadata | undefined {
  try {
    const value = Function(`'use strict'; return (${source});`)() as unknown;
    if (
      !isRecord(value) ||
      typeof value.name !== 'string' ||
      typeof value.type !== 'string'
    ) {
      return undefined;
    }

    const asset: MetroAssetMetadata = {
      name: value.name,
      type: value.type,
      ...(typeof value.id === 'string' || typeof value.id === 'number'
        ? { id: value.id }
        : {}),
      ...(typeof value.httpServerLocation === 'string'
        ? { httpServerLocation: value.httpServerLocation }
        : {}),
      ...(Array.isArray(value.scales)
        ? {
            scales: value.scales.filter(
              (scale): scale is number => typeof scale === 'number',
            ),
          }
        : {}),
      ...(typeof value.hash === 'string' ? { hash: value.hash } : {}),
      ...(typeof value.width === 'number' ? { width: value.width } : {}),
      ...(typeof value.height === 'number' ? { height: value.height } : {}),
    };
    return asset;
  } catch {
    return undefined;
  }
}

function findMetroAssetForSource(
  sourcePath: string,
  parsed: { readonly name: string; readonly type: string },
  metroAssets: readonly MetroAssetMetadata[],
): MetroAssetMetadata | undefined {
  const normalized = normalizeRelativePath(sourcePath);
  return (
    metroAssets.find((asset) => {
      if (asset.name !== parsed.name || asset.type !== parsed.type)
        return false;
      const location =
        asset.httpServerLocation?.replace(/^\/assets\/?/u, '') ?? '';
      return (
        normalized.startsWith(`${location}/`) ||
        dirname(normalized) === location
      );
    }) ??
    metroAssets.find(
      (asset) => asset.name === parsed.name && asset.type === parsed.type,
    )
  );
}

function parseAssetFileName(path: string): {
  readonly name: string;
  readonly type: string;
  readonly scale: number;
} {
  const extension = extname(path).slice(1).toLowerCase();
  const rawName = basename(path, extname(path));
  const scaleMatch = rawName.match(/^(.*)@(\d+(?:\.\d+)?)x$/u);
  return {
    name: scaleMatch?.[1] ?? rawName,
    type: extension,
    scale: scaleMatch ? Number.parseFloat(scaleMatch[2] ?? '1') : 1,
  };
}

function httpServerLocationForSource(sourcePath: string): string {
  return `/assets/${dirname(normalizeRelativePath(sourcePath))}`.replace(
    /\/\.$/u,
    '',
  );
}

function androidPlatformPath(sourcePath: string, scale: number): string {
  const parsed = parseAssetFileName(sourcePath);
  const density = androidDensityForScale(scale);
  const sourceStem = normalizeRelativePath(
    join(dirname(sourcePath), parsed.name),
  ).replace(/[^A-Za-z0-9_]/gu, '_');
  return toPosixPath(join(density, `${sourceStem}.${parsed.type}`));
}

function androidDensityForScale(scale: number): string {
  if (scale >= 4) return 'drawable-xxxhdpi';
  if (scale >= 3) return 'drawable-xxhdpi';
  if (scale >= 2) return 'drawable-xhdpi';
  if (scale > 1) return 'drawable-hdpi';
  return 'drawable-mdpi';
}

function resolveProjectAssetExtensions(
  root: string,
  flags: Readonly<Record<string, string | boolean>>,
): ReadonlySet<string> {
  const extensions = new Set(DEFAULT_ASSET_EXTENSIONS);

  for (const extension of flagValues(flags, 'asset-ext')) {
    extensions.add(normalizeExtension(extension));
  }

  for (const extension of readMetroConfigAssetExtensions(root)) {
    extensions.add(normalizeExtension(extension));
  }

  return extensions;
}

function readMetroConfigAssetExtensions(root: string): readonly string[] {
  for (const fileName of [
    'metro.config.js',
    'metro.config.cjs',
    'metro.config.mjs',
  ]) {
    const filePath = join(root, fileName);
    if (!existsSync(filePath)) continue;

    const source = readFileSync(filePath, 'utf8');
    const match = source.match(/assetExts\s*:\s*\[([\s\S]*?)\]/u);
    if (!match?.[1]) continue;

    return Array.from(match[1].matchAll(/["']([^"']+)["']/gu)).map(
      (entry) => entry[1] ?? '',
    );
  }

  return [];
}

function normalizeExtension(extension: string): string {
  return `.${extension.replace(/^\./u, '').toLowerCase()}`;
}

function collectGlobAssets(
  root: string,
  pattern: string,
  assetExtensions: ReadonlySet<string>,
): readonly string[] {
  const matcher = globMatcher(pattern);
  const out: string[] = [];
  const visit = (dir: string): void => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir)) {
      const absolute = join(dir, entry);
      const stat = statSync(absolute);
      if (stat.isDirectory()) {
        if (entry === 'node_modules' || entry === '.git') continue;
        visit(absolute);
      } else if (stat.isFile()) {
        const relativeFile = relativePath(root, absolute);
        if (matcher(relativeFile) && isAssetFile(absolute, assetExtensions))
          out.push(relativeFile);
      }
    }
  };
  visit(root);
  return out.sort((a, b) => a.localeCompare(b));
}

function globMatcher(pattern: string): (path: string) => boolean {
  const normalized = normalizeRelativePath(pattern);
  let regexSource = '';

  for (let index = 0; index < normalized.length; index += 1) {
    const char = normalized[index];
    const next = normalized[index + 1];

    if (char === '*' && next === '*') {
      const after = normalized[index + 2];
      if (after === '/') {
        regexSource += '(?:.*\\/)?';
        index += 2;
      } else {
        regexSource += '.*';
        index += 1;
      }
      continue;
    }

    if (char === '*') {
      regexSource += '[^/]*';
      continue;
    }

    regexSource += escapeRegex(char ?? '');
  }

  const regex = new RegExp(`^${regexSource}$`, 'u');
  return (path) => regex.test(normalizeRelativePath(path));
}

function escapeRegex(value: string): string {
  return value.replace(/[\\^$.*+?()[\]{}|]/gu, '\\$&');
}

function isRelativeSpecifier(specifier: string): boolean {
  return specifier.startsWith('./') || specifier.startsWith('../');
}

function isSourceFile(path: string): boolean {
  return CODE_EXTENSIONS.has(extname(path));
}

function isAssetFile(
  path: string,
  assetExtensions: ReadonlySet<string> = DEFAULT_ASSET_EXTENSIONS,
): boolean {
  const normalized = normalizeRelativePath(path);
  if (normalized.includes('/node_modules/') && isSourceFile(path)) return false;
  if (normalized.endsWith('.d.ts') || normalized.endsWith('.map')) return false;
  const extension = extname(path).toLowerCase();
  return (
    assetExtensions.has(extension) && !SOURCE_EXCLUDED_EXTENSIONS.has(extension)
  );
}

function hasExtension(path: string): boolean {
  return extname(path).length > 0;
}

function isInside(root: string, path: string): boolean {
  const relativeToRoot = relative(root, path);
  return (
    !relativeToRoot.startsWith('..') &&
    !relativeToRoot.startsWith('/') &&
    !/^[A-Za-z]:[\\/]/u.test(relativeToRoot)
  );
}

function sourcePathAbsolute(root: string, sourcePath: string): string {
  return resolve(root, sourcePath);
}

function readExistingFile(path: string): string {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function flagValues(
  flags: Readonly<Record<string, string | boolean>>,
  key: string,
): readonly string[] {
  const value = flags[key];
  if (typeof value !== 'string') return [];
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function platformFlags(
  value: string | boolean | undefined,
): readonly BundleAssetPlatform[] {
  if (value === 'android') return ['android'];
  if (value === 'all') return ['ios', 'android'];
  return ['ios'];
}

function stringFlag(value: string | boolean | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function relativePath(root: string, path: string): string {
  return toPosixPath(relative(root, path));
}

function normalizeRelativePath(path: string): string {
  return toPosixPath(path).replace(/^\.\//u, '');
}

function toPosixPath(path: string): string {
  return path.split(sep).join('/');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
