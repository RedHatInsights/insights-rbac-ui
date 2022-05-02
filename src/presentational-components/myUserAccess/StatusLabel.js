import React from 'react';
import PropTypes from 'prop-types';

import { Label, Tooltip, TooltipPosition } from '@patternfly/react-core';

const StatusLabel = ({ isOrgAdmin, isUserAccessAdmin }) => {
  const tootltipLabel = isOrgAdmin ? 'Org. Administrator' : 'User Access Admin';
  const tooltipContent = isOrgAdmin ? (
    <span> You can manage other users&apos; permissions with &apos;User access&apos; </span>
  ) : (
    <span>{`You were granted the User Access Administrator role by your Org. administrator and can now manage other User's permissions with 'User Access'`}</span>
  );

  if (isOrgAdmin || isUserAccessAdmin) {
    return (
      <Tooltip position={TooltipPosition.right} content={tooltipContent}>
        <Label color="purple"> {tootltipLabel} </Label>
      </Tooltip>
    );
  }
  return <React.Fragment />;
};

StatusLabel.propTypes = {
  isOrgAdmin: PropTypes.bool,
  isUserAccessAdmin: PropTypes.bool,
};

export default StatusLabel;
