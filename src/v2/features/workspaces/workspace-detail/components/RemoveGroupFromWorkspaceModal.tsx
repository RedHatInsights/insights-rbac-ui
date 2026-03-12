import React from 'react';
import { useIntl } from 'react-intl';
import { ButtonVariant } from '@patternfly/react-core';
import { WarningModal } from '@patternfly/react-component-groups';

import messages from '../../../../../Messages';
import { useUpdateGroupRolesMutation } from '../../../../data/queries/workspaces';

export interface RemoveGroupFromWorkspaceModalProps {
  isOpen: boolean;
  groupId: string;
  groupName: string;
  workspaceId: string;
  workspaceName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RemoveGroupFromWorkspaceModal: React.FC<RemoveGroupFromWorkspaceModalProps> = ({
  isOpen,
  groupId,
  groupName,
  workspaceId,
  workspaceName,
  onClose,
  onSuccess,
}) => {
  const intl = useIntl();
  const updateBindings = useUpdateGroupRolesMutation();

  const handleConfirm = () => {
    updateBindings.mutate(
      {
        resourceId: workspaceId,
        resourceType: 'workspace',
        subjectId: groupId,
        subjectType: 'group',
        roleIds: [],
      },
      {
        onSuccess: () => {
          onClose();
          onSuccess?.();
        },
      },
    );
  };

  return (
    <WarningModal
      ouiaId="remove-group-from-workspace-modal"
      isOpen={isOpen}
      title={intl.formatMessage(messages.removeGroupFromWorkspaceConfirmTitle, { groupName })}
      confirmButtonLabel={intl.formatMessage(messages.removeGroupFromWorkspace)}
      confirmButtonVariant={ButtonVariant.danger}
      onClose={onClose}
      onConfirm={handleConfirm}
    >
      {intl.formatMessage(messages.removeGroupFromWorkspaceConfirmBody, { workspaceName })}
    </WarningModal>
  );
};
