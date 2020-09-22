import React from 'react';
import PropTypes from 'prop-types';

import { Button } from '@patternfly/react-core';

const ResourceDefinitionsButton = ({ onClick, access }) => (
  <Button onClick={onClick} variant="link" isDisabled={access.resourceDefinitions.length === 0}>
    {access.resourceDefinitions.length || 'N/A'}
  </Button>
);

ResourceDefinitionsButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  access: PropTypes.shape({ resourceDefinitions: PropTypes.array.isRequired }).isRequired,
};

export default ResourceDefinitionsButton;
