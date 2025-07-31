import {
  ADD_ROLE,
  FETCH_ROLE,
  FETCH_ROLES,
  FETCH_ROLES_FOR_WIZARD,
  FETCH_ROLE_FOR_PRINCIPAL,
  FETCH_ROLE_FOR_USER,
  PATCH_ROLE,
  REMOVE_ROLE,
  RESET_SELECTED_ROLE,
  UPDATE_ROLE,
  UPDATE_ROLES_FILTERS,
} from './action-types';
import { createIntl, createIntlCache } from 'react-intl';
import messages from '../../Messages';
import providerMessages from '../../locales/data.json';
import {
  FetchRolesParams,
  FetchRolesWithPoliciesParams,
  createRole as createRoleHelper,
  fetchRoleForPrincipal as fetchRoleForPrincipalHelper,
  fetchRole as fetchRoleHelper,
  fetchRoles as fetchRolesHelper,
  fetchRolesWithPolicies as fetchRolesWithPoliciesHelper,
  patchRole as patchRoleHelper,
  removeRole as removeRoleHelper,
  removeRolePermissions as removeRolePermissionsHelper,
  updateRole as updateRoleHelper,
} from './helper';
import { locale } from '../../locales/locale';
import { RoleIn, RolePut, RoleWithAccess } from '@redhat-cloud-services/rbac-client/types';

const BAD_UUID = 'BAD_UUID';

export const createRole = (roleData: RoleIn) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages[locale] }, cache);
  return {
    type: ADD_ROLE,
    payload: createRoleHelper(roleData),
    meta: {
      notifications: {
        rejected: (payload: { errors?: Array<{ detail?: string }> }) => ({
          variant: 'danger',
          title: intl.formatMessage(messages.createRoleErrorTitle),
          dismissDelay: 8000,
          description: payload?.errors?.[0]?.detail || intl.formatMessage(messages.createRoleErrorDescription),
        }),
      },
    },
  };
};

export const fetchRole = (roleId: string) => ({
  type: FETCH_ROLE,
  payload: fetchRoleHelper(roleId).catch((err: { errors?: Array<{ status?: string; source?: string }> }) => {
    const error = err?.errors?.[0] || {};
    if (error.status === '400' && error.source === 'detail') {
      return { error: BAD_UUID };
    }
    throw err;
  }),
});

export const fetchRoles = (options: FetchRolesParams = {}) => ({
  type: FETCH_ROLES,
  payload: fetchRolesHelper(options),
});

export const fetchRolesWithPolicies = (options: FetchRolesWithPoliciesParams = {}) => ({
  type: FETCH_ROLES,
  payload: fetchRolesWithPoliciesHelper(options),
});

export const removeRole = (uuid: string) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages[locale] }, cache);
  return {
    type: REMOVE_ROLE,
    payload: removeRoleHelper(uuid),
    meta: {
      notifications: {
        fulfilled: {
          variant: 'success',
          title: intl.formatMessage(messages.removeRoleSuccessTitle),
          dismissDelay: 8000,
          description: intl.formatMessage(messages.removeRoleSuccessDescription),
        },
        rejected: {
          variant: 'danger',
          title: intl.formatMessage(messages.removeRoleErrorTitle),
          dismissDelay: 8000,
          description: intl.formatMessage(messages.removeRoleErrorDescription),
        },
      },
    },
  };
};

export const fetchRoleForUser = (roleId: string) => ({
  type: FETCH_ROLE_FOR_USER,
  payload: fetchRoleHelper(roleId),
});

export const fetchRoleForPrincipal = (roleId: string) => ({
  type: FETCH_ROLE_FOR_PRINCIPAL,
  payload: fetchRoleForPrincipalHelper(roleId),
});

export const fetchRolesForWizard = (options: FetchRolesParams = {}) => ({
  type: FETCH_ROLES_FOR_WIZARD,
  payload: fetchRolesHelper(options),
});

export const updateRole = (roleId: string, data: RolePut, useCustomAccess: boolean) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages[locale] }, cache);
  return {
    type: UPDATE_ROLE,
    payload: updateRoleHelper(roleId, data, useCustomAccess),
    meta: {
      notifications: {
        fulfilled: {
          variant: 'success',
          title: intl.formatMessage(messages.editRoleSuccessTitle),
          dismissDelay: 8000,
          description: intl.formatMessage(messages.editRoleSuccessDescription),
        },
        rejected: (payload: { errors?: Array<{ detail?: string }> }) => ({
          variant: 'danger',
          title: intl.formatMessage(messages.editRoleErrorTitle),
          dismissDelay: 8000,
          description: payload?.errors?.[0]?.detail || intl.formatMessage(messages.editRoleErrorDescription),
        }),
      },
    },
  };
};

export const patchRole = (roleId: string, data: Partial<RolePut>) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages[locale] }, cache);
  return {
    type: PATCH_ROLE,
    payload: patchRoleHelper(roleId, data),
    meta: {
      notifications: {
        fulfilled: {
          variant: 'success',
          title: intl.formatMessage(messages.editRoleSuccessTitle),
          dismissDelay: 8000,
          description: intl.formatMessage(messages.editRoleSuccessDescription),
        },
      },
    },
  };
};

export const removeRolePermissions = (role: RoleWithAccess, permissionsToRemove: string[]) => ({
  type: UPDATE_ROLE,
  payload: removeRolePermissionsHelper(role, permissionsToRemove),
});

export const updateRolesFilters = (filters: Record<string, unknown>) => ({
  type: UPDATE_ROLES_FILTERS,
  payload: filters,
});

export const resetSelectedRole = () => ({
  type: RESET_SELECTED_ROLE,
});
