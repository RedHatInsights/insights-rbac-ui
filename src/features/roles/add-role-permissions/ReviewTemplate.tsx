import React, { useContext } from 'react';
import { Bullseye } from '@patternfly/react-core';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import { AddRolePermissionWizardContext } from './AddRolePermissionWizardContext';

interface ReviewTemplateProps {
  formFields: React.ReactNode[][];
}

const ReviewTemplate: React.FC<ReviewTemplateProps> = ({ formFields }) => {
  const { submitting } = useContext(AddRolePermissionWizardContext);

  if (submitting) {
    return (
      <Bullseye>
        <Spinner size="xl" />
      </Bullseye>
    );
  }

  return <div className="rbac">{formFields?.[0]?.[0]}</div>;
};

export default ReviewTemplate;
