import React from 'react';
import PropTypes from 'prop-types';
import { Title } from '@patternfly/react-core';

const CostResourcesTemplate = ({ formFields }) => (
  <div className="rbac">
    <Title headingLevel="h1" size="xl" className="pf-u-mb-lg">
      Review details
    </Title>
    {formFields}
  </div>
);

CostResourcesTemplate.propTypes = {
  formFields: PropTypes.array,
};

export default CostResourcesTemplate;
