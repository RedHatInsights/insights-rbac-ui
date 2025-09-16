import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { Alert, Button, Modal, ModalVariant, Stack, StackItem } from '@patternfly/react-core';
import { useLocation, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Skeleton, SkeletonSize } from '@redhat-cloud-services/frontend-components/Skeleton';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import { fetchGroup, invalidateSystemGroup } from '../../../../redux/groups/actions';
import useAppNavigate from '../../../../hooks/useAppNavigate';
import { RolesList } from '../../add-group/RolesList';
import { DefaultGroupChangeModal } from '../../components/DefaultGroupChangeModal';
import messages from '../../../../Messages';
import type { RBACStore } from '../../../../redux/store.d';
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
  selectedRoles?: Role[];
  setSelectedRoles?: (roles: Role[]) => void;
  title?: string;
  closeUrl?: string;
  addRolesToGroup?: (groupId: string, roles: Role[]) => void;
  groupName?: string;
  isDefault?: boolean;
  isChanged?: boolean;
  onDefaultGroupChanged?: (group: Group) => void;
}

export const AddGroupRoles: React.FC<AddGroupRolesProps> = ({
  afterSubmit,
  fetchUuid,
  selectedRoles,
  setSelectedRoles,
  title,
  closeUrl,
  addRolesToGroup,
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
  const { groupName, isRecordLoading } = useSelector(({ groupReducer }: RBACStore) => {
    const { selectedGroup, isRecordLoading } = groupReducer;
    return {
      groupName: name || state?.name || selectedGroup?.name,
      isRecordLoading,
    };
  });

  useEffect(() => {
    if (!name) {
      dispatch(fetchGroup(groupId!));
    }
  }, []);

  const onCancel = () => {
    setSelectedRoles && setSelectedRoles([]);
    dispatch(
      addNotification({
        variant: 'warning',
        title: intl.formatMessage(messages.addingGroupRolesCancelled),
        description: 'Adding roles to group has been cancelled.',
      }),
    );
    navigate(closeUrl || '/groups');
  };

  const onSubmit = () => {
    if (!selectedRoles || selectedRoles.length === 0) {
      return;
    }

    if (isDefault && isChanged) {
      setShowConfirmModal(true);
      return;
    }

    if (addRolesToGroup) {
      addRolesToGroup(groupId!, selectedRoles);
    }

    dispatch(
      addNotification({
        variant: 'success',
        title: intl.formatMessage(messages.addRoles),
        description: 'Roles have been successfully added to the group.',
      }),
    );

    afterSubmit && afterSubmit();
    navigate(closeUrl || `/groups/detail/${groupId}/roles`);
  };

  const handleConfirm = () => {
    setShowConfirmModal(false);
    if (addRolesToGroup) {
      addRolesToGroup(groupId!, selectedRoles!);
    }
    dispatch(invalidateSystemGroup());
    onDefaultGroupChanged && groupName && onDefaultGroupChanged({ uuid: groupId!, name: groupName });
    afterSubmit && afterSubmit();
    navigate(closeUrl || `/groups/detail/${groupId}/roles`);
  };

  return (
    <>
      <Modal
        title={title || intl.formatMessage(messages.addRoles)}
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
                <RolesList selectedRoles={selectedRoles || []} setSelectedRoles={setSelectedRoles || (() => {})} rolesExcluded={true} />
              </StackItem>
            </>
          )}
        </Stack>
      </Modal>

      <DefaultGroupChangeModal isOpen={showConfirmModal} onSubmit={handleConfirm} onClose={() => setShowConfirmModal(false)} />
    </>
  );
};
