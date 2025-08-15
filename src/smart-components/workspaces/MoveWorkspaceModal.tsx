import React, { useEffect, useState } from 'react';
import { Button, Modal, ModalVariant } from '@patternfly/react-core';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { Workspace } from '../../redux/reducers/workspaces-reducer';
import { RBACStore } from '../../redux/store';
import { fetchWorkspaces, moveWorkspace } from '../../redux/actions/workspaces-actions';
import ManagedSelector from './managed-selector/ManagedSelector';
import { TreeViewWorkspaceItem } from './managed-selector/TreeViewWorkspaceItem';
import WorkspaceType from './managed-selector/WorkspaceType';
import messages from '../../Messages';

interface MoveWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceToMove: Workspace | null;
}

const MoveWorkspaceModal: React.FC<MoveWorkspaceModalProps> = ({ isOpen, onClose, workspaceToMove }) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const [selectedDestinationWorkspace, setSelectedDestinationWorkspace] = useState<any>(null);
  const [initialSelectedWorkspace, setInitialSelectedWorkspace] = useState<TreeViewWorkspaceItem | null>(null);

  const { workspaces } = useSelector((state: RBACStore) => ({
    workspaces: state.workspacesReducer.workspaces || [],
  }));

  // Helper function to convert a workspace to TreeViewWorkspaceItem format
  const convertWorkspaceToTreeViewItem = (workspace: Workspace): TreeViewWorkspaceItem => {
    return {
      name: workspace.name,
      id: workspace.id,
      workspace: { ...workspace, type: workspace.type as WorkspaceType },
      children: [],
    };
  };

  useEffect(() => {
    if (workspaceToMove) {
      // Find and set the parent workspace as the initial selection
      const parentWorkspace = workspaces.find((ws) => ws.id === workspaceToMove.parent_id);
      if (parentWorkspace) {
        const parentTreeViewItem = convertWorkspaceToTreeViewItem(parentWorkspace);
        setSelectedDestinationWorkspace(parentTreeViewItem);
        setInitialSelectedWorkspace(parentTreeViewItem);
      }
    } else {
      setSelectedDestinationWorkspace(null);
      setInitialSelectedWorkspace(null);
    }
  }, [workspaceToMove, workspaces]);

  const handleSubmit = async () => {
    if (workspaceToMove && selectedDestinationWorkspace) {
      await dispatch(
        moveWorkspace(
          {
            id: workspaceToMove.id,
            workspacesMoveWorkspaceRequest: {
              parent_id: selectedDestinationWorkspace.id,
            },
          },
          { name: workspaceToMove.name },
        ),
      );
      dispatch(fetchWorkspaces());
      onClose();
    }
  };

  if (!workspaceToMove) {
    return null;
  }

  return (
    <Modal
      ouiaId={'move-workspace-modal'}
      isOpen={isOpen}
      variant={ModalVariant.medium}
      title={`Move "${workspaceToMove.name}"`}
      onClose={onClose}
      actions={[
        <Button key="submit" variant="primary" onClick={handleSubmit} isDisabled={!selectedDestinationWorkspace}>
          Submit
        </Button>,
        <Button key="cancel" variant="link" onClick={onClose}>
          {intl.formatMessage(messages.cancel)}
        </Button>,
      ]}
    >
      <div>
        <p>
          Moving a workspace may change who is able to access it and their permissions. Make sure you review the differences between each
          workspaces&apos; user groups and roles before clicking Submit.
        </p>

        <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
          <h4 style={{ marginBottom: '0.5rem' }}>Parent workspace</h4>
          <ManagedSelector onSelect={setSelectedDestinationWorkspace} initialSelectedWorkspace={initialSelectedWorkspace || undefined} />
        </div>

        {selectedDestinationWorkspace && initialSelectedWorkspace && selectedDestinationWorkspace.id !== initialSelectedWorkspace.id && (
          <p>
            This will move {workspaceToMove.name} from under <strong>{workspaces.find((ws) => ws.id === workspaceToMove.parent_id)?.name}</strong> to
            under <strong>{selectedDestinationWorkspace.name}</strong>.
          </p>
        )}
      </div>
    </Modal>
  );
};

export default MoveWorkspaceModal;
