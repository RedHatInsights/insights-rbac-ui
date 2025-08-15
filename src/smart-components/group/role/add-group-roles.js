import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Alert, Button, Modal, ModalVariant, Stack, StackItem, Title } from '@patternfly/react-core';
import { useLocation, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Skeleton, SkeletonSize } from '@redhat-cloud-services/frontend-components/Skeleton';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import { fetchGroup, invalidateSystemGroup } from '../../../redux/actions/group-actions';
import useAppNavigate from '../../../hooks/useAppNavigate';
import RolesList from '../add-group/roles-list';
import DefaultGroupChange from './default-group-change-modal';
import messages from '../../../Messages';
import '../../../App.scss';
import './add-group-roles.scss';

const AddGroupRoles = ({
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
  let { state } = useLocation();

  const { groupId: uuid } = useParams();
  const groupId = isDefault && fetchUuid ? fetchUuid : uuid;
  const navigate = useAppNavigate();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { groupName, isRecordLoading } = useSelector(({ groupReducer: { selectedGroup, isRecordLoading } }) => ({
    groupName: name || state?.name || selectedGroup.name,
    isRecordLoading,
  }));

  useEffect(() => {
    name || dispatch(fetchGroup(groupId));
  }, []);

  const onCancel = () => {
    setSelectedRoles && setSelectedRoles([]);
    dispatch(
      addNotification({
        variant: 'warning',
        title: intl.formatMessage(messages.addingGroupRolesTitle),
        dismissDelay: 8000,
        description: intl.formatMessage(messages.addingGroupRolesCancelled),
      }),
    );
    navigate(closeUrl);
  };

  const onSubmit = () => {
    const rolesList = selectedRoles.map((role) => role.uuid);
    if (isDefault && !isChanged) {
      onDefaultGroupChanged(true);
      dispatch(invalidateSystemGroup());
    }
    addRolesToGroup(groupId, rolesList).then(afterSubmit);
    setSelectedRoles([]);
    return navigate(closeUrl);
  };

  return isDefault && !isChanged && showConfirmModal ? (
    <DefaultGroupChange isOpen={showConfirmModal} onClose={onCancel} onSubmit={onSubmit} />
  ) : (
    <Modal
      className="rbac"
      title={intl.formatMessage(messages.addRolesToGroup, {
        name: isRecordLoading ? <Skeleton size={SkeletonSize.xs} className="rbac-c-skeleton__add-role-to-group" /> : groupName,
      })}
      variant={ModalVariant.medium}
      isOpen
      onClose={() => {
        onCancel();
        setShowConfirmModal(true);
      }}
      actions={[
        <Button
          aria-label="Save"
          ouiaId="primary-save-button"
          variant="primary"
          key="confirm"
          isDisabled={selectedRoles.length === 0}
          onClick={() => {
            setShowConfirmModal(true);
            (!isDefault || isChanged) && onSubmit();
          }}
        >
          {intl.formatMessage(messages.addToGroup)}
        </Button>,
        <Button aria-label="Cancel" ouiaId="secondary-cancel-button" variant="link" key="cancel" onClick={onCancel}>
          {intl.formatMessage(messages.cancel)}
        </Button>,
      ]}
    >
      <Stack hasGutter>
        {title && (
          <StackItem>
            <Title headingLevel="h4" size="xl">
              {title}
            </Title>
          </StackItem>
        )}
        <StackItem>
          <Alert variant="info" isInline isPlain title={intl.formatMessage(messages.onlyGroupRolesVisible)} />
        </StackItem>
        <StackItem>
          <RolesList selectedRoles={selectedRoles} setSelectedRoles={setSelectedRoles} rolesExcluded={true} groupId={groupId} />
        </StackItem>
      </Stack>
    </Modal>
  );
};

AddGroupRoles.propTypes = {
  afterSubmit: PropTypes.func,
  selectedRoles: PropTypes.array,
  setSelectedRoles: PropTypes.func,
  addRolesToGroup: PropTypes.func,
  closeUrl: PropTypes.string,
  title: PropTypes.string,
  groupName: PropTypes.string,
  fetchUuid: PropTypes.string,
  isDefault: PropTypes.bool,
  isChanged: PropTypes.bool,
  onDefaultGroupChanged: PropTypes.func,
};

export default AddGroupRoles;
