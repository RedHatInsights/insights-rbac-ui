import { SearchInput } from '@patternfly/react-core/dist/dynamic/components/SearchInput';
import { Stack } from '@patternfly/react-core/dist/dynamic/layouts/Stack';
import { StackItem } from '@patternfly/react-core/dist/dynamic/layouts/Stack';
import { TreeViewDataItem } from '@patternfly/react-core/dist/dynamic/components/TreeView';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import messages from '../../../../../Messages';
import { type WorkspaceRelation, type WorkspaceWithPermissions } from '../../../../data/queries/workspaces';
import { useWorkspacesWithPermissions } from '../../hooks/useWorkspacesWithPermissions';
import buildWorkspaceTree from './WorkspaceTreeBuilder';
import { filterWorkspaceItem } from './ManagedWorkspaceSelector';
import { type TreeViewWorkspaceItem, instanceOfTreeViewWorkspaceItem } from './TreeViewWorkspaceItem';
import { WorkspaceTreeView } from './components/WorkspaceTreeView';

export interface InlineWorkspacePickerProps {
  /** Permission required to select a workspace (e.g. 'create', 'move'). Disables non-permitted workspaces. */
  requiredPermission?: WorkspaceRelation;
  /** Extra workspace IDs to disable beyond permission checks */
  extraDisabledIds?: Set<string>;
  /** Per-ID tooltip overrides for extra disabled items (takes precedence over the permission tooltip) */
  extraDisabledTooltipOverrides?: Map<string, string>;
  /** Currently selected workspace */
  selectedWorkspace?: TreeViewWorkspaceItem;
  /** Selection callback */
  onSelect: (workspace: TreeViewWorkspaceItem | null) => void;
  /** Whether to start fully expanded (default: true) */
  allExpanded?: boolean;
}

/**
 * Reusable inline workspace tree picker with search, permission gating,
 * and custom disabled states. Used by the create-workspace wizard and
 * the move-workspace dialog.
 *
 * Fetches workspaces and resolves Kessel permissions internally.
 */
export const InlineWorkspacePicker: React.FC<InlineWorkspacePickerProps> = ({
  requiredPermission,
  extraDisabledIds,
  extraDisabledTooltipOverrides,
  selectedWorkspace,
  onSelect,
  allExpanded = true,
}) => {
  const intl = useIntl();

  const { workspaces, status, isError } = useWorkspacesWithPermissions({ limit: 10000 });
  const isTreeLoading = status !== 'ready';

  const [searchInputValue, setSearchInputValue] = useState('');

  // Permission-based disabled IDs
  const permissionDisabledIds = useMemo<Set<string>>(() => {
    if (!requiredPermission || status !== 'ready') return new Set();
    return new Set(workspaces.filter((ws: WorkspaceWithPermissions) => !ws.permissions[requiredPermission]).map((ws) => ws.id));
  }, [workspaces, requiredPermission, status]);

  // Merge permission-disabled + extra-disabled into one set
  const disabledIds = useMemo<Set<string>>(() => {
    if (!extraDisabledIds || extraDisabledIds.size === 0) return permissionDisabledIds;
    return new Set([...permissionDisabledIds, ...extraDisabledIds]);
  }, [permissionDisabledIds, extraDisabledIds]);

  // Default tooltip for permission-based disabling
  const disabledTooltip = useMemo(() => {
    if (!requiredPermission) return undefined;
    return intl.formatMessage(
      {
        id: 'workspaceSelectorDisabledTooltip',
        description: 'Tooltip shown on disabled workspace tree items when the user lacks the required permission',
        defaultMessage: 'You do not have {permission} permission on this workspace',
      },
      { permission: requiredPermission },
    );
  }, [requiredPermission, intl]);

  // Clear selection if it falls into the disabled set after permissions settle
  useEffect(() => {
    if (selectedWorkspace?.id && disabledIds.has(selectedWorkspace.id)) {
      onSelect(null);
    }
  }, [disabledIds, selectedWorkspace?.id, onSelect]);

  // Build workspace tree from flat list
  const workspaceTree = useMemo(() => {
    if (workspaces.length === 0) return undefined;
    const convertedWorkspaces = workspaces.map((ws: WorkspaceWithPermissions) => ({
      id: ws.id,
      parent_id: ws.parent_id ?? undefined,
      type: ws.type,
      name: ws.name,
      description: ws.description,
      created: ws.created,
      updated: ws.modified,
    }));
    return buildWorkspaceTree(convertedWorkspaces);
  }, [workspaces]);

  const filteredTreeElements = useMemo(() => {
    if (!workspaceTree) return [] as TreeViewWorkspaceItem[];
    const trimmed = searchInputValue.trim();
    if (!trimmed) return [workspaceTree];
    const filteredRoot = filterWorkspaceItem(workspaceTree, trimmed);
    return filteredRoot ? [filteredRoot] : [];
  }, [workspaceTree, searchInputValue]);

  const areElementsFiltered = allExpanded || searchInputValue.trim().length > 0;

  const handleSelect = useCallback(
    (_: React.MouseEvent, selectedItem: TreeViewDataItem) => {
      if (!instanceOfTreeViewWorkspaceItem(selectedItem)) return;
      if (selectedItem.id && disabledIds.has(selectedItem.id)) return;
      onSelect(selectedItem);
    },
    [disabledIds, onSelect],
  );

  return (
    <Stack hasGutter>
      <StackItem>
        <SearchInput
          placeholder={intl.formatMessage(messages.searchWorkspaces)}
          value={searchInputValue}
          onChange={(_event, value) => setSearchInputValue(value)}
          onClear={() => setSearchInputValue('')}
          aria-label={intl.formatMessage(messages.searchWorkspaces)}
        />
      </StackItem>
      <StackItem isFilled>
        <WorkspaceTreeView
          treeElements={filteredTreeElements}
          areElementsFiltered={areElementsFiltered}
          selectedWorkspace={selectedWorkspace}
          onSelect={handleSelect}
          isLoading={isTreeLoading}
          isError={isError}
          disabledIds={disabledIds}
          disabledTooltip={disabledTooltip}
          disabledTooltipOverrides={extraDisabledTooltipOverrides}
        />
      </StackItem>
    </Stack>
  );
};
