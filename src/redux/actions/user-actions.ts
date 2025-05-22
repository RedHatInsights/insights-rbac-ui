import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { createIntl, createIntlCache, useIntl } from 'react-intl';
import { locale } from '../../AppEntry';
import * as UserHelper from '../../helpers/user/user-helper';
import { ActionConfig, AddUsersData, FetchUsersParams, UpdateUserOrgAdmin, UpdateUserStatus } from '../../helpers/user/user-helper';
import providerMessages from '../../locales/data.json';
import messages from '../../Messages';
import * as ActionTypes from '../action-types';

export function useUserActions() {
  const intl = useIntl();
  const chrome = useChrome();
  const addUsers = (usersData: AddUsersData, config: ActionConfig): ActionWithNotification<ReturnType<typeof UserHelper.addUsers>> => {
    return {
      type: ActionTypes.ADD_USERS,
      payload: UserHelper.addUsers(usersData, chrome.auth.getToken, config),
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
  const updateUserIsOrgAdminStatus = (
    user: UpdateUserOrgAdmin,
    config: ActionConfig
  ): ActionWithNotification<ReturnType<typeof UserHelper.updateUserIsOrgAdminStatus>> => {
    const cache = createIntlCache();
    const intl = createIntl({ locale, messages: providerMessages[locale] }, cache);
    return {
      type: ActionTypes.UPDATE_USER_IS_ORG_ADMIN_STATUS,
      payload: UserHelper.updateUserIsOrgAdminStatus(user, chrome.auth.getToken, config),
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

  const changeUsersStatus = (
    userList: UpdateUserStatus[],
    config: ActionConfig
  ): ActionWithNotification<ReturnType<typeof UserHelper.changeUsersStatus>> => {
    const cache = createIntlCache();
    const intl = createIntl({ locale, messages: providerMessages[locale] }, cache);
    return {
      type: ActionTypes.CHANGE_USERS_STATUS,
      payload: UserHelper.changeUsersStatus(userList, chrome.auth.getToken, config),
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

  return { addUsers, updateUserIsOrgAdminStatus, changeUsersStatus };
}

export const fetchUsers = (apiProps: FetchUsersParams): SimpleAction<Promise<any>> => ({
  type: ActionTypes.FETCH_USERS,
  payload: UserHelper.fetchUsers(apiProps),
});

export const updateUsersFilters = (filters: Record<string, any>): SimpleAction<Record<string, any>> => ({
  type: ActionTypes.UPDATE_USERS_FILTERS,
  payload: filters,
});
