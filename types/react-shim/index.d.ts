declare module "react" {
  export type ReactNode = unknown;
  export interface ReactElement { readonly type?: unknown; readonly props?: unknown; readonly key?: unknown; }
  export interface Context<T> { readonly Provider: unknown; }
  export function createContext<T>(defaultValue: T): Context<T>;
  export function useContext<T>(context: Context<T>): T;
  export function createElement(type: unknown, props: unknown, ...children: unknown[]): ReactElement;
  export const Fragment: unique symbol;
  const React: { createElement: typeof createElement; createContext: typeof createContext; useContext: typeof useContext; Fragment: typeof Fragment };
  export default React;
}
