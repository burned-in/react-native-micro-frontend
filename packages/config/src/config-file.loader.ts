import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactNativeMicroFrontendConfig } from "@bunin/react-native-micro-frontend";
import type { Result } from "@bunin/react-native-micro-frontend";
import { err, ok } from "@bunin/react-native-micro-frontend";
import { normalizeReactNativeMicroFrontendConfig } from "@bunin/react-native-micro-frontend";

/** Config load error for CLI and CI output. */
export interface ConfigLoadError {
  readonly path: string;
  readonly message: string;
}

/**
 * Loads a JSON config variant and normalizes it.
 *
 * TypeScript config files are intended for app code and type inference. This
 * runtime loader avoids unsafe eval; callers that run under Bun or a trusted
 * transpiler may import TS config separately and pass it to normalize.
 *
 * @param root Project root.
 * @param filename Config filename, defaults to react-native-micro-frontend.config.json.
 * @returns Normalized config or typed load error.
 */
export function loadJsonReactNativeMicroFrontendConfig(root: string, filename = "react-native-micro-frontend.config.json"): Result<ReactNativeMicroFrontendConfig, ConfigLoadError> {
  const path = join(root, filename);
  if (!existsSync(path)) return err({ path, message: "config file not found" });
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as Partial<ReactNativeMicroFrontendConfig>;
    return ok(normalizeReactNativeMicroFrontendConfig(parsed));
  } catch (error) {
    return err({ path, message: error instanceof Error ? error.message : String(error) });
  }
}
