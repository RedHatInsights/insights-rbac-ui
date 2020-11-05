import React, { useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Bullseye, Spinner, Text, TextContent, Title } from '@patternfly/react-core';
import { AddRoleWizardContext } from './add-role-wizard';
import { asyncValidator } from './validators';
import './review.scss';
import AddRoleSuccess from './add-role-success';
import AddRoleError from './add-role-error';
import useFormApi from '@data-driven-forms/react-form-renderer/dist/cjs/use-form-api';

const ReviewTemplate = ({ formFields }) => {
  const { success, submitting, error, setWizardError } = useContext(AddRoleWizardContext);
  const { getState } = useFormApi();
  useEffect(() => {
    setWizardError(undefined);
    asyncValidator(getState().values['role-name'])
      .then(() => setWizardError(false))
      .catch(() => setWizardError(true));
  }, []);

  if (typeof error === 'undefined' || submitting) {
    return (
      <Bullseye>
        <Spinner size="xl" />
      </Bullseye>
    );
  }

  if (error === true) {
    return <AddRoleError />;
  }

  if (success && !submitting) {
    return <AddRoleSuccess />;
  }

  return (
    <React.Fragment>
      <Title headingLevel="h1" size="xl" className="ins-c-rbac__gutter-sm">
        Review details
      </Title>
      <TextContent className="ins-c-rbac__gutter-md">
        <Text>Review and confirm the details for your role, or click Back to revise.</Text>
      </TextContent>
      {[[{ ...formFields?.[0]?.[0] }]]}
    </React.Fragment>
  );
};

ReviewTemplate.propTypes = {
  formFields: PropTypes.array,
};

export default ReviewTemplate;
