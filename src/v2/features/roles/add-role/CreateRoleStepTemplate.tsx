import React from 'react';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { Stack, StackItem } from '@patternfly/react-core/dist/dynamic/layouts/Stack';
import { useIntl } from 'react-intl';
import messages from '../../../../Messages';

interface CreateRoleStepTemplateProps {
  formFields: React.ReactNode[][];
}

const CreateRoleStepTemplate: React.FC<CreateRoleStepTemplateProps> = ({ formFields }) => {
  const intl = useIntl();

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h1" size="xl">
          {intl.formatMessage(messages.createRole)}
        </Title>
      </StackItem>
      {formFields?.map((fieldGroup, groupIndex) =>
        fieldGroup?.map((field, fieldIndex) => <StackItem key={`${groupIndex}-${fieldIndex}`}>{field}</StackItem>),
      )}
    </Stack>
  );
};

export default CreateRoleStepTemplate;
