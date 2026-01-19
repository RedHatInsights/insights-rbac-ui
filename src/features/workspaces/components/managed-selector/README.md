# ManagedSelector Component

A fully managed workspace selector component for RBAC (Role-Based Access Control) systems, designed to be shared via module federation.

## Overview

`ManagedSelector` provides a complete workspace selection UI with hierarchical tree view, search functionality, loading states, and error handling. It's a self-contained component that manages its own state and fetches workspace data from the RBAC API.

## Features

- **Automatic Data Fetching**: Fetches all workspaces from `/api/rbac/v2/workspaces/` endpoint
- **Hierarchical Tree View**: Displays workspaces in a parent-child tree structure
- **Real-time Search**: Filter workspaces by name with instant results
- **Loading & Error States**: Built-in UI for loading and error scenarios
- **Workspace Exclusion**: Exclude specific workspaces (useful for move/copy operations)
- **Initial Selection**: Support for pre-selecting a workspace on mount
- **Self-Contained State**: Internal state management via `WorkspacesStoreProvider`
- **Accessibility**: Full keyboard navigation and screen reader support

## Basic Usage

```tsx
import { AsyncComponent } from '@redhat-cloud-services/frontend-components';

function MyComponent() {
  const handleWorkspaceSelect = (workspace) => {
    console.log('Selected workspace:', workspace);
    // workspace is a TreeViewWorkspaceItem containing the full workspace data
  };

  return (
    <AsyncComponent
      scope="rbac"
      module="./Workspaces/ManagedSelector"
      onSelect={handleWorkspaceSelect}
      fallback={<div id="fallback-modal" />}
    />
  );
}
```

## Advanced Usage


### Example 1: With Initial Selection and Exclusion

```tsx
import { AsyncComponent } from '@redhat-cloud-services/frontend-components';

function WorkspaceMover({ currentWorkspace, defaultTargetWorkspace }) {
  const handleMove = (targetWorkspace) => {
    // Move resources from currentWorkspace to targetWorkspace
    console.log('Moving from', currentWorkspace.id, 'to', targetWorkspace.id);
  };

  return (
    <AsyncComponent
      scope="rbac"
      module="./Workspaces/ManagedSelector"
      onSelect={handleMove}
      sourceWorkspace={currentWorkspace}
      initialSelectedWorkspace={defaultTargetWorkspace}
      fallback={<div id="fallback-modal" />}
    />
  );
}
```

### Example 2: Workspace Move Dialog

```tsx
import { AsyncComponent } from '@redhat-cloud-services/frontend-components';
import { Modal, Button } from '@patternfly/react-core';
import { useState } from 'react';

export function MoveWorkspaceDialog({ sourceWorkspace, onMove, onClose }) {
  const [targetWorkspace, setTargetWorkspace] = useState(null);

  const handleConfirm = () => {
    if (targetWorkspace) {
      onMove(sourceWorkspace, targetWorkspace);
      onClose();
    }
  };

  return (
    <Modal
      title="Move to Workspace"
      isOpen
      onClose={onClose}
      actions={[
        <Button key="confirm" onClick={handleConfirm} isDisabled={!targetWorkspace}>
          Move
        </Button>,
        <Button key="cancel" variant="link" onClick={onClose}>
          Cancel
        </Button>
      ]}
    >
      <AsyncComponent
        scope="rbac"
        module="./Workspaces/ManagedSelector"
        onSelect={setTargetWorkspace}
        sourceWorkspace={sourceWorkspace}
        fallback={<div id="fallback-modal" />}
      />
    </Modal>
  );
}
```

### Example 3: Custom Workspace Loader

```tsx
import { fetchWorkspacesFromRBAC } from '@rbac/workspaces/ManagedSelector';
import { useEffect, useState } from 'react';

export function CustomWorkspaceLoader() {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        const response = await fetchWorkspacesFromRBAC();
        setWorkspaces(response.data.data);
      } catch (error) {
        console.error('Failed to load workspaces:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWorkspaces();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <ul>
      {workspaces.map((workspace) => (
        <li key={workspace.id}>{workspace.name}</li>
      ))}
    </ul>
  );
}
```


### Using Exported Utilities

The component exports utility functions that can be loaded using `useLoadModule` from `@scalprum/react-core`:

