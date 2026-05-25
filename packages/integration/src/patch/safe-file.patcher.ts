import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Result } from "@bunin/react-native-micro-frontend";
import { err, ok } from "@bunin/react-native-micro-frontend";

/** File patch request with safety controls. */
export interface SafeFilePatch {
  readonly path: string;
  readonly contents: string;
  readonly backup: boolean;
}

/** Patch application error. */
export interface SafeFilePatchError {
  readonly path: string;
  readonly message: string;
}

/**
 * Writes files with optional `.bak` backup, creating parent directories as needed.
 *
 * This function mutates the filesystem only for explicit patch requests. It is
 * intended for post-confirmation CLI flows or CI `--yes` mode.
 *
 * @param root Project root.
 * @param patches File patches to apply.
 * @returns Result containing written paths or a typed failure.
 */
export function applySafeFilePatches(root: string, patches: readonly SafeFilePatch[]): Result<readonly string[], SafeFilePatchError> {
  const written: string[] = [];
  try {
    for (const patch of patches) {
      const target = join(root, patch.path);
      mkdirSync(dirname(target), { recursive: true });
      if (patch.backup && existsSync(target)) {
        const backupPath = `${target}.bak`;
        writeFileSync(backupPath, readFileSync(target));
      }
      writeFileSync(target, patch.contents);
      written.push(patch.path);
    }
    return ok(written);
  } catch (error) {
    return err({ path: written.at(-1) ?? "unknown", message: error instanceof Error ? error.message : String(error) });
  }
}

/**
 * Restores a file from its `.bak` sibling.
 *
 * @param root Project root.
 * @param path Project-relative file path.
 * @returns Result of the rollback operation.
 */
export function restoreBackup(root: string, path: string): Result<string, SafeFilePatchError> {
  const target = join(root, path);
  const backup = `${target}.bak`;
  if (!existsSync(backup)) return err({ path, message: "backup not found" });
  renameSync(backup, target);
  return ok(path);
}
