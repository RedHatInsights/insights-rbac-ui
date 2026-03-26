import React from 'react';
import { ButtonVariant } from '@patternfly/react-core';
import { WarningModal } from '@patternfly/react-component-groups';
import { FormattedMessage, useIntl } from 'react-intl';
import messages from '../../../../Messages';
import type { WorkspacesWorkspace } from '../../../data/queries/workspaces';

export interface DeleteWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called when the user confirms deletion. Not called in "has assets" informational mode. */
  onConfirm: () => void;
  /** Workspaces to delete. Used for body text (name, count). */
  workspaces: WorkspacesWorkspace[];
  /** When true, the modal becomes informational: "can't delete, has children". */
  hasAssets?: boolean;
}

export const DeleteWorkspaceModal: React.FC<DeleteWorkspaceModalProps> = ({ isOpen, onClose, onConfirm, workspaces, hasAssets = false }) => {
  const intl = useIntl();

  return (
    <WarningModal
      ouiaId="remove-workspaces-modal"
      isOpen={isOpen}
      title={intl.formatMessage(messages.deleteWorkspaceModalHeader)}
      confirmButtonLabel={!hasAssets ? intl.formatMessage(messages.delete) : intl.formatMessage(messages.gotItButtonLabel)}
      confirmButtonVariant={!hasAssets ? ButtonVariant.danger : ButtonVariant.primary}
      withCheckbox={!hasAssets}
      checkboxLabel={intl.formatMessage(messages.understandActionIrreversible)}
      onClose={onClose}
      onConfirm={hasAssets ? onClose : onConfirm}
      cancelButtonLabel={!hasAssets ? intl.formatMessage(messages.cancel) : ''}
    >
      {hasAssets ? (
        intl.formatMessage(messages.workspaceNotEmptyWarning, { count: workspaces.length })
      ) : (
        <FormattedMessage
          {...messages.deleteWorkspaceModalBody}
          values={{
            b: (text) => <b>{text}</b>,
            count: workspaces.length,
            plural: workspaces.length > 1 ? intl.formatMessage(messages.workspaces) : intl.formatMessage(messages.workspace),
            name: workspaces[0]?.name,
          }}
        />
      )}
    </WarningModal>
  );
};
