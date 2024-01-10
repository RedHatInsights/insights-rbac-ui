import {
  FETCH_GROUP,
  FETCH_ADMIN_GROUP,
  FETCH_SYSTEM_GROUP,
  FETCH_GROUPS,
  RESET_SELECTED_GROUP,
  FETCH_ROLES_FOR_GROUP,
  FETCH_ADD_ROLES_FOR_GROUP,
  FETCH_MEMBERS_FOR_GROUP,
  FETCH_SERVICE_ACCOUNTS_FOR_GROUP,
  UPDATE_GROUPS_FILTERS,
  INVALIDATE_SYSTEM_GROUP,
  FETCH_ROLES_FOR_EXPANDED_GROUP,
  FETCH_MEMBERS_FOR_EXPANDED_GROUP,
} from '../../redux/action-types';
import omit from 'lodash/omit';
import { defaultSettings } from '../../helpers/shared/pagination';

// Initial State
export const groupsInitialState = {
  groups: {
    data: [],
    meta: {},
    filters: {},
    pagination: { count: 0 },
  },
  selectedGroup: { addRoles: {}, members: { meta: defaultSettings }, serviceAccounts: { meta: defaultSettings }, pagination: defaultSettings },
  isLoading: false,
  isRecordLoading: false,
};

const setLoadingState = (state) => ({ ...state, error: undefined, isLoading: true });
const setRecordLoadingState = (state) => ({
  ...state,
  isRecordLoading: true,
  selectedGroup: { ...state.selectedGroup, error: undefined, loaded: false },
});
const setRecordRolesLoadingState = (state) => ({
  ...state,
  selectedGroup: {
    ...state.selectedGroup,
    error: undefined,
    roles: {
      ...(state.selectedGroup.roles || {}),
      isLoading: true,
    },
  },
});
const setSystemGroupLoadingState = (state) => ({
  ...state,
  isSystemGroupLoading: true,
  error: undefined,
});
const setGroups = (state, { payload }) => ({
  ...state,
  groups: { pagination: state.groups?.pagination, filters: state.groups?.filters, ...payload },
  isLoading: false,
});
const setAdminGroup = (state, { payload }) => ({ ...state, adminGroup: payload?.data?.filter((group) => group?.admin_default)?.[0] });
const setSystemGroup = (state, { payload }) => ({ ...state, isSystemGroupLoading: false, systemGroup: payload?.data?.[0] });
const invalidateSystemGroup = (state) => ({ ...state, systemGroup: undefined });
const setGroup = (state, { payload }) => ({
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
          members: { ...state.selectedGroup.members, data: payload.principals },
          ...omit(payload, ['principals', 'roles']),
          loaded: true,
          pagination: { ...state.selectedGroup.pagination, count: payload.roleCount, offset: 0 },
        },
      }
    : payload),
});
const resetSelectedGroup = (state) => ({ ...state, selectedGroup: undefined });
const setRolesForGroup = (state, { payload }) => ({
  ...state,
  selectedGroup: {
    ...state.selectedGroup,
    roles: {
      isLoading: false,
      ...(!payload.error ? payload : {}),
    },
    ...(payload.error ? payload : {}),
  },
});

