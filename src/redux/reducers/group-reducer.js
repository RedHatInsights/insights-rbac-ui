import {
  FETCH_GROUP,
  FETCH_GROUPS,
  RESET_SELECTED_GROUP
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
  selectedGroup: {},
  isLoading: false,
  isRecordLoading: false
};

const setLoadingState = state => ({ ...state, isLoading: true });
const setRecordLoadingState = state => ({ ...state, isRecordLoading: true });
const setGroups = (state, { payload }) => ({ ...state, groups: payload, isLoading: false });
const setGroup = (state, { payload }) => ({
  ...state,
  groups: {
    ...state.groups,
    data: state.groups.data.map((group) => ({
      ...group,
      ...payload.uuid === group.uuid && { ...payload, loaded: true }
    }))
  }
});
const resetSelectedGroup = state => ({ ...state, selectedGroup: undefined });

export default {
  [`${FETCH_GROUPS}_PENDING`]: setLoadingState,
  [`${FETCH_GROUPS}_FULFILLED`]: setGroups,
  [`${FETCH_GROUP}_PENDING`]: setRecordLoadingState,
  [`${FETCH_GROUP}_FULFILLED`]: setGroup,
  [RESET_SELECTED_GROUP]: resetSelectedGroup
};
