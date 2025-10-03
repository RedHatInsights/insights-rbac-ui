import { PaginationDefaultI, defaultSettings } from '../../helpers/pagination';
import { FETCH_ROLE, FETCH_ROLES, FETCH_ROLES_FOR_WIZARD, FETCH_ROLE_FOR_PRINCIPAL, FETCH_ROLE_FOR_USER, UPDATE_ROLES_FILTERS } from './action-types';

export interface RoleGroup {
  description: string;
  name: string;
  uuid: string;
}

export interface Access {
  resourceDefinition: any[];
  permission: string;
}

export interface Role {
  description: string;
  name: string;
  display_name: string;
  uuid: string;
  created: string;
  modified: string;
  access: Access[];
  accessCount: number;
  admin_default: boolean;
  applications: string[];
  external_role_id: string;
  external_tenant: string;
  groups_in: RoleGroup[];
  groups_in_count: number;
  platform_default: boolean;
  policyCount: number;
  system: boolean;
}

export interface RoleStore extends Record<string, unknown> {
  selectedRole?: Role;
  isLoading: boolean;
  isRecordLoading: boolean;
  roles: {
    meta: PaginationDefaultI;
    filters: any;
    pagination: PaginationDefaultI & { redirected?: boolean };
    data: Role[];
    error?: any;
  };
  rolesForWizard: {
    data: Role[];
    meta: PaginationDefaultI;
  };
}

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
  selectedRole: undefined,
};

const setLoadingState = (state: RoleStore): RoleStore => ({ ...state, isLoading: true, error: undefined });
const setRecordLoadingState = (state: RoleStore): RoleStore => ({ ...state, isRecordLoading: true, error: undefined });
const setRole = (state: RoleStore, { payload }: any): RoleStore => ({
  ...state,
  ...(!payload.error ? { selectedRole: payload } : payload),
  isRecordLoading: false,
});
const setRoles = (state: RoleStore, { payload }: any): RoleStore => ({
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
const setRolesWithAccess = (state: any, { payload }: any): RoleStore => ({
  ...state,
  rolesWithAccess: { ...state.rolesWithAccess, [payload.uuid]: payload },
  isRecordLoading: false,
});

const setRolesForWizard = (state: RoleStore, { payload }: any): RoleStore => ({
  ...state,
  rolesForWizard: payload,
  isWizardLoading: false,
});
const setWizardLoadingState = (state: RoleStore): RoleStore => ({ ...state, isWizardLoading: true });

const setFilters = (state: RoleStore, { payload }: any): RoleStore => ({
  ...state,
  roles: { ...state.roles, filters: payload },
});

const setRolesError = (state: RoleStore, { payload }: any): RoleStore => ({
  ...state,
  isLoading: false,
  roles: {
    ...state.roles,
    error: payload,
  },
});

export default {
  [`${FETCH_ROLE}_FULFILLED`]: setRole,
  [`${FETCH_ROLE}_PENDING`]: setRecordLoadingState,
  [`${FETCH_ROLES}_FULFILLED`]: setRoles,
  [`${FETCH_ROLES}_PENDING`]: setLoadingState,
  [`${FETCH_ROLES}_REJECTED`]: setRolesError,
  [`${FETCH_ROLE_FOR_USER}_FULFILLED`]: setRolesWithAccess,
  [`${FETCH_ROLE_FOR_USER}_PENDING`]: setRecordLoadingState,
  [`${FETCH_ROLE_FOR_PRINCIPAL}_FULFILLED`]: setRolesWithAccess,
  [`${FETCH_ROLE_FOR_PRINCIPAL}_PENDING`]: setRecordLoadingState,
  [`${FETCH_ROLES_FOR_WIZARD}_FULFILLED`]: setRolesForWizard,
  [`${FETCH_ROLES_FOR_WIZARD}_PENDING`]: setWizardLoadingState,
  [UPDATE_ROLES_FILTERS]: setFilters,
};