const setRolesForExpandedGroupLoading = (state, { meta }) => ({
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

const setRolesForExpandedGroup = (state, { payload, meta }) => ({
  ...state,
  ...(meta.isAdminDefault ? { adminGroup: { ...state.adminGroup, roles: payload.data, isLoadingRoles: false } } : {}),
  ...(meta.isPlatformDefault ? { systemGroup: { ...state.systemGroup, roles: payload.data, isLoadingRoles: false } } : {}),
  groups: {
    ...state.groups,
    data: state.groups.data.map((group) => ({
      ...group,
      ...(group.uuid === meta.groupId && { roles: payload.data, isLoadingRoles: false }),
    })),
  },
});

const setAccountsForGroupLoading = (state = {}) => ({
  ...state,
  selectedGroup: {
    ...(state.selectedGroup || {}),
    serviceAccounts: { isLoading: true },
  },
});
const setAccountsForGroup = (state, { payload }) => ({
  ...state,
  selectedGroup: {
    ...(state.selectedGroup || {}),
    serviceAccounts: {
      isLoading: false,
      ...(!payload.error
        ? { ...payload, data: payload.data.map((item) => ({ ...item, uuid: item.name, time_created: item.time_created * 1000 })) }
        : {}),
    },
  },
});

const setMembersForGroupLoading = (state = {}) => ({
  ...state,
  selectedGroup: {
    ...(state.selectedGroup || {}),
    members: { isLoading: true },
  },
});
const setMembersForExpandedGroupLoading = (state, { meta }) => ({
  ...state,
  groups: {
    ...state.groups,
    data: state.groups.data.map((group) => ({
      ...group,
      ...(group.uuid === meta.groupId && { isLoadingMembers: true }),
    })),
  },
});

const setMembersForGroup = (state, { payload }) => ({
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

const setMembersForExpandedGroup = (state, { payload, meta }) => ({
  ...state,
  groups: {
    ...state.groups,
    data: state.groups.data.map((group) => ({
      ...group,
      ...(group.uuid === meta.groupId && { members: payload.data, isLoadingMembers: false }),
    })),
  },
});

const setAddRolesLoading = (state) => ({
  ...state,
  selectedGroup: { ...state.selectedGroup, addRoles: { loaded: false } },
});
const setAddRolesForGroup = (state, { payload }) => ({
  ...state,
  selectedGroup: {
    ...state.selectedGroup,
    addRoles: { ...(!payload.error ? { roles: payload.data, pagination: payload.meta } : state.addRoles), loaded: true },
  },
  ...(payload.error ? payload : {}),
});

const setFilters = (state, { payload }) => ({ ...state, groups: { ...state.groups, filters: payload } });

export default {
  [`${FETCH_GROUPS}_PENDING`]: setLoadingState,
  [`${FETCH_GROUPS}_FULFILLED`]: setGroups,
  [`${FETCH_ADMIN_GROUP}_PENDING`]: setLoadingState,
  [`${FETCH_ADMIN_GROUP}_FULFILLED`]: setAdminGroup,
  [`${FETCH_SYSTEM_GROUP}_PENDING`]: setSystemGroupLoadingState,
  [`${FETCH_SYSTEM_GROUP}_FULFILLED`]: setSystemGroup,
  [INVALIDATE_SYSTEM_GROUP]: invalidateSystemGroup,
  [`${FETCH_GROUP}_PENDING`]: setRecordLoadingState,
  [`${FETCH_GROUP}_FULFILLED`]: setGroup,
  [`${FETCH_ROLES_FOR_GROUP}_PENDING`]: setRecordRolesLoadingState,
  [`${FETCH_ROLES_FOR_GROUP}_FULFILLED`]: setRolesForGroup,
  [`${FETCH_ROLES_FOR_EXPANDED_GROUP}_PENDING`]: setRolesForExpandedGroupLoading,
  [`${FETCH_ROLES_FOR_EXPANDED_GROUP}_FULFILLED`]: setRolesForExpandedGroup,
  [`${FETCH_SERVICE_ACCOUNTS_FOR_GROUP}_PENDING`]: setAccountsForGroupLoading,
  [`${FETCH_SERVICE_ACCOUNTS_FOR_GROUP}_FULFILLED`]: setAccountsForGroup,
  [`${FETCH_MEMBERS_FOR_GROUP}_PENDING`]: setMembersForGroupLoading,
  [`${FETCH_MEMBERS_FOR_GROUP}_FULFILLED`]: setMembersForGroup,
  [`${FETCH_MEMBERS_FOR_EXPANDED_GROUP}_PENDING`]: setMembersForExpandedGroupLoading,
  [`${FETCH_MEMBERS_FOR_EXPANDED_GROUP}_FULFILLED`]: setMembersForExpandedGroup,
  [`${FETCH_ADD_ROLES_FOR_GROUP}_PENDING`]: setAddRolesLoading,
  [`${FETCH_ADD_ROLES_FOR_GROUP}_FULFILLED`]: setAddRolesForGroup,
  [RESET_SELECTED_GROUP]: resetSelectedGroup,
  [UPDATE_GROUPS_FILTERS]: setFilters,
};
