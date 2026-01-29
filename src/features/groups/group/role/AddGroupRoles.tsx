import React, { useCallback, useState } from 'react';
import { useIntl } from 'react-intl';
import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Modal } from '@patternfly/react-core/dist/dynamic/deprecated/components/Modal';
import { ModalVariant } from '@patternfly/react-core/dist/dynamic/deprecated/components/Modal';
import { Stack } from '@patternfly/react-core';
import { StackItem } from '@patternfly/react-core';
import { useParams } from 'react-router-dom';
import { Skeleton, SkeletonSize } from '@redhat-cloud-services/frontend-components/Skeleton';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';
import { useAddRolesToGroupMutation, useGroupQuery } from '../../../../data/queries/groups';
import useAppNavigate from '../../../../hooks/useAppNavigate';
import { RolesList } from '../../add-group/components/stepRoles/RolesList';
import { DefaultGroupChangeModal } from '../../components/DefaultGroupChangeModal';
import { getModalContainer } from '../../../../helpers/modal-container';
import messages from '../../../../Messages';
import pathnames from '../../../../utilities/pathnames';

interface Role {
  uuid: string;
  name: string;
  display_name?: string;
  description?: string;
}

interface AddGroupRolesProps {
  afterSubmit?: () => void;
  closeUrl?: string;
}

/**
 * AddGroupRoles component - fetches its own data via React Query.
 * Determines if group is a default group and whether it's been modified from the group data itself.
 *
 * Component is self-contained with React Query data fetching.
 */
export const AddGroupRoles: React.FC<AddGroupRolesProps> = ({ afterSubmit, closeUrl }) => {
  const intl = useIntl();
  const addNotification = useAddNotification();
  const navigate = useAppNavigate();

  const { groupId } = useParams<{ groupId: string }>();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);

  // Fetch group data - component fetches its own data
  const { data: groupData, isLoading: isGroupLoading } = useGroupQuery(groupId ?? '', {
    enabled: !!groupId,
  });

  // Derive isDefault and isChanged from the actual group data
  // platform_default = true means this is the "Default access" group
  // system = false means it has been modified (copied)
  const isDefault = groupData?.platform_default === true;
  const isChanged = isDefault && groupData?.system === false;
  const groupName = groupData?.name;

  // React Query mutation for adding roles
  const addRolesMutation = useAddRolesToGroupMutation();

  const handleRoleSelection = useCallback((roles: Role[]) => {
    setSelectedRoles(roles);
  }, []);

  const onCancel = () => {
    setSelectedRoles([]);
    addNotification({
      variant: 'warning',
      title: intl.formatMessage(messages.addingGroupRolesCancelled),
      description: 'Adding roles to group has been cancelled.',
    });
    navigate(closeUrl || pathnames['group-detail-roles'].link(groupId!));
  };

  const onSubmit = async () => {
    if (!selectedRoles || selectedRoles.length === 0 || !groupId) {
      return;
    }

    try {
      const roleUuids = selectedRoles.map((role) => role.uuid);
      // The mutation will automatically invalidate caches including the group detail
      // This ensures the UI will show the updated group name if it was renamed by the server
      await addRolesMutation.mutateAsync({ groupId, roleUuids });

      afterSubmit?.();
      navigate(closeUrl || pathnames['group-detail-roles'].link(groupId!));
    } catch (error) {
      // Error notification is handled by the mutation
      console.error('Failed to add roles to group:', error);
    }
  };

  const handleAddClick = () => {
    // If this is an unmodified default group, show the warning modal first
    if (isDefault && !isChanged) {
      setShowConfirmModal(true);
    } else {
      // Otherwise submit directly
      onSubmit();
    }
  };

  // Show the warning modal for unmodified default groups
  if (isDefault && !isChanged && showConfirmModal) {
    return <DefaultGroupChangeModal isOpen={true} onClose={onCancel} onSubmit={onSubmit} />;
  }

  return (
    <Modal
      title={groupName ? intl.formatMessage(messages.addRolesToGroup, { name: groupName }) : intl.formatMessage(messages.addRoles)}
      variant={ModalVariant.large}
      isOpen
      onClose={onCancel}
      appendTo={getModalContainer()}
      actions={[
        <Button key="confirm" variant="primary" onClick={handleAddClick} isDisabled={!selectedRoles || selectedRoles.length === 0}>
          {intl.formatMessage(messages.addToGroup)}
        </Button>,
        <Button key="cancel" variant="link" onClick={onCancel}>
          {intl.formatMessage(messages.cancel)}
        </Button>,
      ]}
    >
      <Stack hasGutter>
        {isGroupLoading ? (
          <StackItem>
            <Skeleton size={SkeletonSize.lg} />
          </StackItem>
        ) : (
          <>
            <StackItem>
              <Alert variant="info" isInline title="Select roles to add to this group" />
            </StackItem>
            <StackItem isFilled>
              <RolesList initialSelectedRoles={selectedRoles} onSelect={handleRoleSelection} rolesExcluded={true} groupId={groupId} />
            </StackItem>
          </>
        )}
      </Stack>
    </Modal>
  );
};

export default AddGroupRoles;
