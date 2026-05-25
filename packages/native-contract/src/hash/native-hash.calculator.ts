import { createHash } from "node:crypto";
import type { NativeContract } from "@bunin/react-native-micro-frontend";
import { stableJson } from "./stable-json.js";

/**
 * Calculates a stable nativeHash from native dependencies, platform files, RN version, Hermes and New Architecture flags.
 *
 * This function is pure and does not read files. Native runtime flags are hashed
 * because changing them requires a new binary even when JavaScript code is identical.
 *
 * @param contract Native contract snapshot without or with a previous nativeHash.
 * @returns SHA-256 hex hash prefixed with `sha256:`.
 */
export function calculateNativeHash(contract: NativeContract): string {
  const { nativeHash: _nativeHash, generatedAt: _generatedAt, ...hashable } = contract;
  return `sha256:${createHash("sha256").update(stableJson(hashable)).digest("hex")}`;
}

/**
 * Returns a copy of a native contract with nativeHash and generatedAt filled.
 *
 * @param contract Native contract snapshot.
 * @param generatedAt ISO timestamp to store; defaults to now.
 * @returns Contract copy with calculated nativeHash.
 */
export function attachNativeHash(contract: NativeContract, generatedAt = new Date().toISOString()): NativeContract {
  const withGeneratedAt = { ...contract, generatedAt };
  return { ...withGeneratedAt, nativeHash: calculateNativeHash(withGeneratedAt) };
}
