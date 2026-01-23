import React, { useCallback, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';
import { WorkspaceListTable } from './components/WorkspaceListTable';
import { type WorkspacesWorkspace, useDeleteWorkspaceMutation, useMoveWorkspaceMutation, useWorkspacesQuery } from '../../data/queries/workspaces';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { MoveWorkspaceDialog } from './components/MoveWorkspaceDialog';
import { TreeViewWorkspaceItem } from './components/managed-selector/TreeViewWorkspaceItem';
import WorkspaceType from './components/managed-selector/WorkspaceType';
import messages from '../../Messages';

interface Permission {
  permission: string;
  resourceDefinitions: { attributeFilter: { value: string[] } }[];
}

// Convert workspace to TreeViewWorkspaceItem
const convertToTreeViewItem = (workspace: WorkspacesWorkspace): TreeViewWorkspaceItem => ({
  name: workspace.name ?? '',
  id: workspace.id ?? '',
  workspace: {
    id: workspace.id ?? '',
    name: workspace.name ?? '',
    description: workspace.description,
    type: (workspace.type as WorkspaceType) ?? 'standard',
    parent_id: workspace.parent_id ?? '',
  },
  children: [],
});

export const WorkspaceList = () => {
  const chrome = useChrome();
  const intl = useIntl();
  const addNotification = useAddNotification();

  // React Query for workspaces
  const { data: workspacesData, isLoading, isError } = useWorkspacesQuery();
  const workspaces = React.useMemo(() => workspacesData?.data ?? [], [workspacesData?.data]);
  const error: string | null = isError ? 'Failed to fetch workspaces' : null;

  // Mutations
  const deleteWorkspaceMutation = useDeleteWorkspaceMutation();
  const moveWorkspaceMutation = useMoveWorkspaceMutation();

  // User permissions state - use lazy initializer to avoid creating new array on every render
  const [userPermissions, setUserPermissions] = useState<Permission>(() => ({
    permission: '',
    resourceDefinitions: [],
  }));

  // Move modal state
  const [currentMoveWorkspace, setCurrentMoveWorkspace] = useState<WorkspacesWorkspace | null>(null);

  // Derived state - modal is open when we have a workspace to move
  const isMoveModalOpen = currentMoveWorkspace !== null;
  const isMoveSubmitting = moveWorkspaceMutation.isPending;

  // Fetch user permissions on mount only (chrome changes reference every render)
  useEffect(() => {
    chrome.getUserPermissions().then((permissions) => {
      const foundPermission = permissions.find(({ permission }) => ['inventory:groups:write', 'inventory:groups:*'].includes(permission));
      if (foundPermission) {
        setUserPermissions({
          permission: foundPermission.permission,
          resourceDefinitions: (foundPermission.resourceDefinitions || []) as { attributeFilter: { value: string[] } }[],
        });
      }
    });
  }, []); // Only run on mount - chrome has unstable reference

  // Action handlers using React Query mutations
  const handleDeleteWorkspaces = useCallback(
    async (workspacesToDelete: WorkspacesWorkspace[]) => {
      try {
        // Delete workspaces sequentially to allow proper notification handling
        for (const workspace of workspacesToDelete) {
          if (workspace.id) {
            await deleteWorkspaceMutation.mutateAsync({ id: workspace.id, name: workspace.name });
          }
        }
        // Additional notification for multiple workspaces
        if (workspacesToDelete.length > 1) {
          addNotification({
            variant: 'success',
            title: intl.formatMessage(messages.deleteWorkspaceSuccessTitle),
            description: intl.formatMessage(messages.deleteWorkspaceSuccessDescription, {
              workspace: workspacesToDelete.map((w) => w.name).join(', '),
            }),
          });
        }
      } catch (err) {
        console.error('Failed to delete workspaces:', err);
        // Error notification is handled by the mutation
      }
    },
    [deleteWorkspaceMutation, addNotification, intl],
  );

  const handleMoveWorkspace = useCallback(
    async (workspace: WorkspacesWorkspace, targetParentId: string) => {
      if (!targetParentId) {
        // Open the move modal for user to select target
        setCurrentMoveWorkspace(workspace);
        return;
      }

      // Direct move operation when target is already known
      try {
        if (workspace.id) {
          await moveWorkspaceMutation.mutateAsync({
            id: workspace.id,
            parent_id: targetParentId,
            name: workspace.name,
          });
        }
        // Success notification is handled by the mutation
      } catch (err) {
        console.error('Failed to move workspace:', err);
        // Error notification is handled by the mutation
      }
    },
    [moveWorkspaceMutation],
  );

  const handleMoveWorkspaceConfirm = useCallback(
    async (destinationWorkspace: TreeViewWorkspaceItem) => {
      if (currentMoveWorkspace && destinationWorkspace.id) {
        try {
          await handleMoveWorkspace(currentMoveWorkspace, destinationWorkspace.id);
          setCurrentMoveWorkspace(null);
        } catch (err) {
          console.error('Failed to move workspace in dialog:', err);
        }
      }
    },
    [currentMoveWorkspace, handleMoveWorkspace],
  );

  // Memoize initial selected workspace to prevent infinite loop
  const initialSelectedWorkspace = React.useMemo(() => {
    if (!currentMoveWorkspace) {
      return null;
    }

    // Find the current parent workspace to pre-select
    const currentParentWorkspace = workspaces.find((ws) => ws.id === currentMoveWorkspace.parent_id);

    // We should always have a parent workspace, but fallback to root if not found
    const workspace = currentParentWorkspace || workspaces.find((ws) => ws.type === 'root') || workspaces[0];

    return workspace ? convertToTreeViewItem(workspace) : null;
  }, [currentMoveWorkspace, workspaces]);

  const sourceWorkspace = React.useMemo(() => {
    return currentMoveWorkspace ? convertToTreeViewItem(currentMoveWorkspace) : undefined;
  }, [currentMoveWorkspace]);

  return (
    <WorkspaceListTable
      workspaces={workspaces}
      isLoading={isLoading}
      error={error}
      onDeleteWorkspaces={handleDeleteWorkspaces}
      onMoveWorkspace={handleMoveWorkspace}
      userPermissions={userPermissions}
    >
      {/* Move workspace modal - only render when there's a workspace to move */}
      {currentMoveWorkspace && initialSelectedWorkspace && (
        <MoveWorkspaceDialog
          isOpen={isMoveModalOpen}
          onClose={() => {
            setCurrentMoveWorkspace(null);
          }}
          onSubmit={handleMoveWorkspaceConfirm}
          workspaceToMove={currentMoveWorkspace}
          availableWorkspaces={workspaces}
          isSubmitting={isMoveSubmitting}
          initialSelectedWorkspace={initialSelectedWorkspace}
          sourceWorkspace={sourceWorkspace}
        />
      )}
    </WorkspaceListTable>
  );
};

export default WorkspaceList;
