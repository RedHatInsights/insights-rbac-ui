import {
  FETCH_GROUP,
  FETCH_ADMIN_GROUP,
  FETCH_SYSTEM_GROUP,
  FETCH_GROUPS,
  RESET_SELECTED_GROUP,
  FETCH_ROLES_FOR_GROUP,
  FETCH_ADD_ROLES_FOR_GROUP,
  FETCH_MEMBERS_FOR_GROUP,
  UPDATE_GROUPS_FILTERS,
} from '../../redux/action-types';
import omit from 'lodash/omit';
import { defaultSettings } from '../../helpers/shared/pagination';

// Initial State
export const groupsInitialState = {
  groups: {
    data: [],
    meta: defaultSettings,
    filters: {},
    pagination: { ...defaultSettings, count: 0 },
  },
  selectedGroup: { addRoles: {}, members: { meta: defaultSettings }, pagination: defaultSettings },
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
  isRecordRolesLoading: true,
  selectedGroup: { ...state.selectedGroup, error: undefined, loaded: false },
});
const setGroups = (state, { payload }) => ({ ...state, groups: payload, isLoading: false });
const setAdminGroup = (state, { payload }) => ({ ...state, adminGroup: payload?.data?.filter((group) => group?.admin_default)?.[0] });
const setSystemGroup = (state, { payload }) => ({ ...state, systemGroup: payload?.data?.filter((group) => group?.platform_default)?.[0] });
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
  isRecordRolesLoading: false,
  selectedGroup: {
    ...state.selectedGroup,
    ...(!payload.error ? { roles: payload.data, pagination: payload.meta } : payload),
    loaded: true,
  },
});

const setMembersForGroupLoading = (state = {}) => ({
  ...state,
  selectedGroup: {
    ...(state.selectedGroup || {}),
    members: { isLoading: true },
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
  [`${FETCH_SYSTEM_GROUP}_PENDING`]: setLoadingState,
  [`${FETCH_SYSTEM_GROUP}_FULFILLED`]: setSystemGroup,
  [`${FETCH_GROUP}_PENDING`]: setRecordLoadingState,
  [`${FETCH_GROUP}_FULFILLED`]: setGroup,
  [`${FETCH_ROLES_FOR_GROUP}_PENDING`]: setRecordRolesLoadingState,
  [`${FETCH_ROLES_FOR_GROUP}_FULFILLED`]: setRolesForGroup,
  [`${FETCH_MEMBERS_FOR_GROUP}_PENDING`]: setMembersForGroupLoading,
  [`${FETCH_MEMBERS_FOR_GROUP}_FULFILLED`]: setMembersForGroup,
  [`${FETCH_ADD_ROLES_FOR_GROUP}_PENDING`]: setAddRolesLoading,
  [`${FETCH_ADD_ROLES_FOR_GROUP}_FULFILLED`]: setAddRolesForGroup,
  [RESET_SELECTED_GROUP]: resetSelectedGroup,
  [UPDATE_GROUPS_FILTERS]: setFilters,
};
