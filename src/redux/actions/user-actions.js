import * as ActionTypes from '../action-types';
import * as UserHelper from '../../helpers/user/user-helper';
import { createIntl, createIntlCache } from 'react-intl';
import messages from '../../Messages';
import providerMessages from '../../locales/data.json';

import { locale } from '../../locales/locale';

/**
 * An action creator function to invite new users to CRC.
 * @param { emails: string[], isOrgAdmin: boolean, message: string } usersData data to be sent to server.
 * @param { isProd: boolean, token: string } config config object with env and token.
 * @returns action to be dispatched
 */
export const addUsers = (usersData, config) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages }, cache);
  return {
    type: ActionTypes.ADD_USERS,
    payload: UserHelper.addUsers(usersData, config),
    meta: {
      notifications: {
        fulfilled: {
          variant: 'success',
          title: 'Invitation sent successfully',
        },
        rejected: (payload) => {
          if (!payload.status) {
            return {
              variant: 'warning',
              title: intl.formatMessage(messages.inviteUsersErrorTitle),
              dismissDelay: 8000,
              dismissable: true,
              description: payload,
            };
          }
          if (payload.status === 409) {
            return {
              variant: 'danger',
              title: intl.formatMessage(messages.inviteUsersErrorTitle),
              dismissDelay: 8000,
              dismissable: true,
              description: intl.formatMessage(messages.inviteUsersConflictDescription),
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

/**
 * An action creator function to promote/demote an user to be org. admin in CRC.
 * @param {id: UUID, is_org_admin: boolean} user to be promoted to organization administrator.
 * @param { isProd: boolean, token: string } config config object with env and token.
 * @returns action to be dispatched
 */
export const updateUserIsOrgAdminStatus = (user, config) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages }, cache);
  return {
    type: ActionTypes.UPDATE_USER_IS_ORG_ADMIN_STATUS,
    payload: UserHelper.updateUserIsOrgAdminStatus(user, config),
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

/**
 * An action creator function to change user status to active/inactive in CRC.
 * @param {User} userList list of users to change their status.
 * @param { isProd: boolean, token: string } config config object with env and token.
 * @returns action to be dispatched
 */
export const changeUsersStatus = (userList, config) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages }, cache);
  return {
    type: ActionTypes.CHANGE_USERS_STATUS,
    payload: UserHelper.changeUsersStatus(userList, config),
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
