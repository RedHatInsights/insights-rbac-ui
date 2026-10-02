import React from 'react';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { useIntl } from 'react-intl';
import { commonMessages } from '../../../../shared/messages/common';

interface CostResourcesTemplateProps {
  formFields: React.ReactNode[];
}

const CostResourcesTemplate: React.FC<CostResourcesTemplateProps> = ({ formFields }) => {
  const intl = useIntl();
  return (
    <div className="rbac">
      <Title headingLevel="h1" size="xl" className="pf-v6-u-mb-lg">
        {intl.formatMessage(commonMessages.defineCostResources)}
      </Title>
      {formFields}
    </div>
  );
};

export default CostResourcesTemplate;
