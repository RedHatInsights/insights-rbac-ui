import { TreeViewDataItem } from '@patternfly/react-core/dist/dynamic/components/TreeView';
import * as React from 'react';
import { TreeViewWorkspaceItem, instanceOfTreeViewWorkspaceItem } from './TreeViewWorkspaceItem';
import { WorkspaceTreeView } from './components/WorkspaceTreeView';
import buildWorkspaceTree from './WorkspaceTreeBuilder';
import { WorkspaceMenuToggle } from './components/WorkspaceMenuToggle';
import { WorkspaceSelector } from './components/WorkspaceSelector';
import { type WorkspacesWorkspace, useWorkspacesQuery } from '../../../../data/queries/workspaces';

/**
 * Recursively filters workspace tree items based on search input.
 * Returns a filtered copy of the tree item, or null if no match.
 * Case-insensitive substring matching with parent inclusion when children match.
 */
export const filterWorkspaceItem = (item: TreeViewWorkspaceItem, input: string): TreeViewWorkspaceItem | null => {
  if (!item.name || typeof item.name !== 'string') {
    return null;
  }

  const term = input.toLowerCase();
  const selfMatches = item.name.toLowerCase().includes(term);

  let filteredChildren: TreeViewWorkspaceItem[] | undefined;
  if (item.children?.length) {
    filteredChildren = item.children
      .map((child) => filterWorkspaceItem(child as TreeViewWorkspaceItem, input))
      .filter((child): child is TreeViewWorkspaceItem => child !== null);
  }

  if (!selfMatches && (!filteredChildren || filteredChildren.length === 0)) {
    return null;
  }

  return {
    ...item,
    ...(filteredChildren?.length ? { children: filteredChildren } : {}),
  };
};

/**
 * Props for the ManagedWorkspaceSelector component
 */
export interface ManagedWorkspaceSelectorProps {
  /** Callback when a workspace is selected */
  onSelect?: (workspace: TreeViewDataItem) => void;
  /** Initial workspace to be selected on mount */
  initialSelectedWorkspace?: TreeViewWorkspaceItem;
  /** Workspace to exclude from the tree (useful for move operations) */
  sourceWorkspace?: TreeViewWorkspaceItem;
}

/**
 * ManagedWorkspaceSelector - A workspace selection component with hierarchical tree view.
 *
 * Fetches workspaces from the RBAC API and displays them in a searchable tree.
 * Uses react-query for data fetching with automatic caching and error handling.
 *
 * @example
 * ```tsx
 * <ManagedWorkspaceSelector
 *   onSelect={(workspace) => console.log('Selected:', workspace)}
 *   sourceWorkspace={workspaceToExclude}
 * />
 * ```
 */
export const ManagedWorkspaceSelector: React.FC<ManagedWorkspaceSelectorProps> = ({ onSelect, initialSelectedWorkspace, sourceWorkspace }) => {
  // Fetch workspaces using react-query
  // Use isFetching (not isLoading) to show spinner on every fetch, matching original behavior
  const { data: workspacesData, isFetching, isError, refetch } = useWorkspacesQuery({ limit: 10000 });
  const workspaces = workspacesData?.data ?? [];

  // Build workspace tree from flat list, excluding source workspace if provided
  const workspaceTree = React.useMemo(() => {
    if (workspaces.length === 0) return undefined;

    // Convert WorkspacesWorkspace to the local Workspace type expected by buildWorkspaceTree
    const convertedWorkspaces = workspaces.map((ws: WorkspacesWorkspace) => ({
      id: ws.id,
      parent_id: ws.parent_id ?? undefined,
      type: ws.type,
      name: ws.name,
      description: ws.description,
      created: ws.created,
      updated: ws.modified,
    }));

    const excludeIds = sourceWorkspace?.id ? [sourceWorkspace.id] : undefined;
    return buildWorkspaceTree(convertedWorkspaces, excludeIds);
  }, [workspaces, sourceWorkspace?.id]);

  // Local UI state
  const [isMenuExpanded, setIsMenuExpanded] = React.useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = React.useState<TreeViewWorkspaceItem | undefined>(initialSelectedWorkspace);
  const [searchInputValue, setSearchInputValue] = React.useState('');

  // Set initial selection
  React.useEffect(() => {
    if (initialSelectedWorkspace) {
      setSelectedWorkspace(initialSelectedWorkspace);
    }
  }, [initialSelectedWorkspace]);

  // Derive filtered tree from workspace tree and search input (no mutation, no extra state)
  const { filteredTreeElements, areElementsFiltered } = React.useMemo(() => {
    if (!workspaceTree) {
      return { filteredTreeElements: [] as TreeViewWorkspaceItem[], areElementsFiltered: false };
    }

    const trimmed = searchInputValue.trim();
    if (!trimmed) {
      return { filteredTreeElements: [workspaceTree], areElementsFiltered: false };
    }

    const filteredRoot = filterWorkspaceItem(workspaceTree, trimmed);
    return {
      filteredTreeElements: filteredRoot ? [filteredRoot] : [],
      areElementsFiltered: true,
    };
  }, [workspaceTree, searchInputValue]);

  // Search filter handler - just updates the input, filtering is derived
  const onSearchFilter = React.useCallback((searchInput: string) => {
    setSearchInputValue(searchInput);
  }, []);

  // Selection handler
  const onSelectTreeViewWorkspaceItem = React.useCallback(
    (_: React.MouseEvent, selectedItem: TreeViewDataItem) => {
      if (!instanceOfTreeViewWorkspaceItem(selectedItem)) {
        return;
      }
      setSelectedWorkspace(selectedItem);
      onSelect?.(selectedItem);
    },
    [onSelect],
  );

  // Fetch data handler (for manual refresh)
  const onFetchData = React.useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <WorkspaceSelector
      isMenuExpanded={isMenuExpanded}
      setIsMenuExpanded={setIsMenuExpanded}
      isLoading={isFetching}
      isError={isError}
      selectedItem={selectedWorkspace as TreeViewDataItem | null}
      setSelectedItem={setSelectedWorkspace as React.Dispatch<React.SetStateAction<TreeViewDataItem | null>>}
      treeElements={workspaceTree ? [workspaceTree] : []}
      filteredTreeElements={filteredTreeElements}
      searchInputValue={searchInputValue}
      setSearchInputValue={setSearchInputValue}
      areElementsFiltered={areElementsFiltered}
      onSearchFilter={onSearchFilter}
      onSelectItem={onSelectTreeViewWorkspaceItem}
      onFetchData={onFetchData}
      onButtonClick={() => setIsMenuExpanded(false)}
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
