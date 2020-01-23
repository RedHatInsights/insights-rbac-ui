import {
  FETCH_GROUP,
  FETCH_GROUPS,
  RESET_SELECTED_GROUP,
  FETCH_ROLES_FOR_GROUP,
  FETCH_ADD_ROLES_FOR_GROUP
} from '../../redux/action-types';

// Initial State
export const groupsInitialState = {
  groups: {
    data: [],
    meta: {
      count: 0,
      limit: 10,
      offset: 0
    }
  },
  selectedGroup: { addRoles: {}},
  isLoading: false,
  isRecordLoading: false
};

const setLoadingState = state => ({ ...state, isLoading: true });
const setRecordLoadingState = state => ({ ...state, isRecordLoading: true, selectedGroup: { ...state.selectedGroup, loaded: false }});
const setGroups = (state, { payload }) => ({ ...state, groups: payload, isLoading: false });
const setGroup = (state, { payload }) => ({
  ...state,
  groups: {
    ...state.groups,
    data: state.groups.data.map((group) => ({
      ...group,
      ...payload.uuid === group.uuid && { ...payload, loaded: true }
    }))
  },
  selectedGroup: { ...state.selectedGroup, ...payload, loaded: true }
});
const resetSelectedGroup = state => ({ ...state, selectedGroup: undefined });
const setRolesForGroup = (state, { payload }) => ({
  ...state,
  isRecordLoading: false,
  selectedGroup: { ...state.selectedGroup, roles: payload.data, pagination: payload.meta, loaded: true }
});

const setAddRolesLoading = state => ({
  ...state,
  selectedGroup: { ...state.selectedGroup, addRoles: { loaded: false }}
});
const setAddRolesForGroup = (state, { payload }) => ({
  ...state,
  selectedGroup: { ...state.selectedGroup, addRoles: { roles: payload.data, pagination: payload.meta, loaded: true }}
});

export default {
  [`${FETCH_GROUPS}_PENDING`]: setLoadingState,
  [`${FETCH_GROUPS}_FULFILLED`]: setGroups,
  [`${FETCH_GROUP}_PENDING`]: setRecordLoadingState,
  [`${FETCH_GROUP}_FULFILLED`]: setGroup,
  [`${FETCH_ROLES_FOR_GROUP}_PENDING`]: setRecordLoadingState,
  [`${FETCH_ROLES_FOR_GROUP}_FULFILLED`]: setRolesForGroup,
  [`${FETCH_ADD_ROLES_FOR_GROUP}_PENDING`]: setAddRolesLoading,
  [`${FETCH_ADD_ROLES_FOR_GROUP}_FULFILLED`]: setAddRolesForGroup,
  [RESET_SELECTED_GROUP]: resetSelectedGroup
};
