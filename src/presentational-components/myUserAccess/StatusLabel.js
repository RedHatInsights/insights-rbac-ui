import React from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import messages from '../../Messages';

import { Label, Tooltip, TooltipPosition } from '@patternfly/react-core';

const StatusLabel = ({ isOrgAdmin, isUserAccessAdmin }) => {
  const intl = useIntl();

  const tootltipLabel = intl.formatMessage(messages[isOrgAdmin ? 'orgAdministrator' : 'userAccessAdmin']);
  const tooltipContent = <span>{intl.formatMessage(messages[isOrgAdmin ? 'orgAdminHint' : 'userAccessAdminHint'])}</span>;

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
