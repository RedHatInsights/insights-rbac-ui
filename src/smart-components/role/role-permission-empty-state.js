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

// Need to add push for the button action directly to the permission wizard. 
const RolePermissionEmptyState = () => {
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
      <Button variant="primary">Add permissions</Button>
    </EmptyState>
  )
};

export default RolePermissionEmptyState;
