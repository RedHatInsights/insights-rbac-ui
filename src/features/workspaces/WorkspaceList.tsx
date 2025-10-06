import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { WorkspaceListTable } from './components/WorkspaceListTable';
import { deleteWorkspace, fetchWorkspaces, moveWorkspace } from '../../redux/workspaces/actions';
import { RBACStore } from '../../redux/store';
import { Workspace } from '../../redux/workspaces/reducer';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { MoveWorkspaceDialog } from './components/MoveWorkspaceDialog';
import { TreeViewWorkspaceItem } from './components/managed-selector/TreeViewWorkspaceItem';
import WorkspaceType from './components/managed-selector/WorkspaceType';

interface Permission {
  permission: string;
  resourceDefinitions: any[];
}

// Convert workspace to TreeViewWorkspaceItem
const convertToTreeViewItem = (workspace: Workspace): TreeViewWorkspaceItem => ({
  name: workspace.name,
  id: workspace.id,
  workspace: { ...workspace, type: workspace.type as WorkspaceType },
  children: [],
});

export const WorkspaceList = () => {
  const dispatch = useDispatch();
  const chrome = useChrome();

  // All Redux selectors moved from WorkspaceListTable
  const workspaces = useSelector((state: RBACStore) => state.workspacesReducer.workspaces || []);
  const error = useSelector((state: RBACStore) => state.workspacesReducer.error);
  const isLoading = useSelector((state: RBACStore) => state.workspacesReducer.isLoading);

  // User permissions state moved from WorkspaceListTable
  const [userPermissions, setUserPermissions] = useState<Permission>({
    permission: '',
    resourceDefinitions: [],
  });

  // Move modal state
  const [currentMoveWorkspace, setCurrentMoveWorkspace] = useState<Workspace | null>(null);
  const [isMoveSubmitting, setIsMoveSubmitting] = useState(false);

  // Derived state - modal is open when we have a workspace to move
  const isMoveModalOpen = currentMoveWorkspace !== null;

  // All useEffect logic moved from WorkspaceListTable
  useEffect(() => {
    dispatch(fetchWorkspaces());
  }, [dispatch]);

  useEffect(() => {
    chrome.getUserPermissions().then((permissions) => {
      const foundPermission = permissions.find(({ permission }) => ['inventory:groups:write', 'inventory:groups:*'].includes(permission));
      setUserPermissions(foundPermission || { permission: '', resourceDefinitions: [] });
    });
  }, [chrome]);

  // Action handlers with the actual complex logic from WorkspaceListTable
  const handleDeleteWorkspaces = useCallback(
    async (workspaces: Workspace[]) => {
      await Promise.all(workspaces.map(async ({ id, name }) => await dispatch(deleteWorkspace({ id }, { name }))));
      dispatch(fetchWorkspaces());
    },
    [dispatch],
  );

  const handleMoveWorkspace = useCallback(
    async (workspace: Workspace, targetParentId: string) => {
      if (!targetParentId) {
        // Open the move modal for user to select target
        setCurrentMoveWorkspace(workspace);
        return;
      }

      // Direct move operation when target is already known
      try {
        await dispatch(
          moveWorkspace(
            {
              id: workspace.id,
              workspacesMoveWorkspaceRequest: {
                parent_id: targetParentId,
              },
            },
            { name: workspace.name },
          ),
        );
        dispatch(fetchWorkspaces());
      } catch (error) {
        console.error('Failed to move workspace:', error);
      }
    },
    [dispatch],
  );

  const handleMoveWorkspaceConfirm = useCallback(
    async (destinationWorkspace: TreeViewWorkspaceItem) => {
      if (currentMoveWorkspace && destinationWorkspace.id) {
        setIsMoveSubmitting(true);
        try {
          await handleMoveWorkspace(currentMoveWorkspace, destinationWorkspace.id);
          setCurrentMoveWorkspace(null);
        } catch (error) {
          console.error('Failed to move workspace in dialog:', error);
        } finally {
          setIsMoveSubmitting(false);
        }
      }
    },
    [currentMoveWorkspace, handleMoveWorkspace],
  );

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
      {currentMoveWorkspace &&
        (() => {
          // Find the current parent workspace to pre-select
          const currentParentWorkspace = workspaces.find((ws) => ws.id === currentMoveWorkspace.parent_id);

          // We should always have a parent workspace, but fallback to root if not found
          const initialSelectedWorkspace = currentParentWorkspace || workspaces.find((ws) => ws.type === 'root') || workspaces[0];

          return (
            <MoveWorkspaceDialog
              isOpen={isMoveModalOpen}
              onClose={() => {
                setCurrentMoveWorkspace(null);
              }}
              onSubmit={handleMoveWorkspaceConfirm}
              workspaceToMove={currentMoveWorkspace}
              availableWorkspaces={workspaces}
              isSubmitting={isMoveSubmitting}
              initialSelectedWorkspace={convertToTreeViewItem(initialSelectedWorkspace)}
              sourceWorkspace={convertToTreeViewItem(currentMoveWorkspace)}
            />
          );
        })()}
    </WorkspaceListTable>
  );
};

export default WorkspaceList;
