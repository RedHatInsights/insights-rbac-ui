import React from 'react';
import PropTypes from 'prop-types';
import { Title, Button, EmptyState, EmptyStateIcon, EmptyStateBody } from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { fetchRole } from '../../../redux/actions/role-actions.js';

const AddRolePermissionSuccess = ({ currentRoleID }) => {
  const dispatch = useDispatch();
  return (
    <>
      <EmptyState>
        <EmptyStateIcon color="green" icon={CheckCircleIcon} />
        <Title headingLevel="h4" size="lg">
          You have successfully added permissions to the role
        </Title>
        <EmptyStateBody></EmptyStateBody>
        <Link to={`/roles/detail/${currentRoleID}`}>
          <Button onClick={() => dispatch(fetchRole(currentRoleID))}>Exit</Button>
        </Link>
      </EmptyState>
    </>
  );
};

export default AddRolePermissionSuccess;

AddRolePermissionSuccess.propTypes = {
  currentRoleID: PropTypes.string.isRequired,
};
