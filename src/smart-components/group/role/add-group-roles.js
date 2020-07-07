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
  name,
  isDefault,
  isChanged,
  addNotification,
  onDefaultGroupChanged,
  fetchRolesForGroup
}) => {
  const [ showConfirmModal, setShowConfirmModal ] = useState(true);

  const onCancel = () => {
    addNotification({
      variant: 'warning',
      title: 'Adding roles to group',
      dismissDelay: 8000,
      dismissable: false,
      description: 'Adding roles to group was canceled by the user.'
    });
    push(closeUrl);
  };

  const onSubmit = () => {
    const rolesList = selectedRoles.map(role => role.uuid);
    addRolesToGroup(uuid, rolesList, fetchRolesForGroup);
    if (isDefault && !isChanged) {
      onDefaultGroupChanged(true);
    }

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
      <Stack hasGutter>
        { title && <StackItem>
          <Title headingLevel="h4" size="xl">{ title }</Title>
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
    push: PropTypes.any,
    goBack: PropTypes.func.isRequired
  }).isRequired,
  match: PropTypes.shape({
    params: PropTypes.object.isRequired
  }).isRequired,
  selectedRoles: PropTypes.array,
  setSelectedRoles: PropTypes.func,
  addRolesToGroup: PropTypes.func,
  closeUrl: PropTypes.string,
  title: PropTypes.string,
  name: PropTypes.string,
  isDefault: PropTypes.bool,
  isChanged: PropTypes.bool,
  addNotification: PropTypes.func,
  onDefaultGroupChanged: PropTypes.func,
  fetchRolesForGroup: PropTypes.func
};

export default AddGroupRoles;

