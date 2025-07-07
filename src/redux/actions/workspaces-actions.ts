import { WorkspacesDeleteParams } from '@redhat-cloud-services/rbac-client/v2/WorkspacesDelete';
import { WorkspacesPatchParams } from '@redhat-cloud-services/rbac-client/v2/WorkspacesPatch';
import { createIntl, createIntlCache } from 'react-intl';
import * as WorkspacesHelper from '../../helpers/workspaces/workspaces-helper';
import providerMessages from '../../locales/data.json';
import { locale } from '../../locales/locale';
import messages from '../../Messages';
import * as ActionTypes from '../action-types';
import { WorkspaceCreateBody } from '../reducers/workspaces-reducer';
import { WorkspacesMoveParams } from '@redhat-cloud-services/rbac-client/v2/WorkspacesMove';

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

export const updateWorkspace = (workspaceData: WorkspacesPatchParams) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages as any }, cache); // eslint-disable-line @typescript-eslint/no-explicit-any

  return {
    type: ActionTypes.PATCH_WORKSPACE,
    payload: WorkspacesHelper.updateWorkspace(workspaceData),
    meta: {
      notifications: {
        fulfilled: {
          variant: 'success',
          title: intl.formatMessage(messages.editWorkspaceSuccessTitle),
          dismissDelay: 8000,
          dismissable: true,
          description: intl.formatMessage(messages.editWorkspaceSuccessDescription),
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

export const deleteWorkspace = (workspaceData: WorkspacesDeleteParams, { name }: { name: string }) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages as any }, cache); // eslint-disable-line @typescript-eslint/no-explicit-any

  return {
    type: ActionTypes.DELETE_WORKSPACE,
    payload: WorkspacesHelper.deleteWorkspace(workspaceData),
    meta: {
      notifications: {
        fulfilled: {
          variant: 'success',
          title: intl.formatMessage(messages.deleteWorkspaceSuccessTitle),
          dismissDelay: 8000,
          dismissable: true,
          description: intl.formatMessage(messages.deleteWorkspaceSuccessDescription, { workspace: name }),
        },
        rejected: {
          variant: 'danger',
          title: intl.formatMessage(messages.deleteWorkspaceErrorTitle),
          dismissDelay: 8000,
          dismissable: true,
          description: intl.formatMessage(messages.deleteWorkspaceErrorDescription, { workspace: name }),
        },
      },
    },
  };
};

export const moveWorkspace = (workspaceData: WorkspacesMoveParams, { name }: { name: string }) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages as any }, cache); // eslint-disable-line @typescript-eslint/no-explicit-any

  return {
    type: ActionTypes.MOVE_WORKSPACE,
    payload: WorkspacesHelper.moveWorkspace(workspaceData),
    meta: {
      notifications: {
        fulfilled: {
          variant: 'success',
          title: intl.formatMessage(messages.moveWorkspaceSuccessTitle),
          dismissDelay: 8000,
          dismissable: true,
          description: intl.formatMessage(messages.moveWorkspaceSuccessDescription, { workspace: name }),
        },
        rejected: {
          variant: 'danger',
          title: intl.formatMessage(messages.moveWorkspaceErrorTitle),
          dismissDelay: 8000,
          dismissable: true,
          description: intl.formatMessage(messages.moveWorkspaceErrorDescription, { workspace: name }),
        },
      },
    },
  };
};
