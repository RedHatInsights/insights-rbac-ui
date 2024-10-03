import { FETCH_WORKSPACES } from '../action-types';

export interface Workspace {
  id: string;
  name: string;
  description: string;
  children?: Workspace[];
}
export interface WorkspacesStore {
  isLoading: boolean;
  workspaces: Workspace[];
  error: string;
}

export const workspacesInitialState = {
  isLoading: false,
  workspaces: [],
  error: '',
};

const setLoadingState = (state: WorkspacesStore) => ({ ...state, isLoading: true });

const setWorkspaces = (state: WorkspacesStore, { payload }: { payload: { data: Workspace } }) => ({
  ...state,
  workspaces: payload.data,
  isLoading: false,
});

export default {
  [`${FETCH_WORKSPACES}_PENDING`]: setLoadingState,
  [`${FETCH_WORKSPACES}_FULFILLED`]: setWorkspaces,
};
