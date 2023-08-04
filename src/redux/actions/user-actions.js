import * as ActionTypes from '../action-types';
import * as UserHelper from '../../helpers/user/user-helper';
import { createIntl, createIntlCache } from 'react-intl';
import messages from '../../Messages';
import providerMessages from '../../locales/data.json';
import { locale } from '../../AppEntry';

export const addUsers = (usersData) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages }, cache);
  return {
    type: ActionTypes.ADD_USERS,
    payload: UserHelper.addUsers(usersData),
    meta: {
      notifications: {
        rejected: (payload) => {
          if(!payload.status) {
            return {
              variant: 'warning',
              title: intl.formatMessage(messages.inviteUsersErrorTitle),
              dismissDelay: 8000,
              dismissable: true,
              description: payload,
            };
          }
          return {
            variant: 'danger',
            title: intl.formatMessage(messages.inviteUsersErrorTitle),
            dismissDelay: 8000,
            dismissable: true,
            description: intl.formatMessage(messages.inviteUsersErrorDescription),
          };
        },
      },
    },
  };
};

export const updateUserIsOrgAdminStatus = (user) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages }, cache);
  return {
    type: ActionTypes.UPDATE_USER_IS_ORG_ADMIN_STATUS,
    payload: UserHelper.updateUserIsOrgAdminStatus(user),
    meta: {
      notifications: {
        fulfilled: {
          variant: 'success',
          title: intl.formatMessage(messages.editUserSuccessTitle),
          dismissDelay: 8000,
          dismissable: true,
          description: intl.formatMessage(messages.editUserSuccessDescription),
        },
        rejected: {
          variant: 'danger',
          title: intl.formatMessage(messages.editUserErrorTitle),
          dismissDelay: 8000,
          dismissable: true,
          description: intl.formatMessage(messages.editUserErrorDescription),
        },
      },
    },
  };
};

export const updateUsers = (userList) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages }, cache);
  return {
    type: ActionTypes.UPDATE_USERS,
    payload: UserHelper.updateUsers(userList),
    meta: {
      notifications: {
        fulfilled: {
          variant: 'success',
          title: intl.formatMessage(messages.editUserSuccessTitle),
          dismissDelay: 8000,
          dismissable: true,
          description: intl.formatMessage(messages.editUserSuccessDescription),
        },
        rejected: {
          variant: 'danger',
          title: intl.formatMessage(messages.editUserErrorTitle),
          dismissDelay: 8000,
          dismissable: true,
          description: intl.formatMessage(messages.editUserErrorDescription),
        },
      },
    },
  };
};

export const fetchUsers = (apiProps) => ({
  type: ActionTypes.FETCH_USERS,
  payload: UserHelper.fetchUsers(apiProps),
});

export const updateUsersFilters = (filters) => ({
  type: ActionTypes.UPDATE_USERS_FILTERS,
  payload: filters,
});
