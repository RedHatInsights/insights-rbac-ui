import { defaultSettings } from '../../helpers/shared/pagination';
import {
  FETCH_ROLE,
  FETCH_ROLE_FOR_PRINCIPAL,
  FETCH_ROLE_FOR_USER,
  FETCH_ROLES,
  FETCH_ROLES_FOR_WIZARD,
  UPDATE_ROLES_FILTERS,
} from '../action-types';

// Initial State
export const rolesInitialState: RoleStore = {
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

const setLoadingState = (state: any) => ({ ...state, isLoading: true, error: undefined });
const setRecordLoadingState = (state: RoleStore) => ({ ...state, isRecordLoading: true, error: undefined });
const setRole = (state: RoleStore, { payload }: any) => ({
  ...state,
  ...(!payload.error ? { selectedRole: payload } : payload),
  isRecordLoading: false,
});
const setRoles = (state: RoleStore, { payload }: any) => ({
  ...state,
  ...(!payload.error
    ? {
        roles: {
          pagination: state.roles?.pagination,
          filters: state.roles?.filters,
          ...payload,
        },
      }
    : payload),
  isLoading: false,
});
const setRolesWithAccess = (state: any, { payload }: any) => ({
  ...state,
  rolesWithAccess: { ...state.rolesWithAccess, [payload.uuid]: payload },
  isRecordLoading: false,
});

const setRolesForWizard = (state: RoleStore, { payload }: any) => ({
  ...state,
  rolesForWizard: payload,
  isWizardLoading: false,
});
const setWizardLoadingState = (state: RoleStore) => ({ ...state, isWizardLoading: true });

const setFilters = (state: RoleStore, { payload }: any) => ({ ...state, roles: { ...state.roles, filters: payload } });

export default {
  [`${FETCH_ROLE}_FULFILLED`]: setRole,
  [`${FETCH_ROLE}_PENDING`]: setRecordLoadingState,
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
