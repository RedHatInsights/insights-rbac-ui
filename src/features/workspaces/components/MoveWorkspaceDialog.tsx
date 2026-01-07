import React from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Modal } from '@patternfly/react-core/dist/dynamic/deprecated/components/Modal';
import { ModalVariant } from '@patternfly/react-core/dist/dynamic/deprecated/components/Modal';
import { useIntl } from 'react-intl';
import { Workspace } from '../../../redux/workspaces/reducer';
import { ManagedSelector } from './managed-selector/ManagedSelector';
import { TreeViewWorkspaceItem, instanceOfTreeViewWorkspaceItem } from './managed-selector/TreeViewWorkspaceItem';
import { TreeViewDataItem } from '@patternfly/react-core/dist/dynamic/components/TreeView';
import messages from '../../../Messages';

export interface MoveWorkspaceDialogProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when form is submitted with selected destination workspace */
  onSubmit: (destinationWorkspace: TreeViewWorkspaceItem) => void;
  /** The workspace to be moved */
  workspaceToMove: Workspace | null;
  /** Available workspaces for selection */
  availableWorkspaces: Workspace[];
  /** Whether submission is in progress */
  isSubmitting?: boolean;
  /** Initial selected workspace (typically the current parent) */
  initialSelectedWorkspace: TreeViewWorkspaceItem;
  /** Source workspace being moved (for exclusion from selector) */
  sourceWorkspace?: TreeViewWorkspaceItem;
}

export const MoveWorkspaceDialog: React.FC<MoveWorkspaceDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  workspaceToMove,
  availableWorkspaces,
  isSubmitting = false,
  initialSelectedWorkspace,
  sourceWorkspace,
}) => {
  const intl = useIntl();

  // Modal manages its own internal selection state
  const [selectedDestination, setSelectedDestination] = React.useState<TreeViewWorkspaceItem | null>(initialSelectedWorkspace || null);

  // Reset selection when modal opens/closes or workspace changes
  React.useEffect(() => {
    if (isOpen && initialSelectedWorkspace) {
      setSelectedDestination(initialSelectedWorkspace);
    } else if (!isOpen) {
      // Reset to initial when closed
      setSelectedDestination(initialSelectedWorkspace || null);
    }
  }, [isOpen, initialSelectedWorkspace]);

  const handleSubmit = () => {
    if (selectedDestination && workspaceToMove) {
      onSubmit(selectedDestination);
    }
  };

  const handleDestinationChange = (workspace: TreeViewWorkspaceItem | null) => {
    setSelectedDestination(workspace);
  };

  // Don't render if no workspace to move
  if (!workspaceToMove) {
    return null;
  }

  // Find the current parent workspace for comparison
  const currentParentWorkspace = availableWorkspaces.find((ws) => ws.id === workspaceToMove.parent_id);

  // Check if the selected destination is different from current parent
  const isDestinationChanged = selectedDestination && initialSelectedWorkspace && selectedDestination.id !== initialSelectedWorkspace.id;

  return (
    <Modal
      ouiaId={'move-workspace-modal'}
      isOpen={isOpen}
      variant={ModalVariant.medium}
      title={`Move "${workspaceToMove.name}"`}
      onClose={onClose}
      actions={[
        <Button key="submit" variant="primary" onClick={handleSubmit} isDisabled={!selectedDestination || isSubmitting} isLoading={isSubmitting}>
          Submit
        </Button>,
        <Button key="cancel" variant="link" onClick={onClose} isDisabled={isSubmitting}>
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
          <ManagedSelector
            onSelect={(workspace: TreeViewDataItem) => {
              // Convert TreeViewDataItem to TreeViewWorkspaceItem if possible
              if (instanceOfTreeViewWorkspaceItem(workspace)) {
                handleDestinationChange(workspace);
              } else {
                handleDestinationChange(null);
              }
            }}
            initialSelectedWorkspace={initialSelectedWorkspace}
            sourceWorkspace={sourceWorkspace}
          />
        </div>

        {isDestinationChanged && currentParentWorkspace && (
          <p>
            This will move {workspaceToMove.name} from under <strong>{currentParentWorkspace.name}</strong> to under{' '}
            <strong>{selectedDestination?.name}</strong>.
          </p>
        )}
      </div>
    </Modal>
  );
};
