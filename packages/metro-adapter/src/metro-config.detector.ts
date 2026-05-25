import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Metro/Re.Pack detection result. */
export interface MetroDetection {
  readonly metroConfigPath?: string;
  readonly metroDetected: boolean;
  readonly repackDetected: boolean;
  readonly warnings: readonly string[];
}

/**
 * Detects Metro config and rejects Re.Pack-oriented setups for this library.
 *
 * @param root Project root.
 * @returns Detection result and warnings.
 */
export function detectMetro(root: string): MetroDetection {
  const metroConfigPath = [
    'metro.config.js',
    'metro.config.ts',
    'metro.config.cjs',
    'metro.config.mjs',
  ].find((file) => existsSync(join(root, file)));
  const packageJsonPath = join(root, 'package.json');
  const packageJsonText = existsSync(packageJsonPath)
    ? readFileSync(packageJsonPath, 'utf8')
    : '{}';
  const metroText = metroConfigPath
    ? readFileSync(join(root, metroConfigPath), 'utf8')
    : '';
  const repackDetected =
    /@callstack\/repack|ModuleFederationPlugin|webpack/.test(
      `${packageJsonText}\n${metroText}`,
    );
  const result = {
    metroDetected: Boolean(metroConfigPath),
    repackDetected,
    warnings: repackDetected
      ? [
          'Re.Pack/Webpack Module Federation is not supported; use Metro bundle integration.',
        ]
      : [],
  };
  return metroConfigPath ? { ...result, metroConfigPath } : result;
}
