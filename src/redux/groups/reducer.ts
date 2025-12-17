import omit from 'lodash/omit';
import { PaginationDefaultI, defaultSettings } from '../../helpers/pagination';
import { RoleWithAccess } from '@redhat-cloud-services/rbac-client/types';
import { BAD_UUID } from '../../helpers/dataUtilities';
import {
  ADD_GROUP,
  FETCH_ADD_ROLES_FOR_GROUP,
  FETCH_ADMIN_GROUP,
  FETCH_GROUP,
  FETCH_GROUPS,
  FETCH_MEMBERS_FOR_EXPANDED_GROUP,
  FETCH_MEMBERS_FOR_GROUP,
  FETCH_ROLES_FOR_EXPANDED_GROUP,
  FETCH_ROLES_FOR_GROUP,
  FETCH_SERVICE_ACCOUNTS_FOR_GROUP,
  FETCH_SYSTEM_GROUP,
  INVALIDATE_SYSTEM_GROUP,
  REMOVE_GROUPS,
  RESET_SELECTED_GROUP,
  UPDATE_GROUP,
  UPDATE_GROUPS_FILTERS,
} from './action-types';

// Filter interfaces
export interface GroupFilters {
  name?: string;
  [key: string]: string | number | boolean | undefined;
}

// Error interfaces
export interface ApiError {
  errors?: Array<{
    detail?: string;
    status?: string;
    source?: string;
  }>;
}

// Service Account interface
export interface ServiceAccount {
  uuid: string;
  name: string;
  description?: string;
  clientId?: string;
  owner?: string;
  time_created?: number;
  [key: string]: unknown;
}

// Core data interfaces used by Redux

// Member interface - core data type used by Redux
export interface Member {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
}

// Resource collection with loading state - used for members, roles, serviceAccounts
export interface ResourceCollection<T> {
  isLoading: boolean;
  data: T[];
  error?: ApiError;
  meta?: any;
}

// GroupState interface - base group data structure
export interface GroupState {
  uuid: string;
  name: string;
  description?: string;
  platform_default: boolean;
  system: boolean;
  admin_default: boolean;
}

// Group interface - extended group data for UI
export interface Group extends GroupState {
  principalCount?: number | string;
  roleCount?: number;
  policyCount?: number;
  created?: string;
  modified?: string;
  roles?: any[];
  members?: any[];
  isLoadingRoles?: boolean;
  isLoadingMembers?: boolean;
}

// SelectedGroupState - extends GroupState with resource collections
export interface SelectedGroupState extends GroupState {
  members?: ResourceCollection<Member>;
  roles?: ResourceCollection<any>; // RoleWithAccess from @redhat-cloud-services/rbac-client
  serviceAccounts?: ResourceCollection<ServiceAccount>;
  addRoles?: {
    loaded?: boolean;
    roles?: any[];
    pagination?: any;
  };
  error?: ApiError;
  loaded?: boolean;
  pagination?: any;
}

// Group reducer state interface
export interface GroupReducerState {
  selectedGroup?: SelectedGroupState;
  isRecordLoading: boolean;
  isLoading: boolean;
  groups: {
    data?: Group[];
    pagination?: any;
    meta?: any;
    filters?: any;
  };
  error?: string;
  adminGroup?: Group;
  systemGroup?: Group;
}

// Backwards compatibility
export interface LegacyGroup {
  uuid: string;
  name: string;
  description?: string;
  principalCount?: number;
  roleCount?: number;
  created?: string;
  modified?: string;
  admin_default?: boolean;
  platform_default?: boolean;
  system?: boolean;
  // Extended properties for expanded groups
  isLoadingRoles?: boolean;
  isLoadingMembers?: boolean;
  roles?: RoleWithAccess[];
  members?: Member[];
}

// Extends Record<string, unknown> for compatibility with applyReducerHash from frontend-components-utilities
export interface GroupStore extends Record<string, unknown> {
  groups: {
    data: Group[];
    meta: PaginationDefaultI;
    filters: GroupFilters;
    pagination: PaginationDefaultI & { redirected?: boolean };
    error?: ApiError;
  };
  selectedGroup?: SelectedGroupState;
  isLoading: boolean;
  isRecordLoading: boolean;
  error?: string; // Root-level error for single group operations (e.g., BAD_UUID)
  adminGroup?: Group;
  systemGroup?: Group;
  isSystemGroupLoading?: boolean;
}

