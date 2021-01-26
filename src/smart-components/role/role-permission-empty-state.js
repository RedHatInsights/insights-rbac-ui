/* eslint-disable */
import React from 'react';
import {
  Title,
  Button,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody
} from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { Link, Route, useHistory } from 'react-router-dom';
import AddRolePermissionWizard from './add-role-permissions/add-role-permission-wizard';
import { routes as paths } from '../../../package.json';

// Need to add push for the button action directly to the permission wizard. 
const RolePermissionEmptyState = ({currentRoleID, role}) => {
  return (
    <EmptyState>
      <EmptyStateIcon icon={PlusCircleIcon} />
      <Title headingLevel="h3" sie="lg">
        There are no permissions in this role
      </Title>      
      <EmptyStateBody>
        To configure user access to applications, add
        <br />
        at leasst on epersmission to this role.
      </EmptyStateBody>
      <Link to={`/roles/detail/${currentRoleID}/role-add-permission`}>
        <Button variant="primary">Add permissions</Button>
      </Link>
      <Route exact path={paths['role-add-permission']}>
        <AddRolePermissionWizard isOpen={true} role={role} />
      </Route>   
    </EmptyState>
  )
};

export default RolePermissionEmptyState;
