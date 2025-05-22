export {};
declare module 'react-redux' {
  export function useSelector<TState = RBACStore, TSelected = unknown>(
    selector: (state: TState) => TSelected,
    equalityFn?: (left: TSelected, right: TSelected) => boolean
  ): TSelected;
}
