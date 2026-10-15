import React from 'react';
import useFieldApi, { UseFieldApiConfig } from '@data-driven-forms/react-form-renderer/use-field-api';
import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';

interface InlineErrorProps extends Partial<UseFieldApiConfig> {
  title?: string;
  description?: string;
}

const InlineErrorCmp: React.FC<InlineErrorProps> = (props) => {
  // If title and description are provided directly, use them
  // Otherwise, use the useFieldApi hook to get them from form context
  let title: string;
  let description: string;

  if (props.title && props.description) {
    title = props.title;
    description = props.description;
  } else {
    // For useFieldApi, we need to ensure we have the required properties
    const fieldApiProps = props as UseFieldApiConfig;
    const fieldApi = useFieldApi(fieldApiProps);
    title = fieldApi.title;
    description = fieldApi.description;
  }

  return (
    <Alert title={title} isInline variant="danger">
      <p>{description}</p>
    </Alert>
  );
};

export default InlineErrorCmp;
