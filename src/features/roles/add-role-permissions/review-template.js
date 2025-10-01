import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Bullseye } from '@patternfly/react-core';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import '../add-role/review.scss';
import { AddRolePermissionWizardContext } from './add-role-permission-wizard-context';

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
