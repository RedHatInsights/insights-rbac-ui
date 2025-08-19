import { ADD_USERS, CHANGE_USERS_STATUS, FETCH_USERS, UPDATE_USERS_FILTERS, UPDATE_USER_IS_ORG_ADMIN_STATUS } from './action-types';
import {
  MANAGE_SUBSCRIPTIONS_VIEW_ALL,
  MANAGE_SUBSCRIPTIONS_VIEW_EDIT_ALL,
  MANAGE_SUBSCRIPTIONS_VIEW_EDIT_USER,
  addUsers as addUsersHelper,
  changeUsersStatus as changeUsersStatusHelper,
  fetchUsers as fetchUsersHelper,
  updateUserIsOrgAdminStatus as updateUserIsOrgAdminStatusHelper,
} from './helper';
import { createIntl, createIntlCache } from 'react-intl';
import messages from '../../Messages';
import providerMessages from '../../locales/data.json';
import { User, UserFilters } from './reducer';
import { locale } from '../../locales/locale';

// Portal subscription permission levels
type PortalSubscriptionPermission =
  | typeof MANAGE_SUBSCRIPTIONS_VIEW_EDIT_USER
  | typeof MANAGE_SUBSCRIPTIONS_VIEW_ALL
  | typeof MANAGE_SUBSCRIPTIONS_VIEW_EDIT_ALL;

// Action payload types
interface AddUsersData {
  emails: string[];
  isAdmin?: boolean; // Changed from isOrgAdmin to match component usage
  message?: string; // Made optional since form might not provide it
  portal_manage_cases?: boolean; // Portal permissions
  portal_download?: boolean;
  portal_manage_subscriptions?: PortalSubscriptionPermission; // Use proper type instead of boolean
}

interface Config {
  isProd: boolean;
  token: string | null; // Allow null since components might pass null
  accountId?: string | number | null; // Handle both string and number since it could come from different sources
}

interface UserOrgAdminUpdate {
  id: string;
  is_org_admin: boolean;
}

interface ErrorPayload {
  status?: number;
  message?: string;
}

// Using global ActionMeta and ReduxAction interfaces from store.d.ts instead of local duplicates

interface FetchUsersApiProps {
  limit?: number; // Made optional since mappedProps returns Partial<T>
  offset?: number;
  orderBy?: string;
  filters?: UserFilters;
  usesMetaInURL?: boolean;
}

/**
 * An action creator function to invite new users to CRC.
 */
export const addUsers = (usersData: AddUsersData, config: Config, itless: boolean): ReduxAction<Promise<Response>> => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: (providerMessages as Record<string, unknown>).en as Record<string, string> }, cache);
  return {
    type: ADD_USERS,
    payload: addUsersHelper(usersData, config, itless),
    meta: {
      notifications: {
        fulfilled: {
          variant: 'success',
          title: 'Invitation sent successfully',
        },
        rejected: (payload: ErrorPayload) => {
          if (!payload.status) {
            return {
              variant: 'warning',
              title: intl.formatMessage(messages.inviteUsersErrorTitle),
              dismissDelay: 8000,
              dismissable: true,
              description: payload.message || 'Unknown error',
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
 */
export const updateUserIsOrgAdminStatus = (user: UserOrgAdminUpdate, config: Config): ReduxAction<Promise<Response | Response[]>> => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: (providerMessages as Record<string, unknown>).en as Record<string, string> }, cache);
  return {
    type: UPDATE_USER_IS_ORG_ADMIN_STATUS,
    payload: updateUserIsOrgAdminStatusHelper(user, config),
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
 */
export const changeUsersStatus = (userList: User[], config: Config): ReduxAction<Promise<Response | Response[]>> => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: (providerMessages as Record<string, unknown>).en as Record<string, string> }, cache);
  return {
    type: CHANGE_USERS_STATUS,
    payload: changeUsersStatusHelper(userList, config),
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

export const fetchUsers = (apiProps: FetchUsersApiProps): ReduxAction<Promise<unknown>> => ({
  type: FETCH_USERS,
  payload: fetchUsersHelper(apiProps),
});

// Using global ActionMeta and ReduxAction interfaces from store.d.ts

export const updateUsersFilters = (filters: Record<string, any>): ReduxAction<Record<string, any>> => ({
  type: UPDATE_USERS_FILTERS,
  payload: filters,
});
