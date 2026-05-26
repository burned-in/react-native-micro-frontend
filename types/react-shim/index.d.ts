declare module 'react' {
  export type ReactNode = unknown;
  export type ComponentType<P = Record<string, never>> = (
    props: P,
  ) => ReactElement | null;
  export interface ReactElement {
    readonly type?: unknown;
    readonly props?: unknown;
    readonly key?: unknown;
  }
  export interface Context<T> {
    readonly Provider: unknown;
  }
  export function createContext<T>(defaultValue: T): Context<T>;
  export function useContext<T>(context: Context<T>): T;
  export function useEffect(
    effect: () => undefined | (() => void),
    deps?: readonly unknown[],
  ): void;
  export function useState<T>(
    initialState: T,
  ): [T, (value: T | ((previous: T) => T)) => void];
  export function createElement(
    type: unknown,
    props: unknown,
    ...children: unknown[]
  ): ReactElement;
  export const Fragment: unique symbol;
  const React: {
    createElement: typeof createElement;
    createContext: typeof createContext;
    useContext: typeof useContext;
    useEffect: typeof useEffect;
    useState: typeof useState;
    Fragment: typeof Fragment;
  };
  export default React;
}
