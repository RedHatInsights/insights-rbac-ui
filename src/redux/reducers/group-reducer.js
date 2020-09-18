import {
  FETCH_GROUP,
  FETCH_SYSTEM_GROUP,
  FETCH_GROUPS,
  RESET_SELECTED_GROUP,
  FETCH_ROLES_FOR_GROUP,
  FETCH_ADD_ROLES_FOR_GROUP,
  FETCH_MEMBERS_FOR_GROUP,
} from '../../redux/action-types';
import omit from 'lodash/omit';
import { defaultSettings } from '../../helpers/shared/pagination';

// Initial State
export const groupsInitialState = {
  groups: {
    data: [],
    meta: defaultSettings,
  },
  selectedGroup: { addRoles: {}, members: { meta: defaultSettings }, pagination: defaultSettings },
  isLoading: false,
  isRecordLoading: false,
};

const setLoadingState = (state) => ({ ...state, isLoading: true });
const setRecordLoadingState = (state) => ({ ...state, isRecordLoading: true, selectedGroup: { ...state.selectedGroup, loaded: false } });
const setRecordRolesLoadingState = (state) => ({ ...state, isRecordRolesLoading: true, selectedGroup: { ...state.selectedGroup, loaded: false } });
const setGroups = (state, { payload }) => ({ ...state, groups: payload, isLoading: false });
const setSystemGroup = (state, { payload }) => ({ ...state, systemGroup: payload?.data?.filter((group) => group?.platform_default)?.[0] });
const setGroup = (state, { payload }) => ({
  ...state,
  isRecordLoading: false,
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
});
const resetSelectedGroup = (state) => ({ ...state, selectedGroup: undefined });
const setRolesForGroup = (state, { payload }) => ({
  ...state,
  isRecordRolesLoading: false,
  selectedGroup: { ...state.selectedGroup, roles: payload.data, pagination: payload.meta, loaded: true },
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
      ...payload,
    },
  },
});

const setAddRolesLoading = (state) => ({
  ...state,
  selectedGroup: { ...state.selectedGroup, addRoles: { loaded: false } },
});
const setAddRolesForGroup = (state, { payload }) => ({
  ...state,
  selectedGroup: { ...state.selectedGroup, addRoles: { roles: payload.data, pagination: payload.meta, loaded: true } },
});

export default {
  [`${FETCH_GROUPS}_PENDING`]: setLoadingState,
  [`${FETCH_GROUPS}_FULFILLED`]: setGroups,
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
};
