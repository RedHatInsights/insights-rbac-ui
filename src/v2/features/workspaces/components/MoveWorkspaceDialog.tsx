import React, { useCallback, useMemo, useState } from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { Modal } from '@patternfly/react-core/dist/dynamic/deprecated/components/Modal';
import { ModalVariant } from '@patternfly/react-core/dist/dynamic/deprecated/components/Modal';
import { useIntl } from 'react-intl';
import messages from '../../../../Messages';
import { type WorkspacesWorkspace } from '../../../data/queries/workspaces';
import { getModalContainer } from '../../../../shared/helpers/modal-container';
import { InlineWorkspacePicker } from './managed-selector/InlineWorkspacePicker';
import { type TreeViewWorkspaceItem } from './managed-selector/TreeViewWorkspaceItem';
import { getWorkspaceDescendantIds } from './managed-selector/WorkspaceTreeBuilder';

export interface MoveWorkspaceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (destinationWorkspace: TreeViewWorkspaceItem) => void;
  /** The workspace being moved */
  workspaceToMove: WorkspacesWorkspace;
  /** All workspaces (used to compute descendant IDs for disabling) */
  allWorkspaces: WorkspacesWorkspace[];
  isSubmitting?: boolean;
}

export const MoveWorkspaceDialog: React.FC<MoveWorkspaceDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  workspaceToMove,
  allWorkspaces,
  isSubmitting = false,
}) => {
  const intl = useIntl();
  const [selectedDestination, setSelectedDestination] = useState<TreeViewWorkspaceItem | null>(null);

  React.useEffect(() => {
    if (!isOpen) {
      setSelectedDestination(null);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (selectedDestination) {
      onSubmit(selectedDestination);
    }
  };

  // Compute the set of workspace IDs to disable: the source, its descendants, and the current parent
  const sourceDisabledIds = useMemo<Set<string>>(() => {
    const ids = new Set<string>();
    if (!workspaceToMove.id) return ids;
    ids.add(workspaceToMove.id);
    if (workspaceToMove.parent_id) {
      ids.add(workspaceToMove.parent_id);
    }
    const simpleWorkspaces = allWorkspaces.map((ws) => ({
      id: ws.id ?? '',
      parent_id: ws.parent_id ?? undefined,
      type: ws.type ?? '',
      name: ws.name ?? '',
    }));
    for (const descendantId of getWorkspaceDescendantIds(workspaceToMove.id, simpleWorkspaces)) {
      ids.add(descendantId);
    }
    return ids;
  }, [workspaceToMove.id, workspaceToMove.parent_id, allWorkspaces]);

  // Per-ID tooltip overrides for the source workspace, its descendants, and current parent
  const tooltipOverrides = useMemo<Map<string, string>>(() => {
    const map = new Map<string, string>();
    if (!workspaceToMove.id) return map;
    const selfTooltip = intl.formatMessage(messages.moveWorkspaceDisabledSelf);
    const descendantTooltip = intl.formatMessage(messages.moveWorkspaceDisabledDescendant);
    const currentParentTooltip = intl.formatMessage(messages.moveWorkspaceDisabledCurrentParent);
    map.set(workspaceToMove.id, selfTooltip);
    if (workspaceToMove.parent_id) {
      map.set(workspaceToMove.parent_id, currentParentTooltip);
    }
    for (const id of sourceDisabledIds) {
      if (id !== workspaceToMove.id && id !== workspaceToMove.parent_id) {
        map.set(id, descendantTooltip);
      }
    }
    return map;
  }, [workspaceToMove.id, workspaceToMove.parent_id, sourceDisabledIds, intl]);

  const handleSelect = useCallback((workspace: TreeViewWorkspaceItem | null) => {
    setSelectedDestination(workspace);
  }, []);

  const isSubmitDisabled = !selectedDestination || isSubmitting;

  return (
    <Modal
      appendTo={getModalContainer()}
      ouiaId="move-workspace-modal"
      isOpen={isOpen}
      variant={ModalVariant.medium}
      title={intl.formatMessage(messages.moveWorkspaceTitle, { name: workspaceToMove.name })}
      onClose={onClose}
      actions={[
        <Button key="submit" variant="primary" onClick={handleSubmit} isDisabled={isSubmitDisabled} isLoading={isSubmitting}>
          {intl.formatMessage(messages.submit)}
        </Button>,
        <Button key="cancel" variant="link" onClick={onClose} isDisabled={isSubmitting}>
          {intl.formatMessage(messages.cancel)}
        </Button>,
      ]}
    >
      <Content component="p" className="pf-v6-u-mb-md">
        {intl.formatMessage(messages.moveWorkspaceSelectDestination)}
      </Content>
      <InlineWorkspacePicker
        requiredPermission="create"
        extraDisabledIds={sourceDisabledIds}
        extraDisabledTooltipOverrides={tooltipOverrides}
        selectedWorkspace={selectedDestination ?? undefined}
        onSelect={handleSelect}
        allExpanded
      />
    </Modal>
  );
};
