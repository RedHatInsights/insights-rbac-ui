import React, { PropsWithChildren, createContext, useEffect, useMemo, useReducer } from 'react';
import { TreeViewWorkspaceItem } from './TreeViewWorkspaceItem';
import Workspace from './Workspace';

interface WorkspacesStore {
  isWorkspacesMenuExpanded: boolean;
  isFetchingWorkspacesFromRBAC: boolean;
  isFetchingWorkspacesFromRBACError: boolean;
  selectedWorkspace?: TreeViewWorkspaceItem;
  fetchedWorkspaces: Workspace[];
  workspaceTree?: TreeViewWorkspaceItem;
}

const initialStore: WorkspacesStore = {
  isWorkspacesMenuExpanded: false,
  isFetchingWorkspacesFromRBAC: false,
  isFetchingWorkspacesFromRBACError: false,
  selectedWorkspace: undefined,
  fetchedWorkspaces: [],
  workspaceTree: undefined,
};

const createWorkspacesStore = () => {
  const store = { ...initialStore };

  const subs = new Map<string, () => void>();

  const notify = () => {
    subs.forEach((sub) => sub());
  };

  const subscribe = (callback: () => void) => {
    const id = crypto.randomUUID();
    subs.set(id, callback);
    return () => {
      subs.delete(id);
    };
  };

  const setIsWorkspacesMenuExpanded = (isExpanded: boolean) => {
    store.isWorkspacesMenuExpanded = isExpanded;
    notify();
  };

  const setIsFetchingWorkspacesFromRBAC = (isFetching: boolean) => {
    store.isFetchingWorkspacesFromRBAC = isFetching;
    notify();
  };

  const setIsFetchingWorkspacesFromRBACError = (isError: boolean) => {
    store.isFetchingWorkspacesFromRBACError = isError;
    notify();
  };

  const setSelectedWorkspace = (workspace: TreeViewWorkspaceItem | undefined) => {
    store.selectedWorkspace = workspace;
    notify();
  };

  const setFetchedWorkspaces = (workspaces: Workspace[]) => {
    store.fetchedWorkspaces = workspaces;
    notify();
  };

  const setWorkspaceTree = (tree?: TreeViewWorkspaceItem) => {
    store.workspaceTree = tree;
    notify();
  };

  return {
    getStore: () => store,
    subscribe,
    setIsWorkspacesMenuExpanded,
    setIsFetchingWorkspacesFromRBAC,
    setIsFetchingWorkspacesFromRBACError,
    setSelectedWorkspace,
    setFetchedWorkspaces,
    setWorkspaceTree,
  };
};

const workspacesStore = createWorkspacesStore();

const WorkspacesStoreContext = createContext(workspacesStore);

const WorkspacesStoreProvider = (props: PropsWithChildren) => {
  const store = useMemo(() => createWorkspacesStore(), []);
  return <WorkspacesStoreContext.Provider value={store}>{props.children}</WorkspacesStoreContext.Provider>;
};

const useWorkspacesStore = () => {
  const store = React.useContext(WorkspacesStoreContext);

  if (!store) {
    throw new Error('useWorkspacesStore must be used within a WorkspacesStoreProvider');
  }

  const [
    {
      isWorkspacesMenuExpanded,
      isFetchingWorkspacesFromRBAC,
      isFetchingWorkspacesFromRBACError,
      selectedWorkspace,
      fetchedWorkspaces,
      workspaceTree,
    },
    dispatch,
  ] = useReducer(
    () => ({
      isWorkspacesMenuExpanded: store.getStore().isWorkspacesMenuExpanded,
      isFetchingWorkspacesFromRBAC: store.getStore().isFetchingWorkspacesFromRBAC,
      isFetchingWorkspacesFromRBACError: store.getStore().isFetchingWorkspacesFromRBACError,
      selectedWorkspace: store.getStore().selectedWorkspace,
      fetchedWorkspaces: store.getStore().fetchedWorkspaces,
      workspaceTree: store.getStore().workspaceTree,
    }),
    {
      isWorkspacesMenuExpanded: store.getStore().isWorkspacesMenuExpanded,
      isFetchingWorkspacesFromRBAC: store.getStore().isFetchingWorkspacesFromRBAC,
      isFetchingWorkspacesFromRBACError: store.getStore().isFetchingWorkspacesFromRBACError,
      selectedWorkspace: store.getStore().selectedWorkspace,
      fetchedWorkspaces: store.getStore().fetchedWorkspaces,
      workspaceTree: store.getStore().workspaceTree,
    },
  );

  useEffect(() => {
    const unsubscribe = store.subscribe(dispatch);
    return unsubscribe;
  }, [store]);

  const currentStore = store.getStore();

  return {
    store: currentStore,
    isWorkspacesMenuExpanded,
    isFetchingWorkspacesFromRBAC,
    isFetchingWorkspacesFromRBACError,
    selectedWorkspace,
    fetchedWorkspaces,
    workspaceTree,
    setIsWorkspacesMenuExpanded: store.setIsWorkspacesMenuExpanded,
    setIsFetchingWorkspacesFromRBAC: store.setIsFetchingWorkspacesFromRBAC,
    setIsFetchingWorkspacesFromRBACError: store.setIsFetchingWorkspacesFromRBACError,
    setSelectedWorkspace: store.setSelectedWorkspace,
    setFetchedWorkspaces: store.setFetchedWorkspaces,
    setWorkspaceTree: store.setWorkspaceTree,
  };
};

export { WorkspacesStoreProvider, useWorkspacesStore };
