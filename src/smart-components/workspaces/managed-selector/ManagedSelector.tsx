import { TreeViewDataItem } from '@patternfly/react-core/dist/dynamic/components/TreeView';
import axios from 'axios';
import * as React from 'react';
import { TreeViewWorkspaceItem, instanceOfTreeViewWorkspaceItem } from './TreeViewWorkspaceItem';
import Workspace from './Workspace';
import WorkspaceTreeView from './WorkspaceTreeView';
import { WorkspacesStoreProvider, useWorkspacesStore } from './WorkspacesStore';
import buildWorkspaceTree from './WorkspaceTreeBuilder';
import WorkspaceMenuToggle from './WorkspaceMenuToggle';
import WorkspaceSelector from './WorkspaceSelector';

interface RBACListWorkspacesResponse {
  data: Workspace[];
}

// Exported fetch function
export const fetchWorkspacesFromRBAC = () => {
  return axios.get<RBACListWorkspacesResponse>('/api/rbac/v2/workspaces/', {
    params: {
      limit: Number.MAX_SAFE_INTEGER,
    },
  });
};

// Exported search/filter function
export const filterWorkspaceItems = (item: TreeViewDataItem | TreeViewWorkspaceItem, input: string): boolean => {
  // When the item does not have a name, which is an edge case that shouldn't
  // happen, then it can never be part of the filtered results.
  if (!item.name) {
    return false;
  }

  // When the item's name isn't a string, we can't really compare it to the
  // given input.
  if (typeof item.name !== 'string') {
    return false;
  }

  // Match the current item's name and mark it as a partial match, since we
  // are interested in returning the item's children too in the case that
  // we've got a match.
  const partiallyMatched = item.name.toLowerCase().includes(input.toLowerCase());

  // When the item has children, we need to repeat the process to see if we
  // should include the subtree in the results too.
  if (item.children) {
    return (
      partiallyMatched ||
      (item.children = item.children.map((opt) => Object.assign({}, opt)).filter((child) => filterWorkspaceItems(child, input))).length > 0
    );
  } else {
    return partiallyMatched;
  }
};

// Exported function to create a workspace data fetcher with store integration
export const createWorkspaceDataFetcher = (storeActions: {
  setIsFetchingWorkspacesFromRBAC: (loading: boolean) => void;
  setIsFetchingWorkspacesFromRBACError: (error: boolean) => void;
  setFetchedWorkspaces: (workspaces: Workspace[]) => void;
  setWorkspaceTree: (tree: TreeViewWorkspaceItem | undefined) => void;
}) => {
  return React.useCallback(() => {
    storeActions.setIsFetchingWorkspacesFromRBAC(true);
    storeActions.setIsFetchingWorkspacesFromRBACError(false);

    fetchWorkspacesFromRBAC()
      .then((rbacResponse) => {
        storeActions.setIsFetchingWorkspacesFromRBAC(false);
        storeActions.setIsFetchingWorkspacesFromRBACError(false);

        // Store the RAW fetched workspaces from RBAC in the state variable
        storeActions.setFetchedWorkspaces(rbacResponse.data.data);

        // Build the tree of workspaces with the fetched results.
        const tree = buildWorkspaceTree(rbacResponse.data.data);
        storeActions.setWorkspaceTree(tree);
      })
      .catch((error) => {
        storeActions.setIsFetchingWorkspacesFromRBAC(false);
        storeActions.setIsFetchingWorkspacesFromRBACError(true);
        console.log(`Unable to fetch workspaces from RBAC: ${error}`);
      });
  }, [
    storeActions.setIsFetchingWorkspacesFromRBAC,
    storeActions.setIsFetchingWorkspacesFromRBACError,
    storeActions.setFetchedWorkspaces,
    storeActions.setWorkspaceTree,
  ]);
};

// Exported function to create a workspace search filter
export const createWorkspaceSearchFilter = (
  workspaceTree: TreeViewWorkspaceItem | undefined,
  setFilteredTreeElements: (elements: TreeViewWorkspaceItem[]) => void,
  setElementsAreFiltered: (filtered: boolean) => void,
) => {
  return (searchInput: string) => {
    if (searchInput === '') {
      // With an empty input we just reset the tree to the full original tree.
      setFilteredTreeElements(workspaceTree ? [workspaceTree] : []);
      setElementsAreFiltered(false);
    } else {
      // When there's no tree there's nothing to filter.
      if (!workspaceTree) {
        setElementsAreFiltered(false);
        return;
      }

      // Filter the elements and the subelements of the given tree.
      const filteredElements = [workspaceTree].map((item) => Object.assign({}, item)).filter((item) => filterWorkspaceItems(item, searchInput));
      setFilteredTreeElements(filteredElements);
      setElementsAreFiltered(true);
    }
  };
};

