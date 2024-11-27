import React from 'react';
import useFieldApi, { UseFieldApiConfig } from '@data-driven-forms/react-form-renderer/use-field-api';
import { Alert } from '@patternfly/react-core';

const InlineErrorCmp: React.FC<UseFieldApiConfig> = (props) => {
  const { title, description } = useFieldApi(props);
  return (
    <Alert title={title} isInline variant="danger">
      <p>{description}</p>
    </Alert>
  );
};

export default InlineErrorCmp;
