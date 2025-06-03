import React from 'react';
import { useWorkspacesStore, WorkspacesStoreProvider } from './WorkspacesStore';

const ManagedSelector = () => {
  const { store, isFetchingWorkspacesFromRBAC, setIsFetchingWorkspacesFromRBAC } = useWorkspacesStore();

  return (
    <WorkspacesStoreProvider>
      <div>
        <p>{isFetchingWorkspacesFromRBAC ? 'fetching' : 'not fetching'}</p>
        <button onClick={() => setIsFetchingWorkspacesFromRBAC(!isFetchingWorkspacesFromRBAC)}>Toggle Fetching Workspaces</button>
        <p>{JSON.stringify(store)}</p>
      </div>
    </WorkspacesStoreProvider>
  );
};

export default ManagedSelector;
