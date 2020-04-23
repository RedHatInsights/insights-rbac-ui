import {
  FETCH_ROLE,
  FETCH_ROLES
} from '../../redux/action-types';
import { defaultSettings } from '../../helpers/shared/pagination';

// Initial State
export const rolesInitialState = {
  isLoading: false,
  isRecordLoading: false,
  roles: {
    data: [],
    meta: defaultSettings
  },
  selectedRole: {}
};

const setLoadingState = state => ({ ...state, isLoading: true });
const setRecordLoadingState = state => ({ ...state, isRecordLoading: true });
const setRole = (state, { payload }) => ({ ...state, selectedRole: payload, isRecordLoading: false });
const setRoles = (state, { payload }) => ({ ...state, roles: payload, isLoading: false });

export default {
  [`${FETCH_ROLE}_FULFILLED`]: setRole,
  [`${FETCH_ROLE}_PENDING`]: setRecordLoadingState,
  [`${FETCH_ROLES}_FULFILLED`]: setRoles,
  [`${FETCH_ROLES}_PENDING`]: setLoadingState
};
