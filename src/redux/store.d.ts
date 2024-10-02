import { UserStore } from './reducers/user-reducer';
import { WorkspacesStore } from './reducers/workspaces-reducer';
import { GroupsState } from './reducers/group-reducer';

export type RBACStore = {
  userReducer: UserStore;
  groupReducer: GroupsState;
  workspacesReducer: WorkspacesStore;
};

declare module 'react-redux' {
  export function useSelector<TState = RBACStore, TSelected = unknown>(
    selector: (state: TState) => TSelected,
    equalityFn?: (left: TSelected, right: TSelected) => boolean
  ): TSelected;
}
