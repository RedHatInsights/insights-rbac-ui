import React, { useCallback, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { AppPlaceholder } from '../../../../shared/components/ui-states/LoaderPlaceholders';
import { type WorkspacesWorkspace, useMoveWorkspaceMutation, useWorkspacesQuery } from '../../../data/queries/workspaces';
import { MoveWorkspaceDialog } from './MoveWorkspaceDialog';
import { type TreeViewWorkspaceItem } from './managed-selector/TreeViewWorkspaceItem';

export interface RoutedMoveDialogProps {
  afterSubmit?: () => void;
  onCancel?: () => void;
}

/**
 * Route wrapper that resolves the workspace from :workspaceId,
 * renders MoveWorkspaceDialog with isOpen=true, and handles the mutation.
 * Navigation callbacks come from outlet context via ElementWrapper.
 */
export const RoutedMoveDialog: React.FC<RoutedMoveDialogProps> = ({ afterSubmit, onCancel }) => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { data: workspacesData, isLoading } = useWorkspacesQuery();
  const moveWorkspaceMutation = useMoveWorkspaceMutation();

  const allWorkspaces = useMemo<WorkspacesWorkspace[]>(() => workspacesData?.data ?? [], [workspacesData]);
  const workspaceToMove = useMemo(() => allWorkspaces.find((ws) => ws.id === workspaceId), [allWorkspaces, workspaceId]);

  const handleSubmit = useCallback(
    async (destination: TreeViewWorkspaceItem) => {
      if (!workspaceToMove?.id || !destination.id) return;
      await moveWorkspaceMutation.mutateAsync({
        id: workspaceToMove.id,
        parent_id: destination.id,
        name: workspaceToMove.name,
      });
      afterSubmit?.();
    },
    [workspaceToMove, moveWorkspaceMutation, afterSubmit],
  );

  const handleClose = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  const notFound = !isLoading && !workspaceToMove;
  useEffect(() => {
    if (notFound) onCancel?.();
  }, [notFound, onCancel]);

  if (isLoading || notFound) {
    return notFound ? null : <AppPlaceholder />;
  }

  return (
    <MoveWorkspaceDialog
      isOpen
      onClose={handleClose}
      onSubmit={handleSubmit}
      workspaceToMove={workspaceToMove!}
      allWorkspaces={allWorkspaces}
      isSubmitting={moveWorkspaceMutation.isPending}
    />
  );
};

export default RoutedMoveDialog;