// Initial State
export const groupsInitialState = {
  groups: {
    data: [],
    meta: defaultSettings,
    filters: {},
    pagination: { count: 0 },
  },
  selectedGroup: undefined,
  isLoading: false,
  isRecordLoading: false,
} as GroupStore;

const setLoadingState = (state: GroupStore) => ({ ...state, error: undefined, isLoading: true });
const setRecordLoadingState = (state: GroupStore) => ({
  ...state,
  isRecordLoading: true,
  selectedGroup: { ...state.selectedGroup, error: undefined, loaded: false },
});
const setRecordRolesLoadingState = (state: GroupStore) => ({
  ...state,
  selectedGroup: {
    ...(state.selectedGroup || {}),
    error: undefined,
    roles: {
      ...(state.selectedGroup?.roles || {}),
      isLoading: true,
    },
  },
});
const setSystemGroupLoadingState = (state: GroupStore) => ({
  ...state,
  isSystemGroupLoading: true,
  error: undefined,
});
const setGroups = (state: GroupStore, { payload }: any) => ({
  ...state,
  groups: { pagination: state.groups?.pagination, filters: state.groups?.filters, ...payload },
  isLoading: false,
});
const setAdminGroup = (state: GroupStore, { payload }: any) => ({
  ...state,
  adminGroup: payload?.data?.filter((group: any) => group?.admin_default)?.[0],
});
const setSystemGroup = (state: GroupStore, { payload }: any) => ({
  ...state,
  isSystemGroupLoading: false,
  systemGroup: payload?.data?.[0],
});
const invalidateSystemGroup = (state: GroupStore) => ({
  ...state,
  systemGroup: undefined,
});
const setGroup = (state: GroupStore, { payload }: any) => ({
  ...state,
  isRecordLoading: false,
  ...(!payload.error
    ? {
        groups: {
          ...state.groups,
          data: state.groups.data.map((group) => ({
            ...group,
            ...(payload.uuid === group.uuid && { ...payload, loaded: true }),
          })),
        },
        selectedGroup: {
          ...state.selectedGroup,
          // Only update members data if principals are provided in the payload
          ...(payload.principals !== undefined && {
            members: { ...(state.selectedGroup?.members || {}), data: payload.principals },
          }),
          ...omit(payload, ['principals', 'roles']),
          loaded: true,
          pagination: { ...(state.selectedGroup?.pagination || {}), count: payload.roleCount, offset: 0 },
        },
      }
    : payload),
});
const resetSelectedGroup = (state: GroupStore) => ({ ...state, selectedGroup: undefined });
const setRolesForGroup = (state: GroupStore, { payload }: any) => ({
  ...state,
  selectedGroup: {
    ...(state.selectedGroup || {}),
    roles: {
      isLoading: false,
      ...(!payload.error ? payload : {}),
    },
  },
});

const setRolesForExpandedGroupLoading = (state: GroupStore, { meta }: any) => ({
  ...state,
  ...(meta.isAdminDefault ? { adminGroup: { ...state.adminGroup, isLoadingRoles: true } } : {}),
  ...(meta.isPlatformDefault ? { systemGroup: { ...state.systemGroup, isLoadingRoles: true } } : {}),
  groups: {
    ...state.groups,
    data: state.groups.data.map((group) => ({
      ...group,
      ...(group.uuid === meta.groupId && { isLoadingRoles: true }),
    })),
  },
});

const setRolesForExpandedGroup = (state: GroupStore, { payload, meta }: any) => ({
  ...state,
  ...(meta.isAdminDefault ? { adminGroup: { ...state.adminGroup, roles: payload.data, isLoadingRoles: false } } : {}),
  ...(meta.isPlatformDefault
    ? {
        systemGroup: {
          ...state.systemGroup,
          roles: payload.data,
          isLoadingRoles: false,
        },
      }
    : {}),
  groups: {
    ...state.groups,
    data: state.groups.data.map((group) => ({
      ...group,
      ...(group.uuid === meta.groupId && { roles: payload.data, isLoadingRoles: false }),
    })),
  },
});

