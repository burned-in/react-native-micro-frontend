declare module 'node:fs' {
  export function existsSync(path: string): boolean;
  export function readFileSync(path: string, encoding: 'utf8'): string;
  export function readFileSync(path: string): Uint8Array;
  export function readdirSync(path: string): string[];
  export function mkdirSync(
    path: string,
    options?: { recursive?: boolean },
  ): void;
  export function writeFileSync(path: string, data: string | Uint8Array): void;
  export function renameSync(oldPath: string, newPath: string): void;
}
declare module 'node:path' {
  export function join(...paths: string[]): string;
  export function dirname(path: string): string;
  export function resolve(...paths: string[]): string;
}
declare module 'node:crypto' {
  export interface Hash {
    update(data: string): Hash;
    digest(encoding: 'hex'): string;
  }
  export function createHash(algorithm: string): Hash;
}
declare const process: { argv: string[]; cwd(): string; exitCode?: number };
