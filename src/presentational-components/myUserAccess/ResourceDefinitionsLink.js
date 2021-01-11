import React from 'react';
import PropTypes from 'prop-types';

const ResourceDefinitionsLink = ({ onClick, access }) => {
  return access.resourceDefinitions.length === 0 ? (
    <span>N/A</span>
  ) : (
    <a
      onClick={() => {
        onClick();
        return false;
      }}
    >
      {access.resourceDefinitions.length}
    </a>
  );
};

ResourceDefinitionsLink.propTypes = {
  onClick: PropTypes.func.isRequired,
  access: PropTypes.shape({ resourceDefinitions: PropTypes.array.isRequired }).isRequired,
};

export default ResourceDefinitionsLink;
