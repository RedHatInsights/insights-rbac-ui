import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import messages from '../../Messages';

const ResourceDefinitionsLink = ({ onClick, access }) => {
  const intl = useIntl();

  return access.resourceDefinitions.length === 0 ? (
    <span>{intl.formatMessage(messages.notApplicable)}</span>
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