const setAccountsForGroupLoading = (state: GroupStore) => ({
  ...state,
  selectedGroup: {
    ...(state.selectedGroup || {}),
    serviceAccounts: { isLoading: true },
  },
});
const setAccountsForGroup = (state: GroupStore, { payload }: any) => ({
  ...state,
  selectedGroup: {
    ...(state.selectedGroup || {}),
    serviceAccounts: {
      isLoading: false,
      ...(!payload.error
        ? {
            ...payload,
            data: payload.data.map((item: any) => ({ ...item, uuid: item.clientId || item.id, time_created: item.time_created * 1000 })),
          }
        : {}),
    },
  },
});

const setMembersForGroupLoading = (state: GroupStore) => ({
  ...state,
  selectedGroup: {
    ...(state.selectedGroup || {}),
    members: { isLoading: true },
  },
});
const setMembersForExpandedGroupLoading = (state: GroupStore, { meta }: any) => ({
  ...state,
  groups: {
    ...state.groups,
    data: state.groups.data.map((group) => ({
      ...group,
      ...(group.uuid === meta.groupId && { isLoadingMembers: true }),
    })),
  },
});

const setMembersForGroup = (state: GroupStore, { payload }: any) => ({
  ...state,
  selectedGroup: {
    ...(state.selectedGroup || {}),
    members: {
      isLoading: false,
      ...(!payload.error ? payload : {}),
    },
    ...(payload.error ? payload : {}),
  },
});

const setMembersForExpandedGroup = (state: GroupStore, { payload, meta }: any) => ({
  ...state,
  groups: {
    ...state.groups,
    data: state.groups.data.map((group) => ({
      ...group,
      ...(group.uuid === meta.groupId && { members: payload.data, isLoadingMembers: false }),
    })),
  },
});

const setMembersForGroupError = (state: GroupStore, { payload }: any) => ({
  ...state,
  selectedGroup: {
    ...(state.selectedGroup || {}),
    members: {
      isLoading: false,
      data: [],
      error: payload,
    },
    error: payload,
  },
});

const setRolesForGroupError = (state: GroupStore, { payload }: any) => ({
  ...state,
  selectedGroup: {
    ...(state.selectedGroup || {}),
    roles: {
      isLoading: false,
      data: [],
      error: payload,
    },
    error: payload,
  },
});

const setServiceAccountsForGroupError = (state: GroupStore, { payload }: any) => ({
  ...state,
  selectedGroup: {
    ...(state.selectedGroup || {}),
    serviceAccounts: {
      isLoading: false,
      data: [],
      error: payload,
    },
    error: payload,
  },
});

const setAddRolesLoading = (state: GroupStore) => ({
  ...state,
  selectedGroup: { ...state.selectedGroup, addRoles: { loaded: false } },
});
const setAddRolesForGroup = (state: GroupStore, { payload }: any) => ({
  ...state,
  selectedGroup: {
    ...state.selectedGroup,
    addRoles: {
      ...(!payload.error ? { roles: payload.data, pagination: payload.meta } : state.selectedGroup?.addRoles),
      loaded: true,
    },
  },
  ...(payload.error ? payload : {}),
});

const setFilters = (state: GroupStore, { payload }: any) => ({
  ...state,
  groups: { ...state.groups, filters: payload },
});

const setGroupsError = (state: GroupStore, { payload }: any) => ({
  ...state,
  isLoading: false,
  groups: {
    ...state.groups,
    error: payload,
  },
});

const setGroupError = (state: GroupStore) => ({
  ...state,
  isRecordLoading: false,
  error: BAD_UUID, // Treat any group fetch error as BAD_UUID for consistent error handling
  selectedGroup: undefined, // Clear any existing selected group
});

// ADD_GROUP reducer handlers
const setAddGroupLoadingState = (state: GroupStore) => ({
  ...state,
  isLoading: true,
  error: undefined,
});

const addNewGroup = (state: GroupStore, { payload }: any) => ({
  ...state,
  groups: {
    ...state.groups,
    data: [payload, ...state.groups.data], // Add new group to beginning of list
    pagination: {
      ...state.groups.pagination,
      count: (state.groups.pagination.count ?? 0) + 1,
    },
  },
  isLoading: false,
});

const setAddGroupError = (state: GroupStore, { payload }: any) => ({
  ...state,
  isLoading: false,
  error: payload,
});

