import React from 'react';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';

interface CostResourcesTemplateProps {
  formFields: React.ReactNode[];
}

const CostResourcesTemplate: React.FC<CostResourcesTemplateProps> = ({ formFields }) => {
  const intl = useIntl();
  return (
    <div className="rbac">
      <Title headingLevel="h1" size="xl" className="pf-v5-u-mb-lg">
        {intl.formatMessage(messages.defineCostResources)}
      </Title>
      {formFields}
    </div>
  );
};

export default CostResourcesTemplate;
