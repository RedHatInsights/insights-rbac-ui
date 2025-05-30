import React from 'react';
import { useWorkspacesStore, WorkspacesStoreProvider } from './WorkspacesStore';

const ManagedSelector = () => {
  const { store, isFetchingWorkspacesFromRBAC, setIsFetchingWorkspacesFromRBAC } = useWorkspacesStore();

  return (
    <WorkspacesStoreProvider>
      <div>
        <h1>Managed Selector</h1>
        <p>{JSON.stringify(store)}</p>
        <button onClick={() => setIsFetchingWorkspacesFromRBAC(!isFetchingWorkspacesFromRBAC)}>Toggle Fetching Workspaces</button>
      </div>
    </WorkspacesStoreProvider>
  );
};

export default ManagedSelector;
