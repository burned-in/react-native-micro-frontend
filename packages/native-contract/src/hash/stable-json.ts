/**
 * Converts values to deterministic JSON by sorting object keys recursively.
 *
 * This pure function is used before nativeHash calculation so equivalent native
 * contracts produce identical hashes independent of insertion order.
 *
 * @param value JSON-compatible value.
 * @returns Stable JSON string.
 */
export function stableJson(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === 'object') {
    const input = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(input).sort())
      sorted[key] = sortValue(input[key]);
    return sorted;
  }
  return value;
}
