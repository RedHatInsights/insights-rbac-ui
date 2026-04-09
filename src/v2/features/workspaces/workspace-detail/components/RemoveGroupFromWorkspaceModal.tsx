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
  resourceType?: 'workspace' | 'tenant';
  onClose: () => void;
  onSuccess?: () => void;
}

export const RemoveGroupFromWorkspaceModal: React.FC<RemoveGroupFromWorkspaceModalProps> = ({
  isOpen,
  groupId,
  groupName,
  workspaceId,
  workspaceName,
  resourceType = 'workspace',
  onClose,
  onSuccess,
}) => {
  const intl = useIntl();
  const updateBindings = useUpdateGroupRolesMutation();

  const handleConfirm = () => {
    updateBindings.mutate(
      {
        resourceId: workspaceId,
        resourceType,
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

  const isTenant = resourceType === 'tenant';

  return (
    <WarningModal
      ouiaId="remove-group-from-workspace-modal"
      isOpen={isOpen}
      title={intl.formatMessage(isTenant ? messages.removeGroupFromOrganizationConfirmTitle : messages.removeGroupFromWorkspaceConfirmTitle, {
        groupName,
      })}
      confirmButtonLabel={intl.formatMessage(isTenant ? messages.removeGroupFromOrganization : messages.removeGroupFromWorkspace)}
      confirmButtonVariant={ButtonVariant.danger}
      onClose={onClose}
      onConfirm={handleConfirm}
    >
      {intl.formatMessage(messages.removeGroupFromWorkspaceConfirmBody, { workspaceName })}
    </WarningModal>
  );
};
