import { RoleStore } from './reducers/role-reducer';
import { UserStore } from './reducers/user-reducer';
import { WorkspacesStore } from './reducers/workspaces-reducer';
import { GroupStore } from './reducers/group-reducer';

export type RBACStore = {
  userReducer: UserStore;
  groupReducer: GroupStore;
  roleReducer: RoleStore;
  workspacesReducer: WorkspacesStore;
  permissionReducer: any;
};

declare module 'react-redux' {
  export function useSelector<TState = RBACStore, TSelected = unknown>(
    selector: (state: TState) => TSelected,
    equalityFn?: (left: TSelected, right: TSelected) => boolean,
  ): TSelected;
}
