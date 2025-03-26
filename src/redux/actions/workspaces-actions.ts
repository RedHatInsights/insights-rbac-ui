import * as ActionTypes from '../action-types';
import * as WorkspacesHelper from '../../helpers/workspaces/workspaces-helper';
import { WorkspaceCreateBody, WorkspaceUpdateBody } from '../reducers/workspaces-reducer';
import { createIntl, createIntlCache } from 'react-intl';
import providerMessages from '../../locales/data.json';
import { locale } from '../../AppEntry';
import messages from '../../Messages';

export const fetchWorkspaces = () => ({
  type: ActionTypes.FETCH_WORKSPACES,
  payload: WorkspacesHelper.getWorkspaces(),
});

export const fetchWorkspace = (workspaceId: string) => ({
  type: ActionTypes.FETCH_WORKSPACE,
  payload: WorkspacesHelper.getWorkspace(workspaceId),
});

export const createWorkspace = (config: WorkspaceCreateBody) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages as any }, cache); // eslint-disable-line @typescript-eslint/no-explicit-any

  return {
    type: ActionTypes.CREATE_WORKSPACE,
    payload: WorkspacesHelper.createWorkspace(config),
    meta: {
      notifications: {
        rejected: (payload?: { detail: string }) => ({
          variant: 'danger',
          title: intl.formatMessage(messages.createWorkspaceErrorTitle, { name: config.name }),
          dismissDelay: 8000,
          description: payload?.detail || intl.formatMessage(messages.createWorkspaceErrorDescription),
        }),
        fulfilled: {
          variant: 'success',
          title: intl.formatMessage(messages.createWorkspaceSuccessTitle, { name: config.name }),
          dismissDelay: 8000,
        },
      },
    },
  };
};

export const updateWorkspace = (workspaceData: WorkspaceUpdateBody) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages as any }, cache); // eslint-disable-line @typescript-eslint/no-explicit-any

  return {
    type: ActionTypes.PATCH_WORKSPACE,
    payload: WorkspacesHelper.updateWorkspace(workspaceData),
    meta: {
      notifications: {
        fulfilled: {
          variant: 'success',
          title: intl.formatMessage(messages.updateWorkspaceSuccessTitle),
          dismissDelay: 8000,
          dismissable: true,
          description: intl.formatMessage(messages.updateWorkspaceSuccessDescription),
        },
        rejected: {
          variant: 'danger',
          title: intl.formatMessage(messages.editGroupErrorTitle),
          dismissDelay: 8000,
          dismissable: true,
          description: intl.formatMessage(messages.editGroupErrorDescription),
        },
      },
    },
  };
};
