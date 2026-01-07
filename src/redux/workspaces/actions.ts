import { WorkspacesDeleteParams } from '@redhat-cloud-services/rbac-client/v2/WorkspacesDelete';
import { WorkspacesPatchParams } from '@redhat-cloud-services/rbac-client/v2/WorkspacesPatch';
import { createIntl, createIntlCache } from 'react-intl';
import {
  createWorkspace as createWorkspaceHelper,
  deleteWorkspace as deleteWorkspaceHelper,
  getRoleBindingsForSubject,
  getWorkspace,
  getWorkspaces,
  moveWorkspace as moveWorkspaceHelper,
  updateWorkspace as updateWorkspaceHelper,
} from './helper';
import providerMessages from '../../locales/data.json';
import { locale } from '../../locales/locale';
import messages from '../../Messages';
import {
  CREATE_WORKSPACE,
  DELETE_WORKSPACE,
  FETCH_ROLE_BINDINGS,
  FETCH_WORKSPACE,
  FETCH_WORKSPACES,
  MOVE_WORKSPACE,
  PATCH_WORKSPACE,
} from './action-types';
import { WorkspaceCreateBody } from './reducer';
import { WorkspacesMoveParams } from '@redhat-cloud-services/rbac-client/v2/WorkspacesMove';
import { RoleBindingsListBySubjectParams } from '@redhat-cloud-services/rbac-client/v2/RoleBindingsListBySubject';

export const fetchWorkspaces = () => ({
  type: FETCH_WORKSPACES,
  payload: getWorkspaces(),
});

export const fetchWorkspace = (workspaceId: string) => ({
  type: FETCH_WORKSPACE,
  payload: getWorkspace(workspaceId),
});

export const createWorkspace = (config: WorkspaceCreateBody) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages as any }, cache); // eslint-disable-line @typescript-eslint/no-explicit-any

  return {
    type: CREATE_WORKSPACE,
    payload: createWorkspaceHelper(config),
    meta: {
      notifications: {
        rejected: (payload?: { detail: string }) => ({
          variant: 'danger',
          title: intl.formatMessage(messages.createWorkspaceErrorTitle, { name: config.name }),
          description: payload?.detail || intl.formatMessage(messages.createWorkspaceErrorDescription),
        }),
        fulfilled: {
          variant: 'success',
          title: intl.formatMessage(messages.createWorkspaceSuccessTitle, { name: config.name }),
        },
      },
    },
  };
};

export const updateWorkspace = (workspaceData: WorkspacesPatchParams) => {
  const cache = createIntlCache();
  const intl = createIntl({ locale, messages: providerMessages as any }, cache); // eslint-disable-line @typescript-eslint/no-explicit-any

  return {
    type: PATCH_WORKSPACE,
    payload: updateWorkspaceHelper(workspaceData),
    meta: {
      notifications: {
        fulfilled: {
          variant: 'success',
          title: intl.formatMessage(messages.editWorkspaceSuccessTitle),
          dismissable: true,
          description: intl.formatMessage(messages.editWorkspaceSuccessDescription),
        },
        rejected: {
          variant: 'danger',
          title: intl.formatMessage(messages.editGroupErrorTitle),
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
    type: DELETE_WORKSPACE,
    payload: deleteWorkspaceHelper(workspaceData),
    meta: {
      notifications: {
        fulfilled: {
          variant: 'success',
          title: intl.formatMessage(messages.deleteWorkspaceSuccessTitle),
          dismissable: true,
          description: intl.formatMessage(messages.deleteWorkspaceSuccessDescription, { workspace: name }),
        },
        rejected: {
          variant: 'danger',
          title: intl.formatMessage(messages.deleteWorkspaceErrorTitle),
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
    type: MOVE_WORKSPACE,
    payload: moveWorkspaceHelper(workspaceData),
    meta: {
      notifications: {
        fulfilled: {
          variant: 'success',
          title: intl.formatMessage(messages.moveWorkspaceSuccessTitle),
          dismissable: true,
          description: intl.formatMessage(messages.moveWorkspaceSuccessDescription, { name }),
        },
        rejected: {
          variant: 'danger',
          title: intl.formatMessage(messages.moveWorkspaceErrorTitle, { name }),
          dismissable: true,
          description: intl.formatMessage(messages.moveWorkspaceErrorDescription, { workspace: name }),
        },
      },
    },
  };
};

export const fetchRoleBindings = (config: RoleBindingsListBySubjectParams) => ({
  type: FETCH_ROLE_BINDINGS,
  payload: getRoleBindingsForSubject(config),
});