interface ManagedSelectorProps {
  onSelect?: (workspace: TreeViewDataItem) => void;
}

// Internal component that uses the store
const ManagedSelectorInternal: React.FC<ManagedSelectorProps> = ({ onSelect }) => {
  const {
    isWorkspacesMenuExpanded,
    setIsWorkspacesMenuExpanded,
    isFetchingWorkspacesFromRBAC,
    setIsFetchingWorkspacesFromRBAC,
    isFetchingWorkspacesFromRBACError,
    setIsFetchingWorkspacesFromRBACError,
    selectedWorkspace,
    setSelectedWorkspace,
    setFetchedWorkspaces,
    workspaceTree,
    setWorkspaceTree,
  } = useWorkspacesStore();

  const [searchInputValue, setSearchInputValue] = React.useState<string>('');
  const [filteredTreeElements, setFilteredTreeElements] = React.useState<TreeViewWorkspaceItem[]>(workspaceTree ? [workspaceTree] : []);
  const [areElementsFiltered, setElementsAreFiltered] = React.useState<boolean>(false);

  // Use the exported data fetcher function
  const fetchWorkspacesFromRBACBuildTree = createWorkspaceDataFetcher({
    setIsFetchingWorkspacesFromRBAC,
    setIsFetchingWorkspacesFromRBACError,
    setFetchedWorkspaces,
    setWorkspaceTree,
  });

  // Use the exported search filter function
  const onSearchFilter = createWorkspaceSearchFilter(workspaceTree, setFilteredTreeElements, setElementsAreFiltered);

  /**
   * Every time the workspaces tree changes, reset the search filter
   */
  React.useEffect(() => {
    if (!workspaceTree) {
      return;
    }

    // Reset the search filter and the filtered elements to the new tree.
    setSearchInputValue('');
    setFilteredTreeElements([workspaceTree]);
    setElementsAreFiltered(false);
  }, [workspaceTree]);

  const onSelectTreeViewWorkspaceItem = (_: React.MouseEvent, selectedItem: TreeViewDataItem) => {
    if (!instanceOfTreeViewWorkspaceItem(selectedItem)) {
      return;
    }

    // Update the state variable which contains the selected workspace.
    setSelectedWorkspace(selectedItem);
    if (onSelect) {
      onSelect(selectedItem);
    }
  };

  return (
    <WorkspaceSelector
      isMenuExpanded={isWorkspacesMenuExpanded}
      setIsMenuExpanded={setIsWorkspacesMenuExpanded}
      isLoading={isFetchingWorkspacesFromRBAC}
      isError={isFetchingWorkspacesFromRBACError}
      selectedItem={selectedWorkspace as TreeViewDataItem | null}
      setSelectedItem={setSelectedWorkspace as React.Dispatch<React.SetStateAction<TreeViewDataItem | null>>}
      treeElements={workspaceTree ? [workspaceTree] : []}
      filteredTreeElements={filteredTreeElements}
      searchInputValue={searchInputValue}
      setSearchInputValue={setSearchInputValue}
      areElementsFiltered={areElementsFiltered}
      onSearchFilter={onSearchFilter}
      onSelectItem={onSelectTreeViewWorkspaceItem}
      onFetchData={fetchWorkspacesFromRBACBuildTree}
      renderMenuToggle={(props) => (
        <WorkspaceMenuToggle
          menuToggleRef={props.menuToggleRef}
          onMenuToggleClick={props.onMenuToggleClick}
          isDisabled={props.isDisabled}
          isMenuToggleExpanded={props.isMenuToggleExpanded}
          selectedWorkspace={props.selectedItem as TreeViewWorkspaceItem | undefined}
        />
      )}
      renderTreeView={(props) => (
        <WorkspaceTreeView
          treeElements={props.treeElements as TreeViewWorkspaceItem[]}
          areElementsFiltered={props.areElementsFiltered}
          selectedWorkspace={props.selectedItem as TreeViewWorkspaceItem | undefined}
          onSelect={props.onSelect}
          isLoading={props.isLoading}
        />
      )}
      searchPlaceholder="Find a workspace by name"
      buttonText="View workspace list"
    />
  );
};

// Main component that provides the store context
const ManagedSelector: React.FC<ManagedSelectorProps> = ({ onSelect }) => {
  return (
    <WorkspacesStoreProvider>
      <ManagedSelectorInternal onSelect={onSelect} />
    </WorkspacesStoreProvider>
  );
};

export default ManagedSelector;
