import React, { useContext } from 'react';
import { Title, Button, EmptyState, EmptyStateVariant, EmptyStateIcon, EmptyStateBody, EmptyStateSecondaryActions } from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons';
import { Link } from 'react-router-dom';
import { AddRoleWizardContext } from './add-role-wizard';
import PropTypes from 'prop-types';

const AddRoleSuccess = ({ onClose }) => {
  const { setHideForm, setWizardSuccess } = useContext(AddRoleWizardContext);
  return (
    <EmptyState variant={EmptyStateVariant.large}>
      <EmptyStateIcon color="green" icon={CheckCircleIcon} />
      <Title headingLevel="h4" size="lg">
        You have successfully created a new role
      </Title>
      <EmptyStateBody></EmptyStateBody>
      <Button onClick={onClose} variant="primary">
        Exit
      </Button>
      <EmptyStateSecondaryActions>
        <Button
          onClick={() => {
            setHideForm(false);
            setWizardSuccess(false);
          }}
          variant="link"
        >
          Create another role
        </Button>
        <Button component={(props) => <Link to="/groups" {...props} />} variant="link">
          Add role to group
        </Button>
      </EmptyStateSecondaryActions>
    </EmptyState>
  );
};

AddRoleSuccess.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default AddRoleSuccess;
