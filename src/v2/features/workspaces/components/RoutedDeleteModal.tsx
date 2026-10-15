import React, { useCallback, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { AppPlaceholder } from '../../../../shared/components/ui-states/LoaderPlaceholders';
import { type WorkspacesWorkspace, useDeleteWorkspaceMutation, useWorkspacesQuery } from '../../../data/queries/workspaces';
import { DeleteWorkspaceModal } from './DeleteWorkspaceModal';

export interface RoutedDeleteModalProps {
  afterSubmit?: () => void;
  onCancel?: () => void;
}

/**
 * Route wrapper that resolves the workspace from :workspaceId,
 * renders DeleteWorkspaceModal with isOpen=true, and handles the mutation.
 * Navigation callbacks come from outlet context via ElementWrapper.
 */
export const RoutedDeleteModal: React.FC<RoutedDeleteModalProps> = ({ afterSubmit, onCancel }) => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { data: workspacesData, isLoading } = useWorkspacesQuery();
  const deleteWorkspaceMutation = useDeleteWorkspaceMutation();

  const allWorkspaces = useMemo<WorkspacesWorkspace[]>(() => workspacesData?.data ?? [], [workspacesData]);
  const workspaceToDelete = useMemo(() => allWorkspaces.find((ws) => ws.id === workspaceId), [allWorkspaces, workspaceId]);

  const hasAssets = useMemo(
    () => (workspaceToDelete ? allWorkspaces.some((ws) => ws.parent_id === workspaceToDelete.id) : false),
    [allWorkspaces, workspaceToDelete],
  );

  const handleConfirm = useCallback(async () => {
    if (!workspaceToDelete?.id) return;
    await deleteWorkspaceMutation.mutateAsync({ id: workspaceToDelete.id, name: workspaceToDelete.name });
    afterSubmit?.();
  }, [workspaceToDelete, deleteWorkspaceMutation, afterSubmit]);

  const handleClose = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  const notFound = !isLoading && !workspaceToDelete;
  useEffect(() => {
    if (notFound) onCancel?.();
  }, [notFound, onCancel]);

  if (isLoading || notFound) {
    return notFound ? null : <AppPlaceholder />;
  }

  return <DeleteWorkspaceModal isOpen onClose={handleClose} onConfirm={handleConfirm} workspaces={[workspaceToDelete!]} hasAssets={hasAssets} />;
};

export default RoutedDeleteModal;