// REMOVE_GROUPS reducer handlers - just handle loading states
// The actual list refresh is handled by postMethod -> fetchData -> fetchGroups
const setRemoveGroupsLoadingState = (state: GroupStore) => ({
  ...state,
  isLoading: true,
  error: undefined,
});

const removeGroupsCompleted = (state: GroupStore) => ({
  ...state,
  isLoading: false,
  error: undefined,
  // Don't modify the groups list here - postMethod will call fetchGroups to refresh
});

const setRemoveGroupsError = (state: GroupStore, { payload }: any) => ({
  ...state,
  isLoading: false,
  error: payload,
});

export default {
  [`${FETCH_GROUPS}_PENDING`]: setLoadingState,
  [`${FETCH_GROUPS}_FULFILLED`]: setGroups,
  [`${FETCH_GROUPS}_REJECTED`]: setGroupsError,
  [`${FETCH_ADMIN_GROUP}_PENDING`]: setLoadingState,
  [`${FETCH_ADMIN_GROUP}_FULFILLED`]: setAdminGroup,
  [`${FETCH_SYSTEM_GROUP}_PENDING`]: setSystemGroupLoadingState,
  [`${FETCH_SYSTEM_GROUP}_FULFILLED`]: setSystemGroup,
  [INVALIDATE_SYSTEM_GROUP]: invalidateSystemGroup,
  [`${FETCH_GROUP}_PENDING`]: setRecordLoadingState,
  [`${FETCH_GROUP}_FULFILLED`]: setGroup,
  [`${FETCH_GROUP}_REJECTED`]: setGroupError,
  [`${ADD_GROUP}_PENDING`]: setAddGroupLoadingState,
  [`${ADD_GROUP}_FULFILLED`]: addNewGroup,
  [`${ADD_GROUP}_REJECTED`]: setAddGroupError,
  [`${REMOVE_GROUPS}_PENDING`]: setRemoveGroupsLoadingState,
  [`${REMOVE_GROUPS}_FULFILLED`]: removeGroupsCompleted,
  [`${REMOVE_GROUPS}_REJECTED`]: setRemoveGroupsError,
  [`${FETCH_ROLES_FOR_GROUP}_PENDING`]: setRecordRolesLoadingState,
  [`${FETCH_ROLES_FOR_GROUP}_FULFILLED`]: setRolesForGroup,
  [`${FETCH_ROLES_FOR_GROUP}_REJECTED`]: setRolesForGroupError,
  [`${FETCH_ROLES_FOR_EXPANDED_GROUP}_PENDING`]: setRolesForExpandedGroupLoading,
  [`${FETCH_ROLES_FOR_EXPANDED_GROUP}_FULFILLED`]: setRolesForExpandedGroup,
  [`${FETCH_SERVICE_ACCOUNTS_FOR_GROUP}_PENDING`]: setAccountsForGroupLoading,
  [`${FETCH_SERVICE_ACCOUNTS_FOR_GROUP}_FULFILLED`]: setAccountsForGroup,
  [`${FETCH_SERVICE_ACCOUNTS_FOR_GROUP}_REJECTED`]: setServiceAccountsForGroupError,
  [`${FETCH_MEMBERS_FOR_GROUP}_PENDING`]: setMembersForGroupLoading,
  [`${FETCH_MEMBERS_FOR_GROUP}_FULFILLED`]: setMembersForGroup,
  [`${FETCH_MEMBERS_FOR_GROUP}_REJECTED`]: setMembersForGroupError,
  [`${FETCH_MEMBERS_FOR_EXPANDED_GROUP}_PENDING`]: setMembersForExpandedGroupLoading,
  [`${FETCH_MEMBERS_FOR_EXPANDED_GROUP}_FULFILLED`]: setMembersForExpandedGroup,
  [`${FETCH_ADD_ROLES_FOR_GROUP}_PENDING`]: setAddRolesLoading,
  [`${FETCH_ADD_ROLES_FOR_GROUP}_FULFILLED`]: setAddRolesForGroup,
  [`${UPDATE_GROUP}_PENDING`]: setRecordLoadingState,
  [`${UPDATE_GROUP}_FULFILLED`]: setGroup,
  [`${UPDATE_GROUP}_REJECTED`]: setGroupError,
  [RESET_SELECTED_GROUP]: resetSelectedGroup,
  [UPDATE_GROUPS_FILTERS]: setFilters,
};
