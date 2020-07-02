import {
  FETCH_ROLE,
  FETCH_ROLES,
  FETCH_ROLE_FOR_USER,
  FETCH_ROLES_FOR_WIZARD
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
  rolesForWizard: {
    data: [],
    meta: defaultSettings
  },
  selectedRole: {}
};

const setLoadingState = state => ({ ...state, isLoading: true });
const setRecordLoadingState = state => ({ ...state, isRecordLoading: true });
const setRole = (state, { payload }) => ({ ...state, selectedRole: payload, isRecordLoading: false });
const setRoles = (state, { payload }) => ({ ...state, roles: payload, isLoading: false });
const setRolesWithAccess = (state, { payload }) => ({
  ...state,
  rolesWithAccess: { ...state.rolesWithAccess, [payload.uuid]: payload },
  isRecordLoading: false
});

const setRolesForWizard = (state, { payload }) => ({ ...state, rolesForWizard: payload, isWizardLoading: false });
const setWizardLoadingState = state => ({ ...state, isWizardLoading: true });

export default {
  [`${FETCH_ROLE}_FULFILLED`]: setRole,
  [`${FETCH_ROLE}_PENDING`]: setRecordLoadingState,
  [`${FETCH_ROLES}_FULFILLED`]: setRoles,
  [`${FETCH_ROLES}_PENDING`]: setLoadingState,
  [`${FETCH_ROLE_FOR_USER}_FULFILLED`]: setRolesWithAccess,
  [`${FETCH_ROLE_FOR_USER}_PENDING`]: setRecordLoadingState,
  [`${FETCH_ROLES_FOR_WIZARD}_FULFILLED`]: setRolesForWizard,
  [`${FETCH_ROLES_FOR_WIZARD}_PENDING`]: setWizardLoadingState
};
