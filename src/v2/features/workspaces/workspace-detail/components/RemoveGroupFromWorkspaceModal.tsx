import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { ButtonVariant } from '@patternfly/react-core/dist/dynamic/components/Button';
import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';

import { useUpdateGroupRolesMutation } from '../../../../data/queries/workspaces';

const messages = defineMessages({
  removeGroupFromOrganizationConfirmTitle: {
    id: 'removeGroupFromOrganizationConfirmTitle',
    defaultMessage: 'Remove {groupName} from organization?',
    description: 'Confirmation modal title when removing a group from an organization',
  },
  removeGroupFromWorkspaceConfirmTitle: {
    id: 'removeGroupFromWorkspaceConfirmTitle',
    defaultMessage: 'Remove {groupName} from workspace?',
    description: 'Confirmation modal title when removing a group from a workspace',
  },
  removeGroupFromOrganization: {
    id: 'removeGroupFromOrganization',
    defaultMessage: 'Remove from organization',
    description: 'Remove group from organization action label',
  },
  removeGroupFromWorkspace: {
    id: 'removeGroupFromWorkspace',
    defaultMessage: 'Remove from workspace',
    description: 'Remove group from workspace action label',
  },
});

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
      {intl.formatMessage(
        {
          id: 'removeGroupFromWorkspaceConfirmBody',
          defaultMessage: 'All role assignments for this group in {workspaceName} will be removed. This action cannot be undone.',
          description: 'Confirmation modal body when removing a group from a workspace',
        },
        { workspaceName },
      )}
    </WarningModal>
  );
};
