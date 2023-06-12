import * as ActionTypes from '../action-types';
import * as UserHelper from '../../helpers/user/user-helper';
import { createIntl, createIntlCache } from 'react-intl';
import messages from '../../Messages';
import providerMessages from '../../locales/data.json';
import { locale } from '../../AppEntry';

export const addUsers = (usersData) => ({
  type: ActionTypes.ADD_USERS,
  payload: UserHelper.addUsers(usersData).catch((err) => {
    const cache = createIntlCache();
    const intl = createIntl({ locale, messages: providerMessages }, cache);
    const error = err?.errors?.[0] || err;
    if (error.status === '400') {
      return {
        error: true,
      };
    }

    /**
     * Convert any other API error response to not crash notifications.
     * It has different format than other API requests.
     */
    throw {
      title: intl.formatMessage(messages.inviteUsersErrorTitle),
      message: intl.formatMessage(messages.inviteUsersErrorDescription),
      description: intl.formatMessage(messages.inviteUsersErrorDescription),
    };
  }),
});

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
