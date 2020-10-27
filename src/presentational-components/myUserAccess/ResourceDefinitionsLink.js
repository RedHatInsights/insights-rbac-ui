import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

const ResourceDefinitionsLink = ({ onClick, access }) => {
  return access.resourceDefinitions.length === 0 ? <span>N/A</span> : <Link to={url}>{access.resourceDefinitions.length}</Link>;
};

ResourceDefinitionsLink.propTypes = {
  onClick: PropTypes.func.isRequired,
  access: PropTypes.shape({ resourceDefinitions: PropTypes.array.isRequired }).isRequired,
};

export default ResourceDefinitionsLink;
