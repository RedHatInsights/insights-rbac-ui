import React, { useState } from 'react';
import PropTypes from 'prop-types';

import {
  Button,
  Card,
  Modal,
  Stack,
  StackItem,
  Text,
  TextContent,
  TextVariants,
  Title
} from '@patternfly/react-core';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import { ExcludedRolesList } from '../add-group/roles-list';
import '../../../App.scss';
import DefaultGroupChange from './default-group-change-modal';

const AddGroupRoles = ({
  history: { push },
  match: { params: { uuid }},
  selectedRoles,
  setSelectedRoles,
  title,
  closeUrl,
  addRolesToGroup,
  fetchRolesForGroup,
  name,
  isDefault,
  isChanged
}) => {
  const [ showConfirmModal, setShowConfirmModal ] = useState(true);

  const onCancel = () => {
    addNotification({
      variant: 'warning',
      title: 'Adding members to group',
      dismissDelay: 8000,
      dismissable: false,
      description: 'Adding members to group was cancelled by the user.'
    });
    push(closeUrl);
  };

  const onSubmit = () => {
    const rolesList = selectedRoles.map(role => role.uuid);
    addRolesToGroup(uuid, rolesList, () => fetchRolesForGroup(uuid));
    return push(closeUrl);
  };

  return (isDefault && !isChanged && showConfirmModal
    ? <DefaultGroupChange
      isOpen={ showConfirmModal }
      onClose={ onCancel }
      onSubmit={ () => setShowConfirmModal(false) }
    />
    : <Modal
      title="Add roles to group"
      width={ '70%' }
      isOpen
      onClose={ () => {
        onCancel();
        setShowConfirmModal(true);
      } }
      actions={ [
        <Button
          aria-label="Save"
          variant="primary"
          key="confirm"
          isDisabled={ selectedRoles.length === 0 }
          onClick={ onSubmit }>
            Add to group
        </Button>,
        <Button
          aria-label='Cancel'
          variant='link'
          key="cancel"
          onClick={ onCancel }>
          Cancel
        </Button>
      ] }
      isFooterLeftAligned>
      <Stack gutter="md">
        { title && <StackItem>
          <Title size="xl">{ title }</Title>
        </StackItem> }
        <StackItem>
          <TextContent>
            <Text component={ TextVariants.h6 }>
                  This role list has been <b> filtered </b> to <b> only show roles </b> that are <b> not currently </b> in <b> { name }</b>.
            </Text>
          </TextContent>
        </StackItem>
        <StackItem>
          <Card>
            <ExcludedRolesList selectedRoles={ selectedRoles } setSelectedRoles={ setSelectedRoles }/>
          </Card>
        </StackItem>
      </Stack>
    </Modal>
  );
};

AddGroupRoles.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired
  }).isRequired,
  match: PropTypes.shape({
    params: PropTypes.object.isRequired
  }).isRequired,
  selectedRoles: PropTypes.array,
  setSelectedRoles: PropTypes.func,
  addRolesToGroup: PropTypes.func,
  fetchRolesForGroup: PropTypes.func,
  closeUrl: PropTypes.string,
  title: PropTypes.string,
  name: PropTypes.string,
  isDefault: PropTypes.bool,
  isChanged: PropTypes.bool
};

export default AddGroupRoles;

