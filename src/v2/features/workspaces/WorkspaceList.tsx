import React, { useCallback, useState } from 'react';
import { useIntl } from 'react-intl';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';
import { WorkspaceListTable } from './components/WorkspaceListTable';
import { type WorkspacesWorkspace, useDeleteWorkspaceMutation, useMoveWorkspaceMutation } from '../../data/queries/workspaces';
import { useWorkspacesWithPermissions } from './hooks/useWorkspacesWithPermissions';
import { MoveWorkspaceDialog } from './components/MoveWorkspaceDialog';
import { type TreeViewWorkspaceItem } from './components/managed-selector/TreeViewWorkspaceItem';
import messages from '../../../Messages';

export const WorkspaceList = () => {
  const intl = useIntl();
  const addNotification = useAddNotification();

  // Composite hook: workspaces + Kessel permissions (view, edit, delete, create, move)
  const { workspaces, hasPermission, canCreateIn: _canCreateIn, canCreateAny, status, isError } = useWorkspacesWithPermissions();
  const error: string | null = isError ? 'Failed to fetch workspaces' : null;

  // Mutations
  const deleteWorkspaceMutation = useDeleteWorkspaceMutation();
  const moveWorkspaceMutation = useMoveWorkspaceMutation();

  // Move modal state
  const [currentMoveWorkspace, setCurrentMoveWorkspace] = useState<WorkspacesWorkspace | null>(null);

  // Derived state - modal is open when we have a workspace to move
  const isMoveModalOpen = currentMoveWorkspace !== null;
  const isMoveSubmitting = moveWorkspaceMutation.isPending;

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

  return (
    <WorkspaceListTable
      workspaces={workspaces}
      isLoading={status === 'loading'}
      error={error}
      onDeleteWorkspaces={handleDeleteWorkspaces}
      onMoveWorkspace={handleMoveWorkspace}
      hasPermission={hasPermission}
      canCreateAny={canCreateAny}
    >
      {currentMoveWorkspace && (
        <MoveWorkspaceDialog
          isOpen={isMoveModalOpen}
          onClose={() => setCurrentMoveWorkspace(null)}
          onSubmit={handleMoveWorkspaceConfirm}
          workspaceToMove={currentMoveWorkspace}
          allWorkspaces={workspaces}
          isSubmitting={isMoveSubmitting}
        />
      )}
    </WorkspaceListTable>
  );
};

export default WorkspaceList;
