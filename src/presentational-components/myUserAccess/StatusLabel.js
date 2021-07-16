import React from 'react';
import PropTypes from 'prop-types';

import { Label, Tooltip, TooltipPosition } from '@patternfly/react-core';

const StatusLabel = ({ isOrgAdmin }) =>
  isOrgAdmin ? (
    <Tooltip position={TooltipPosition.right} content={<span> You can manage other users&apos; permissions with &apos;User access&apos; </span>}>
      <Label color="purple"> Org. Administrator </Label>
    </Tooltip>
  ) : (
    <React.Fragment />
  );

StatusLabel.propTypes = {
  isOrgAdmin: PropTypes.bool,
};

export default StatusLabel;
