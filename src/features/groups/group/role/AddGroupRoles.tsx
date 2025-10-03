import React, { useCallback, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Modal } from '@patternfly/react-core/dist/dynamic/components/Modal';
import { ModalVariant } from '@patternfly/react-core';
import { Stack } from '@patternfly/react-core';
import { StackItem } from '@patternfly/react-core';
import { useLocation, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Skeleton, SkeletonSize } from '@redhat-cloud-services/frontend-components/Skeleton';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import { addRolesToGroup as addRolesToGroupAction, fetchGroup, fetchRolesForGroup, invalidateSystemGroup } from '../../../../redux/groups/actions';
import { selectIsGroupRecordLoading, selectSelectedGroupName } from '../../../../redux/groups/selectors';
import useAppNavigate from '../../../../hooks/useAppNavigate';
import { RolesList } from '../../add-group/components/stepRoles/RolesList';
import { DefaultGroupChangeModal } from '../../components/DefaultGroupChangeModal';
import messages from '../../../../Messages';
import '../../../../App.scss';
import './add-group-roles.scss';

interface Role {
  uuid: string;
  name: string;
  display_name?: string;
  description?: string;
}

interface Group {
  uuid: string;
  name: string;
}

interface AddGroupRolesProps {
  afterSubmit?: () => void;
  fetchUuid?: string;
  initialSelectedRoles?: Role[];
  onSelectedRolesChange?: (roles: Role[]) => void;
  title?: string;
  closeUrl?: string;
  groupName?: string;
  isDefault?: boolean;
  isChanged?: boolean;
  onDefaultGroupChanged?: (group: Group) => void;
}

export const AddGroupRoles: React.FC<AddGroupRolesProps> = ({
  afterSubmit,
  fetchUuid,
  initialSelectedRoles,
  onSelectedRolesChange,
  title,
  closeUrl,
  groupName: name,
  isDefault,
  isChanged,
  onDefaultGroupChanged,
}) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  let { state } = useLocation() as { state?: { name?: string } };

  const { groupId: uuid } = useParams<{ groupId: string }>();
  const groupId = isDefault && fetchUuid ? fetchUuid : uuid;
  const navigate = useAppNavigate();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Internal state for selected roles
  const [selectedRoles, setSelectedRoles] = useState<Role[]>(initialSelectedRoles || []);
  const selectedGroupName = useSelector(selectSelectedGroupName);
  const isRecordLoading = useSelector(selectIsGroupRecordLoading);
  const groupName = name || state?.name || selectedGroupName;

  useEffect(() => {
    if (!name) {
      dispatch(fetchGroup(groupId!));
    }
  }, []);

  // Handle role selection changes
  const handleRoleSelection = useCallback(
    (roles: Role[]) => {
      setSelectedRoles(roles);
      onSelectedRolesChange?.(roles);
    },
    [onSelectedRolesChange],
  );

  const onCancel = () => {
    setSelectedRoles([]);
    onSelectedRolesChange?.([]);
    dispatch(
      addNotification({
        variant: 'warning',
        title: intl.formatMessage(messages.addingGroupRolesCancelled),
        description: 'Adding roles to group has been cancelled.',
      }),
    );
    navigate(closeUrl || `/groups/detail/${groupId}/roles`);
  };

  const onSubmit = async () => {
    if (!selectedRoles || selectedRoles.length === 0) {
      return;
    }

    if (isDefault && isChanged) {
      setShowConfirmModal(true);
      return;
    }

    try {
      // Dispatch the addRolesToGroup action with role UUIDs
      const roleUuids = selectedRoles.map((role) => role.uuid);
      await dispatch(addRolesToGroupAction(groupId!, roleUuids));

      // Refresh the group roles data to show the newly added roles
      dispatch(fetchRolesForGroup(groupId!, {}));

      afterSubmit && afterSubmit();
      navigate(closeUrl || `/groups/detail/${groupId}/roles`);
    } catch (error) {
      console.error('Failed to add roles to group:', error);
    }
  };

  const handleConfirm = async () => {
    setShowConfirmModal(false);

    try {
      // Dispatch the addRolesToGroup action with role UUIDs
      const roleUuids = selectedRoles!.map((role) => role.uuid);
      await dispatch(addRolesToGroupAction(groupId!, roleUuids));

      // Refresh the group roles data to show the newly added roles
      dispatch(fetchRolesForGroup(groupId!, {}));

      dispatch(invalidateSystemGroup());
      onDefaultGroupChanged && groupName && onDefaultGroupChanged({ uuid: groupId!, name: groupName });
      afterSubmit && afterSubmit();
      navigate(closeUrl || `/groups/detail/${groupId}/roles`);
    } catch (error) {
      console.error('Failed to add roles to group:', error);
    }
  };

  return (
    <>
      <Modal
        title={title || (groupName ? intl.formatMessage(messages.addRolesToGroup, { name: groupName }) : intl.formatMessage(messages.addRoles))}
        variant={ModalVariant.large}
        isOpen
        onClose={onCancel}
        actions={[
          <Button key="confirm" variant="primary" onClick={onSubmit} isDisabled={!selectedRoles || selectedRoles.length === 0}>
            {intl.formatMessage(messages.addToGroup)}
          </Button>,
          <Button key="cancel" variant="link" onClick={onCancel}>
            {intl.formatMessage(messages.cancel)}
          </Button>,
        ]}
      >
        <Stack hasGutter>
          {isRecordLoading ? (
            <StackItem>
              <Skeleton size={SkeletonSize.lg} />
            </StackItem>
          ) : (
            <>
              <StackItem>
                <Alert variant="info" isInline title="Select roles to add to this group" />
              </StackItem>
              <StackItem isFilled>
                <RolesList initialSelectedRoles={selectedRoles || []} onSelect={handleRoleSelection} rolesExcluded={true} />
              </StackItem>
            </>
          )}
        </Stack>
      </Modal>

      <DefaultGroupChangeModal isOpen={showConfirmModal} onSubmit={handleConfirm} onClose={() => setShowConfirmModal(false)} />
    </>
  );
};

export default AddGroupRoles;
