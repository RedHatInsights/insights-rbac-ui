import { RoleBindingsRole } from '@redhat-cloud-services/rbac-client/v2/types';
import { FETCH_WORKSPACE, FETCH_WORKSPACES } from './action-types';

export interface WorkspaceCreateBody {
  id?: string;
  name: string;
  description: string;
  children?: Workspace[];
  parent_id: string;
}

export interface Workspace extends WorkspaceCreateBody {
  id: string;
  type: 'standard' | 'default' | 'root' | 'ungrouped-hosts';
  parent_id: string;
}

export interface RoleBindingsUser {
  username: string;
}

export interface RoleBindingsGroup {
  name: string;
  description?: string;
  user_count?: number;
}

export interface RoleBindingsSubject {
  id: string;
  type: 'user' | 'group';
  user?: RoleBindingsUser;
  group?: RoleBindingsGroup;
}

export interface RoleBindingsProject {
  name: string;
  description?: string;
}

export interface RoleBindingsWorkspace {
  name: string;
  type: string;
  description?: string;
}

export interface RoleBindingsResource {
  id: string;
  type: 'project' | 'workspace';
  project?: RoleBindingsProject;
  workspace?: RoleBindingsWorkspace;
}

export interface RoleBindingBySubject {
  last_modified: string;
  subject: RoleBindingsSubject;
  roles: RoleBindingsRole[];
  resource: RoleBindingsResource;
}
export interface WorkspacesStore {
  isLoading: boolean;
  workspaces: Workspace[];
  error: string;
  selectedWorkspace: Workspace;
}

export interface RoleBindingsBySubjectStore {
  isLoading: boolean;
  roleBindings: RoleBindingBySubject[];
  error: string;
  selectedRoleBinding: RoleBindingBySubject;
}

export const RoleBindingsInitialState = {
  isLoading: false,
  roleBindings: [],
  error: '',
  selectedRoleBinding: undefined,
};

export const workspacesInitialState = {
  isLoading: false,
  workspaces: [],
  error: '',
  selectedWorkspace: undefined,
};

const setLoadingState = (state: WorkspacesStore) => ({ ...state, isLoading: true });

const setLoadingDetailState = (state: WorkspacesStore) => ({ ...state, isLoading: true });

const setWorkspaces = (state: WorkspacesStore, { payload }: { payload: { data: Workspace } }) => ({
  ...state,
  workspaces: payload.data,
  isLoading: false,
});

const setWorkspace = (state: WorkspacesStore, { payload }: { payload: { data: Workspace } }) => ({
  ...state,
  selectedWorkspace: payload,
  isLoading: false,
});

const setError = (state: WorkspacesStore, { payload }: { payload: Error }) => ({
  ...state,
  error: payload.message || 'Failed to load workspaces',
  isLoading: false,
});

const setWorkspaceError = (state: WorkspacesStore, { payload }: { payload: Error }) => ({
  ...state,
  error: payload.message || 'Failed to load workspace',
  isLoading: false,
});

export const isWorkspace = (data: unknown | Workspace): data is Workspace => {
  return (data as Workspace).id !== undefined && (data as Workspace).parent_id !== undefined && (data as Workspace).type !== undefined;
};

export default {
  [`${FETCH_WORKSPACES}_PENDING`]: setLoadingState,
  [`${FETCH_WORKSPACES}_FULFILLED`]: setWorkspaces,
  [`${FETCH_WORKSPACES}_REJECTED`]: setError,
  [`${FETCH_WORKSPACE}_PENDING`]: setLoadingDetailState,
  [`${FETCH_WORKSPACE}_FULFILLED`]: setWorkspace,
  [`${FETCH_WORKSPACE}_REJECTED`]: setWorkspaceError,
};
