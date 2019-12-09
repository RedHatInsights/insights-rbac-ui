import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import {
  ActionGroup,
  Button,
  Split,
  SplitItem,
  Card,
  Form,
  Modal,
  Stack,
  StackItem,
  Text,
  TextContent,
  TextVariants,
  Title
} from '@patternfly/react-core';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import RolesList from '../add-group/roles-list';
import '../../../App.scss';

const AddGroupRoles = ({
  history: { push },
  match: { params: { uuid }},
  selectedRoles,
  setSelectedRoles,
  title,
  description,
  closeUrl,
  addRolesToGroup,
  fetchRolesForGroup
}) => {
  const onCancel = () => {
    addNotification({
      variant: 'warning',
      title: 'Adding members to group',
      dismissable: true,
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
      title={ 'Add group roles' }
      width={ '40%' }
      isOpen
      onClose={ onCancel }>
      <Fragment>
        <Form>
          <Stack gutter="md">
            { title && <StackItem>
              <Title size="xl">{ title }</Title>
            </StackItem> }
            <StackItem>
              <TextContent>
                <Text component={ TextVariants.h6 }>{ description || 'Select at least one role to add to this group' }</Text>
              </TextContent>
            </StackItem>
            <StackItem>
              <Card>
                <RolesList selectedRoles={ selectedRoles } setSelectedRoles={ setSelectedRoles }/>
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
                      onClick={ onSubmit }
                    >
                      Save
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
        </Form>
      </Fragment>
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
  description: PropTypes.string
};

export default AddGroupRoles;

