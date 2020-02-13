import React from 'react';
import PropTypes from 'prop-types';

import {
  ActionGroup,
  Button,
  Split,
  SplitItem,
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

const AddGroupRoles = ({
  history: { push },
  match: { params: { uuid }},
  selectedRoles,
  setSelectedRoles,
  title,
  closeUrl,
  addRolesToGroup,
  fetchRolesForGroup,
  name
}) => {
  const onCancel = () => {
    addNotification({
      variant: 'warning',
      title: 'Adding members to group',
      dismissDelay: 8000,
      description: 'Adding members to group was cancelled by the user.'
    });
    push(closeUrl);
  };

  const onSubmit = () => {
    const rolesList = selectedRoles.map(role => role.uuid);
    addRolesToGroup(uuid, rolesList, () => fetchRolesForGroup(uuid));
    return push(closeUrl);
  };

  return (
    <Modal
      title={ `Add roles to ${name} group` }
      width={ '70%' }
      isOpen
      onClose={ onCancel }>
      <Stack gutter="md">
        { title && <StackItem>
          <Title size="xl">{ title }</Title>
        </StackItem> }
        <StackItem>
          <TextContent>
            <Text component={ TextVariants.h6 }>
                  This role list has been <b> filtered </b> to <b> only show roles </b> that are <b> not currently in your group.</b>
            </Text>
          </TextContent>
        </StackItem>
        <StackItem>
          <Card>
            <ExcludedRolesList selectedRoles={ selectedRoles } setSelectedRoles={ setSelectedRoles }/>
          </Card>
        </StackItem>
        <StackItem>
          <ActionGroup>
            <Split gutter="md">
              <SplitItem>
                <Button
                  aria-label="Save"
                  variant="primary"
                  type="button"
                  isDisabled={ selectedRoles.length === 0 }
                  onClick={ onSubmit }
                >
                      Add to group
                </Button>
              </SplitItem>
              <SplitItem>
                <Button
                  aria-label='Cancel'
                  variant='secondary'
                  type='button'
                  onClick={ onCancel }>Cancel</Button>
              </SplitItem>
            </Split>
          </ActionGroup>
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
  name: PropTypes.string
};

export default AddGroupRoles;

