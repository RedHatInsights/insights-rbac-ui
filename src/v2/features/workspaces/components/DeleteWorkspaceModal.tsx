import React from 'react';
import { ButtonVariant } from '@patternfly/react-core/dist/dynamic/components/Button';
import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';
import { FormattedMessage, useIntl } from 'react-intl';

import type { WorkspacesWorkspace } from '../../../data/queries/workspaces';
import { commonMessages } from '../../../../shared/messages/common';

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
      title={intl.formatMessage({
        id: 'deleteWorkspaceModalHeader',
        defaultMessage: 'Delete workspace?',
        description: 'Modal header text for deleting a workspace',
      })}
      confirmButtonLabel={
        !hasAssets
          ? intl.formatMessage(commonMessages.delete)
          : intl.formatMessage({ id: 'gotItButtonLabel', defaultMessage: 'Got it', description: 'got it button label' })
      }
      confirmButtonVariant={!hasAssets ? ButtonVariant.danger : ButtonVariant.primary}
      withCheckbox={!hasAssets}
      checkboxLabel={intl.formatMessage({
        id: 'understandActionIrreversible',
        defaultMessage: 'I understand that this action cannot be undone',
        description: 'Understand action cannot be undone message',
      })}
      onClose={onClose}
      onConfirm={hasAssets ? onClose : onConfirm}
      cancelButtonLabel={!hasAssets ? intl.formatMessage(commonMessages.cancel) : ''}
    >
      {hasAssets ? (
        intl.formatMessage(
          {
            id: 'workspaceNotEmptyWarning',
            defaultMessage:
              '{count, plural, one {Workspace} other {Workspaces}} must be empty to delete and must not have any children workspaces. You must move assets in {count, plural, one {this workspace} other {these workspaces}} to other workspaces in order to proceed.',
            description: 'Display text in delete modal when workspace is not empty',
          },
          { count: workspaces.length },
        )
      ) : (
        <FormattedMessage
          id={'deleteWorkspaceModalBody'}
          defaultMessage={
            '{count, plural, one {<b>{name}</b> workspace and all its} other {<b>{count} workspaces</b> and all their}} data will be permanently deleted. All access granted to user groups via this workspace will be removed.'
          }
          description={'Modal body text for deleting a workspace'}
          values={{
            b: (text) => <b>{text}</b>,
            count: workspaces.length,
            name: workspaces[0]?.name,
          }}
        />
      )}
    </WarningModal>
  );
};
