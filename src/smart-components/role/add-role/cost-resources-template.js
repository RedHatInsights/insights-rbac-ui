import React from 'react';
import PropTypes from 'prop-types';
import { Title } from '@patternfly/react-core';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';

const CostResourcesTemplate = ({ formFields }) => {
  const intl = useIntl();
  return (
    <div className="rbac">
      <Title headingLevel="h1" size="xl" className="pf-u-mb-lg">
        {intl.formatMessage(messages.reviewDetails)}
      </Title>
      {formFields}
    </div>
  );
};

CostResourcesTemplate.propTypes = {
  formFields: PropTypes.array,
};

export default CostResourcesTemplate;
