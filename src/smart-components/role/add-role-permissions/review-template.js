import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { AddRolePermissionWizardContext } from './add-role-permission-wizard';
import '../add-role/review.scss';

const ReviewTemplate = ({ formFields }) => {
  const { submitting } = useContext(AddRolePermissionWizardContext);

  if (submitting) {
    return (
      <Bullseye>
        <Spinner size="xl" />
      </Bullseye>
    );
  }

  return <div className="rbac">{[[{ ...formFields?.[0]?.[0] }]]}</div>;
};

ReviewTemplate.propTypes = {
  formFields: PropTypes.array,
};

export default ReviewTemplate;
