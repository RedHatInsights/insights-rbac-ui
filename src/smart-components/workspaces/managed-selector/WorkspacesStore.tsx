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

  // this function wraps a callback to notify subscribers when called
  const notify = <A extends unknown[], R>(cb: (...args: A) => R) => {
    return (...args: A): R => {
      const cbRes = cb(...args);
      subs.forEach((sub) => sub());
      return cbRes;
    };
  };

  const subscribe = (callback: () => void) => {
    const id = crypto.randomUUID();
    subs.set(id, callback);
    return () => {
      subs.delete(id);
    };
  };

  const setIsWorkspacesMenuExpanded = notify((isExpanded: boolean) => {
    store.isWorkspacesMenuExpanded = isExpanded;
  });

  const setIsFetchingWorkspacesFromRBAC = notify((isFetching: boolean) => {
    store.isFetchingWorkspacesFromRBAC = isFetching;
  });

  const setIsFetchingWorkspacesFromRBACError = notify((isError: boolean) => {
    store.isFetchingWorkspacesFromRBACError = isError;
  });

  const setSelectedWorkspace = notify((workspace: TreeViewWorkspaceItem | undefined) => {
    store.selectedWorkspace = workspace;
  });

  const setFetchedWorkspaces = notify((workspaces: Workspace[]) => {
    store.fetchedWorkspaces = workspaces;
  });

  const setWorkspaceTree = notify((tree?: TreeViewWorkspaceItem) => {
    store.workspaceTree = tree;
  });

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
