import { FETCH_WORKSPACES, FETCH_WORKSPACE } from '../action-types';

export interface WorkspaceCreateBody {
  id?: string;
  name: string;
  description: string;
  children?: Workspace[];
  parent_id?: string;
}

export interface Workspace extends WorkspaceCreateBody {
  id: string;
}

export interface WorkspacesStore {
  isLoading: boolean;
  workspaces: Workspace[];
  error: string;
  selectedWorkspace: Workspace;
}

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
  selectedWorkspace: payload.data,
  isLoading: false,
});

export default {
  [`${FETCH_WORKSPACES}_PENDING`]: setLoadingState,
  [`${FETCH_WORKSPACES}_FULFILLED`]: setWorkspaces,
  [`${FETCH_WORKSPACE}_PENDING`]: setLoadingDetailState,
  [`${FETCH_WORKSPACE}_FULFILLED`]: setWorkspace,
};
