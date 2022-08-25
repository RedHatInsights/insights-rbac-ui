import * as ActionTypes from '../action-types';
import * as RoleHelper from '../../helpers/role/role-helper';
import { BAD_UUID } from '../../helpers/shared/helpers';
import { createIntl, createIntlCache } from 'react-intl';
import messages from '../../Messages';
import providerMessages from '../../locales/data.json';
import { locale } from '../../AppEntry';

export const createRole = (roleData) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages }, cache);
  return {
    type: ActionTypes.ADD_ROLE,
    payload: RoleHelper.createRole(roleData),
    meta: {
      notifications: {
        rejected: (payload) => ({
          variant: 'danger',
          title: intl.formatMessage(messages.createRoleErrorTitle),
          dismissDelay: 8000,
          description: payload?.errors?.[0]?.detail || intl.formatMessage(messages.createRoleErrorDescription),
        }),
      },
    },
  };
};

export const fetchRole = (apiProps) => ({
  type: ActionTypes.FETCH_ROLE,
  payload: RoleHelper.fetchRole(apiProps).catch((err) => {
    const error = err?.errors?.[0] || {};
    if (error.status === '400' && error.source === 'role uuid validation') {
      return { error: BAD_UUID };
    }

    throw err;
  }),
});

export const fetchRoles = (options = {}) => ({
  type: ActionTypes.FETCH_ROLES,
  payload: RoleHelper.fetchRoles(options).catch((err) => {
    const error = err?.errors?.[0] || {};
    if (error.status === '400' && error.source === 'detail') {
      return { error: BAD_UUID };
    }

    throw err;
  }),
});

export const fetchRolesWithPolicies = (options = {}) => ({
  type: ActionTypes.FETCH_ROLES,
  payload: RoleHelper.fetchRolesWithPolicies(options),
});

export const removeRole = (role) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages }, cache);
  return {
    type: ActionTypes.REMOVE_ROLE,
    payload: RoleHelper.removeRole(role),
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

export const fetchRoleForUser = (apiProps) => ({
  type: ActionTypes.FETCH_ROLE_FOR_USER,
  payload: RoleHelper.fetchRole(apiProps),
});

export const fetchRoleForPrincipal = (apiProps) => ({
  type: ActionTypes.FETCH_ROLE_FOR_PRINCIPAL,
  payload: RoleHelper.fetchRoleForPrincipal(apiProps),
});

export const fetchRolesForWizard = (options = {}) => ({
  type: ActionTypes.FETCH_ROLES_FOR_WIZARD,
  payload: RoleHelper.fetchRoles(options),
});

export const updateRole = (roleId, data, useCustomAccess) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages }, cache);
  return {
    type: ActionTypes.UPDATE_ROLE,
    payload: RoleHelper.updateRole(roleId, data, useCustomAccess),
    meta: {
      notifications: {
        rejected: (payload) => ({
          variant: 'danger',
          title: intl.formatMessage(messages.editRoleErrorTitle),
          dismissDelay: 8000,
          description: payload?.errors?.[0]?.detail || intl.formatMessage(messages.editRoleErrorDescription),
        }),
      },
    },
  };
};

export const patchRole = (roleId, data) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages }, cache);
  return {
    type: ActionTypes.PATCH_ROLE,
    payload: RoleHelper.patchRole(roleId, data),
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

export const removeRolePermissions = (role, permissionsToRemove) => ({
  type: ActionTypes.UPDATE_ROLE,
  payload: RoleHelper.removeRolePermissions(role, permissionsToRemove),
});

export const updateRolesFilters = (filters) => ({
  type: ActionTypes.UPDATE_ROLES_FILTERS,
  payload: filters,
});
