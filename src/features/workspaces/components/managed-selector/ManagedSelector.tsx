import { TreeViewDataItem } from '@patternfly/react-core/dist/dynamic/components/TreeView';
import axios from 'axios';
import * as React from 'react';
import { TreeViewWorkspaceItem, instanceOfTreeViewWorkspaceItem } from './TreeViewWorkspaceItem';
import Workspace from './Workspace';
import { WorkspaceTreeView } from './components/WorkspaceTreeView';
import { WorkspacesStoreProvider, useWorkspacesStore } from './WorkspacesStore';
import buildWorkspaceTree from './WorkspaceTreeBuilder';
import { WorkspaceMenuToggle } from './components/WorkspaceMenuToggle';
import { WorkspaceSelector } from './components/WorkspaceSelector';

/**
 * Response type for the RBAC workspaces list API endpoint
 */
export interface RBACListWorkspacesResponse {
  /**
   * Array of workspace objects returned from the API
   */
  data: Workspace[];
}

/**
 * Fetches all workspaces from the RBAC API
 *
 * @description
 * Makes a GET request to the RBAC v2 workspaces endpoint to retrieve all available
 * workspaces. Uses `Number.MAX_SAFE_INTEGER` as the limit to fetch all workspaces
 * in a single request.
 *
 * @returns Promise that resolves to an Axios response containing the workspace data
 *
 * @throws {AxiosError} When the API request fails
 *
 * @example
 * ```tsx
 * import { fetchWorkspacesFromRBAC } from './ManagedSelector';
 *
 * async function loadWorkspaces() {
 *   try {
 *     const response = await fetchWorkspacesFromRBAC();
 *     const workspaces = response.data.data;
 *     console.log('Fetched workspaces:', workspaces);
 *   } catch (error) {
 *     console.error('Failed to fetch workspaces:', error);
 *   }
 * }
 * ```
 */
export const fetchWorkspacesFromRBAC = () => {
  return axios.get<RBACListWorkspacesResponse>('/api/rbac/v2/workspaces/', {
    params: {
      limit: Number.MAX_SAFE_INTEGER,
    },
  });
};

/**
 * Recursively filters workspace tree items based on search input
 *
 * @description
 * Performs a case-insensitive search through workspace tree items and their children.
 * Returns true if the item's name matches the search input or if any of its descendants
 * match. This enables partial tree filtering where parent nodes are included if any
 * child matches the search criteria.
 *
 * @param item - The tree item to filter (TreeViewDataItem or TreeViewWorkspaceItem)
 * @param input - The search string to filter by (case-insensitive)
 * @returns boolean indicating whether the item should be included in filtered results
 *
 * @remarks
 * - The search is case-insensitive and uses substring matching
 * - Parent items are included if any child matches the search
 * - Items without names or with non-string names are excluded
 * - The function mutates the children array during filtering
 *
 * @example
 * ```tsx
 * import { filterWorkspaceItems } from './ManagedSelector';
 *
 * const workspaceTree = {
 *   name: 'Root',
 *   children: [
 *     { name: 'Development' },
 *     { name: 'Production' }
 *   ]
 * };
 *
 * const shouldInclude = filterWorkspaceItems(workspaceTree, 'dev');
 * // Returns true because 'Development' matches 'dev'
 * ```
 */
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

/**
 * Creates a workspace data fetcher function with store integration
 *
 * @description
 * Factory function that returns a memoized callback for fetching workspaces from the
 * RBAC API and updating the provided store actions. The returned function handles
 * loading states, error states, and automatically builds the workspace tree structure.
 *
 * @param storeActions - Object containing store action functions for state updates
 * @param storeActions.setIsFetchingWorkspacesFromRBAC - Sets the loading state
 * @param storeActions.setIsFetchingWorkspacesFromRBACError - Sets the error state
 * @param storeActions.setFetchedWorkspaces - Stores the raw workspace data
 * @param storeActions.setWorkspaceTree - Stores the built workspace tree
 * @param excludeWorkspaceIds - Optional array of workspace IDs to exclude from the tree
 *
 * @returns A memoized callback function that fetches and processes workspace data
 *
 * @example
 * ```tsx
 * import { createWorkspaceDataFetcher } from './ManagedSelector';
 *
 * const fetchWorkspaces = createWorkspaceDataFetcher(
 *   {
 *     setIsFetchingWorkspacesFromRBAC: (loading) => setLoading(loading),
 *     setIsFetchingWorkspacesFromRBACError: (error) => setError(error),
 *     setFetchedWorkspaces: (workspaces) => setWorkspaces(workspaces),
 *     setWorkspaceTree: (tree) => setTree(tree)
 *   },
 *   ['workspace-id-to-exclude']
 * );
 *
 * // Call the fetcher
 * fetchWorkspaces();
 * ```
 */
