declare module 'bun:test' {
  export function describe(name: string, fn: () => void): void;
  export function test(name: string, fn: () => void | Promise<void>): void;
  export const expect: (value: unknown) => {
    toBe(expected: unknown): void;
    toEqual(expected: unknown): void;
    toHaveLength(expected: number): void;
    toStartWith(expected: string): void;
    not: { toBe(expected: unknown): void };
  };
}