```tsx
import { useLoadModule } from '@scalprum/react-core';

function MyComponent() {
  // Load the fetchWorkspacesFromRBAC function
  const [workspaceModule, error] = useLoadModule(
    {
      scope: 'rbac',
      module: './Workspaces/ManagedSelector',
      importName: 'fetchWorkspacesFromRBAC',
    },
    undefined
  );

  const loadWorkspaces = async () => {
    if (workspaceModule) {
      try {
        const response = await workspaceModule();
        const workspaces = response.data.data;
        console.log('Fetched workspaces:', workspaces);
      } catch (error) {
        console.error('Failed to fetch workspaces:', error);
      }
    }
  };

  if (error) {
    return <div>Error loading workspace module: {error.message}</div>;
  }

  return <button onClick={loadWorkspaces}>Load Workspaces</button>;
}
```

#### Available Exported Functions

You can load any of these exported utilities using `useLoadModule`:

- `fetchWorkspacesFromRBAC` - Fetches all workspaces from RBAC API
- `filterWorkspaceItems` - Recursively filters workspace tree items
- `createWorkspaceDataFetcher` - Creates a data fetcher with store integration
- `createWorkspaceSearchFilter` - Creates a search filter function

#### Example: Using Multiple Exports

```tsx
import { useLoadModule } from '@scalprum/react-core';

function WorkspaceUtilities() {
  const [fetchFn, fetchError] = useLoadModule(
    {
      scope: 'rbac',
      module: './Workspaces/ManagedSelector',
      importName: 'fetchWorkspacesFromRBAC',
    },
    undefined
  );

  const [filterFn, filterError] = useLoadModule(
    {
      scope: 'rbac',
      module: './Workspaces/ManagedSelector',
      importName: 'filterWorkspaceItems',
    },
    undefined
  );

  const handleSearch = (tree, searchTerm) => {
    if (filterFn) {
      return filterFn(tree, searchTerm);
    }
    return false;
  };

  // Use the loaded functions...
}
```

## API Reference

### Component Props

#### `ManagedSelectorProps`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onSelect` | `(workspace: TreeViewDataItem) => void` | No | Callback invoked when a workspace is selected |
| `initialSelectedWorkspace` | `TreeViewWorkspaceItem` | No | Workspace to pre-select on mount |
| `sourceWorkspace` | `TreeViewWorkspaceItem` | No | Workspace to exclude from the tree (useful for move/copy operations) |

### Exported Types

#### `RBACListWorkspacesResponse`
```typescript
interface RBACListWorkspacesResponse {
  data: Workspace[];
}
```

#### `TreeViewWorkspaceItem`
```typescript
interface TreeViewWorkspaceItem extends TreeViewDataItem {
  parentTreeViewItem?: TreeViewWorkspaceItem;
  workspace: Workspace;
}
```

#### `Workspace`
```typescript
interface Workspace {
  id: string;
  parent_id?: string;
  type: WorkspaceType;
  name: string;
  description?: string;
  created?: string;
  updated?: string;
}
```

### Exported Functions

#### `fetchWorkspacesFromRBAC()`
Fetches all workspaces from the RBAC API.

**Returns**: `Promise<AxiosResponse<RBACListWorkspacesResponse>>`

#### `filterWorkspaceItems(item, input)`
Recursively filters workspace tree items based on search input.

**Parameters**:
- `item: TreeViewDataItem | TreeViewWorkspaceItem` - The tree item to filter
- `input: string` - The search string (case-insensitive)

**Returns**: `boolean` - Whether the item should be included in filtered results

#### `createWorkspaceDataFetcher(storeActions, excludeWorkspaceIds)`
Creates a memoized data fetcher function with store integration.

**Parameters**:
- `storeActions: object` - Store action functions for state updates
- `excludeWorkspaceIds?: string[]` - Optional workspace IDs to exclude

**Returns**: Memoized callback function for fetching workspace data

#### `createWorkspaceSearchFilter(workspaceTree, setFilteredTreeElements, setElementsAreFiltered)`
Creates a search filter function for workspace trees.

**Parameters**:
- `workspaceTree: TreeViewWorkspaceItem | undefined` - The root workspace tree
- `setFilteredTreeElements: (elements: TreeViewWorkspaceItem[]) => void` - State setter for filtered elements
- `setElementsAreFiltered: (filtered: boolean) => void` - State setter for filtered status

**Returns**: Function that accepts search input and updates filtered state