export const createWorkspaceDataFetcher = (
  storeActions: {
    setIsFetchingWorkspacesFromRBAC: (loading: boolean) => void;
    setIsFetchingWorkspacesFromRBACError: (error: boolean) => void;
    setFetchedWorkspaces: (workspaces: Workspace[]) => void;
    setWorkspaceTree: (tree: TreeViewWorkspaceItem | undefined) => void;
  },
  excludeWorkspaceIds?: string[],
) => {
  return React.useCallback(() => {
    storeActions.setIsFetchingWorkspacesFromRBAC(true);
    storeActions.setIsFetchingWorkspacesFromRBACError(false);

    fetchWorkspacesFromRBAC()
      .then((rbacResponse) => {
        storeActions.setIsFetchingWorkspacesFromRBAC(false);
        storeActions.setIsFetchingWorkspacesFromRBACError(false);

        // Store the RAW fetched workspaces from RBAC in the state variable
        // Axios wraps response in .data, API returns { data: Workspace[], meta: {...} }
        storeActions.setFetchedWorkspaces(rbacResponse.data.data);

        // Build the tree of workspaces with the fetched results.
        const tree = buildWorkspaceTree(rbacResponse.data.data, excludeWorkspaceIds);
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

/**
 * Creates a workspace search filter function
 *
 * @description
 * Factory function that returns a search filter callback for filtering workspace tree
 * items. The returned function updates the filtered elements state based on the search
 * input, using the filterWorkspaceItems function for recursive filtering.
 *
 * @param workspaceTree - The root workspace tree item to filter
 * @param setFilteredTreeElements - State setter for the filtered tree elements
 * @param setElementsAreFiltered - State setter for the filtered status flag
 *
 * @returns A function that accepts a search input string and updates the filtered state
 *
 * @remarks
 * - Empty search input resets the filter to show the full tree
 * - Non-empty input triggers recursive filtering through the tree
 * - The filter function is not memoized; memoization should be handled by the caller
 *
 * @example
 * ```tsx
 * import { createWorkspaceSearchFilter } from './ManagedSelector';
 *
 * const [filteredElements, setFilteredElements] = useState([]);
 * const [isFiltered, setIsFiltered] = useState(false);
 *
 * const handleSearch = createWorkspaceSearchFilter(
 *   workspaceTree,
 *   setFilteredElements,
 *   setIsFiltered
 * );
 *
 * // Use in search input
 * <SearchInput onChange={(value) => handleSearch(value)} />
 * ```
 */
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

/**
 * Props for the ManagedSelector component
 */
export interface ManagedSelectorProps {
  /**
   * Callback function invoked when a workspace is selected from the tree view.
   * Receives the selected workspace as a TreeViewDataItem.
   */
  onSelect?: (workspace: TreeViewDataItem) => void;

  /**
   * Initial workspace to be selected when the component mounts.
   * If provided, this workspace will be set as the selected workspace in the internal state.
   */
  initialSelectedWorkspace?: TreeViewWorkspaceItem;

  /**
   * Source workspace to exclude from the workspace tree.
   * When provided, this workspace (and its ID) will be filtered out from the fetched workspaces,
   * preventing it from appearing in the tree view. Useful when selecting a target workspace
   * for moving/copying resources from a source workspace.
   */
  sourceWorkspace?: TreeViewWorkspaceItem;
}

// Internal component that uses the store
const ManagedSelectorInternal: React.FC<ManagedSelectorProps> = ({ onSelect, initialSelectedWorkspace, sourceWorkspace }) => {
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
  const fetchWorkspacesFromRBACBuildTree = createWorkspaceDataFetcher(
    {
      setIsFetchingWorkspacesFromRBAC,
      setIsFetchingWorkspacesFromRBACError,
      setFetchedWorkspaces,
      setWorkspaceTree,
    },
    sourceWorkspace && sourceWorkspace.id ? [sourceWorkspace.id] : undefined,
  );

  // Use the exported search filter function
  const onSearchFilter = createWorkspaceSearchFilter(workspaceTree, setFilteredTreeElements, setElementsAreFiltered);

  /**
   * Set initial selected workspace when provided
   */
  React.useEffect(() => {
    if (initialSelectedWorkspace) {
      setSelectedWorkspace(initialSelectedWorkspace);
    }
  }, [initialSelectedWorkspace, setSelectedWorkspace]);

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
      onButtonClick={() => setIsWorkspacesMenuExpanded(false)}
      renderMenuToggle={(props) => (
        <WorkspaceMenuToggle
          menuToggleRef={props.menuToggleRef}
          onMenuToggleClick={props.onMenuToggleClick}
          isDisabled={props.isDisabled}
          isMenuToggleExpanded={props.isMenuToggleExpanded}
          selectedWorkspaceName={(props.selectedItem as TreeViewWorkspaceItem | undefined)?.workspace?.name}
        />
      )}
      renderTreeView={(props) => (
        <WorkspaceTreeView
          treeElements={props.treeElements as TreeViewWorkspaceItem[]}
          areElementsFiltered={props.areElementsFiltered}
          selectedWorkspace={props.selectedItem as TreeViewWorkspaceItem | undefined}
          onSelect={props.onSelect}
          isLoading={props.isLoading}
          isError={props.isError}
        />
      )}
      searchPlaceholder="Find a workspace by name"
      buttonText="Select Workspace"
    />
  );
};

/**
 * ManagedSelector - A workspace selection component for RBAC
 *
 * @description
 * A fully managed workspace selector component that provides a hierarchical tree view
 * of workspaces fetched from the RBAC API. This component handles all internal state
 * management through a dedicated store (WorkspacesStoreProvider) and provides features
 * like search/filtering, loading states, error handling, and workspace selection.
 *
 * @component
 * @module-federation-shared
 *
 * @features
 * - Automatic workspace fetching from `/api/rbac/v2/workspaces/` endpoint
 * - Hierarchical tree view rendering with parent-child relationships
 * - Real-time search and filtering of workspaces by name
 * - Loading and error state handling
 * - Workspace exclusion (useful for move/copy operations)
 * - Initial workspace selection support
 * - Internal state management with WorkspacesStore
 *
 * @architecture
 * The component follows a Provider-Consumer pattern:
 * - `ManagedSelector` (exported): Wraps the internal component with WorkspacesStoreProvider
 * - `ManagedSelectorInternal`: Contains the actual implementation and consumes the store
 * - Store-based state management ensures clean separation of concerns
 *
 * @example Basic usage
 * ```tsx
 * import { AsyncComponent } from '@redhat-cloud-services/frontend-components';
 *
 * function MyComponent() {
 *   const handleWorkspaceSelect = (workspace) => {
 *     console.log('Selected workspace:', workspace);
 *   };
 *
 *   return <AsyncComponent
 *         scope="rbac"
 *         module="./Workspaces/ManagedSelector"
 *         onSelect={handleWorkspaceSelect}
 *         fallback={<div id="fallback-modal" />}
 *       />;
 * }
 * ```
 *
 * @example With initial selection and source exclusion
 * ```tsx
 * import { AsyncComponent } from '@redhat-cloud-services/frontend-components';
 *
 * function WorkspaceMover({ currentWorkspace, defaultTargetWorkspace }) {
 *   const handleMove = (targetWorkspace) => {
 *     // Move resources from currentWorkspace to targetWorkspace
 *   };
 *
 *   return (
 *     <AsyncComponent
 *       scope="rbac"
 *       module="./Workspaces/ManagedSelector"
 *       onSelect={handleMove}
 *       sourceWorkspace={currentWorkspace}
 *       initialSelectedWorkspace={defaultTargetWorkspace}
 *       fallback={<div id="fallback-modal" />}
 *     />
 *   );
 * }
 * ```
 *
 * @api-endpoint `/api/rbac/v2/workspaces/` (GET)
 * @api-response `{ data: Workspace[], meta: {...} }`
 *
 * @exports
 * - `ManagedSelector`: Main component (default export for module federation)
 * - `ManagedSelectorProps`: TypeScript interface for component props
 * - `fetchWorkspacesFromRBAC`: API fetcher function
 * - `filterWorkspaceItems`: Filter function for workspace search
 * - `createWorkspaceDataFetcher`: Factory for creating data fetcher with store integration
 * - `createWorkspaceSearchFilter`: Factory for creating search filter function
 * - `RBACListWorkspacesResponse`: API response type
 *
 * @see {@link TreeViewWorkspaceItem} for workspace tree item structure
 * @see {@link Workspace} for workspace data model
 * @see {@link WorkspacesStoreProvider} for state management details
 */
export const ManagedSelector: React.FC<ManagedSelectorProps> = ({ onSelect, initialSelectedWorkspace, sourceWorkspace }) => {
  return (
    <WorkspacesStoreProvider>
      <ManagedSelectorInternal onSelect={onSelect} initialSelectedWorkspace={initialSelectedWorkspace} sourceWorkspace={sourceWorkspace} />
    </WorkspacesStoreProvider>
  );
};
