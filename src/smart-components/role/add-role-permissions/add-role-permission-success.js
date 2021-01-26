/* eslint-disable */
import React from 'react'
import { Title, Button, EmptyState, EmptyStateVariant, EmptyStateIcon, EmptyStateBody, EmptyStateSecondaryActions } from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons';
import { Link } from 'react-router-dom';

const AddRolePermissionSuccess = ({currentRoleID}) => {
  return (
    <>
      <EmptyState>
        <EmptyStateIcon color="green" icon={CheckCircleIcon} />
        <Title headingLevel="h4" size="lg">
          You have successfully added permissions to the role
        </Title>
        <EmptyStateBody></EmptyStateBody>
        <Link to={`/roles/detail/${currentRoleID}`}>
          <Button >
            Exit
          </Button>
        </Link>
      </EmptyState>
    </>
  );
};

export default AddRolePermissionSuccess;
