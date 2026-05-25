/**
 * Represents an operation that can either succeed with a value or fail with a typed error.
 *
 * Use this for recoverable domain and IO-adjacent failures instead of throwing strings.
 * Constructors in this file do not cause side effects.
 */
export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

/**
 * Creates a successful Result value.
 *
 * @param value Successful payload.
 * @returns A Result tagged as ok.
 */
export function ok<T, E = never>(value: T): Result<T, E> {
  return { ok: true, value };
}

/**
 * Creates a failed Result value.
 *
 * @param error Typed error payload.
 * @returns A Result tagged as not ok.
 */
export function err<T = never, E = unknown>(error: E): Result<T, E> {
  return { ok: false, error };
}
