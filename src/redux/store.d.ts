import { PaginationDefaultI } from '../helpers/shared/pagination';
import { UserStore } from './reducers/user-reducer';

interface GroupsStore {
  groups: {
    data: any[];
    meta: any;
    filters: any;
    pagination: { count: number };
  };
  selectedGroup: {
    addRoles: any;
    members: { meta: any };
    serviceAccounts: { meta: any };
    pagination: PaginationDefaultI & { redirected?: boolean };
  };
  isLoading: boolean;
  isRecordLoading: boolean;
}

export type RBACStore = {
  userReducer: UserStore;
  groupsReducer: GroupsStore;
};

declare module 'react-redux' {
  export function useSelector<TState = RBACStore, TSelected = unknown>(
    selector: (state: TState) => TSelected,
    equalityFn?: (left: TSelected, right: TSelected) => boolean
  ): TSelected;
}
