import {
  FETCH_ROLE,
  FETCH_ROLE_DETAILS,
  FETCH_ROLES,
  FETCH_ROLE_FOR_USER,
  FETCH_ROLE_FOR_PRINCIPAL,
  FETCH_ROLES_FOR_WIZARD,
  UPDATE_ROLES_FILTERS,
} from '../../redux/action-types';
import { defaultSettings } from '../../helpers/shared/pagination';

// Initial State
export const rolesInitialState = {
  isLoading: false,
  isRecordLoading: false,
  roles: {
    data: [],
    meta: defaultSettings,
    filters: {},
    pagination: { count: 0 },
  },
  rolesForWizard: {
    data: [],
    meta: defaultSettings,
  },
  selectedRole: {},
};

const setLoadingState = (state) => ({ ...state, isLoading: true, error: undefined });
const setRecordLoadingState = (state) => ({ ...state, isRecordLoading: true, error: undefined });
const setRole = (state, { payload }) => ({
  ...state,
  ...(!payload.error ? { selectedRole: payload } : payload),
  isRecordLoading: false,
});
const setRoles = (state, { payload }) => ({
  ...state,
  ...(!payload.error ? { roles: { ...state.roles, ...payload } } : payload),
  isLoading: false,
});
const setRoleDetailLoading = (state, { meta }) => ({
  ...state,
  roles: {
    ...state.roles,
    data: (state?.roles?.data || []).map((role) => (role.uuid === meta.uuid ? { ...role, isLoading: true } : role)),
  },
});
const setRoleDetails = (state, { payload }) => ({
  ...state,
  roles: {
    ...state.roles,
    data: !payload.error
      ? (state?.roles?.data || []).map((role) => (role.uuid === payload.uuid ? { ...role, ...payload, isLoading: false } : role))
      : state?.roles?.data || [],
  },
});
const setRolesWithAccess = (state, { payload }) => ({
  ...state,
  rolesWithAccess: { ...state.rolesWithAccess, [payload.uuid]: payload },
  isRecordLoading: false,
});

const setRolesForWizard = (state, { payload }) => ({ ...state, rolesForWizard: payload, isWizardLoading: false });
const setWizardLoadingState = (state) => ({ ...state, isWizardLoading: true });

const setFilters = (state, { payload }) => ({ ...state, roles: { ...state.roles, filters: payload } });

export default {
  [`${FETCH_ROLE}_FULFILLED`]: setRole,
  [`${FETCH_ROLE}_PENDING`]: setRecordLoadingState,
  [`${FETCH_ROLE}_FULFILLED`]: setRole,
  [`${FETCH_ROLE_DETAILS}_PENDING`]: setRoleDetailLoading,
  [`${FETCH_ROLE_DETAILS}_FULFILLED`]: setRoleDetails,
  [`${FETCH_ROLES}_FULFILLED`]: setRoles,
  [`${FETCH_ROLES}_PENDING`]: setLoadingState,
  [`${FETCH_ROLE_FOR_USER}_FULFILLED`]: setRolesWithAccess,
  [`${FETCH_ROLE_FOR_USER}_PENDING`]: setRecordLoadingState,
  [`${FETCH_ROLE_FOR_PRINCIPAL}_FULFILLED`]: setRolesWithAccess,
  [`${FETCH_ROLE_FOR_PRINCIPAL}_PENDING`]: setRecordLoadingState,
  [`${FETCH_ROLES_FOR_WIZARD}_FULFILLED`]: setRolesForWizard,
  [`${FETCH_ROLES_FOR_WIZARD}_PENDING`]: setWizardLoadingState,
  [UPDATE_ROLES_FILTERS]: setFilters,
};
