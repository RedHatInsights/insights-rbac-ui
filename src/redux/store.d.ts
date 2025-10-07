import { GroupStore } from './groups/reducer';
import { PoliciesState } from './policies/reducer';
import { RoleStore } from './roles/reducer';
import { ServiceAccountsState } from './service-accounts/reducer';
import { UserStore } from './users/reducer';
import { RoleBindingsStore, WorkspacesStore } from './workspaces/reducer';
import { AccessState } from './access-management/reducer';
import { PermissionState } from './permissions/reducer';
import { InventoryState } from './inventory/reducer';
import { CostState } from './cost-management/reducer';
import { ApiErrorState } from './api-error/error-reducer';

/**
 * Global Redux action interface types
 */
declare global {
  interface ActionWithPayload<T> {
    payload: T;
  }

  interface ActionMeta {
    notifications?: {
      fulfilled?: unknown;
      rejected?: unknown | ((payload: any) => unknown);
    };
    // Allow additional metadata properties for different action types
    [key: string]: unknown;
  }

  interface ReduxAction<T = unknown> {
    type: string;
    payload: T;
    meta?: ActionMeta;
  }
}

export type RBACStore = {
  accessReducer: AccessState;
  costReducer: CostState;
  errorReducer: ApiErrorState;
  groupReducer: GroupStore;
  inventoryReducer: InventoryState;
  permissionReducer: PermissionState;
  policyReducer: PoliciesState;
  roleReducer: RoleStore;
  serviceAccountReducer: ServiceAccountsState;
  userReducer: UserStore;
  workspacesReducer: WorkspacesStore;
  roleBindingsReducer: RoleBindingsStore;
  notifications: any; // Keep as any since it's from external library
};
