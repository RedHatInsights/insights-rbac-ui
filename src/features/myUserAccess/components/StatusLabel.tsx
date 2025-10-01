import React from 'react';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';

import { Label } from '@patternfly/react-core/dist/dynamic/components/Label';
import { Tooltip } from '@patternfly/react-core/dist/dynamic/components/Tooltip';
import { TooltipPosition } from '@patternfly/react-core';

interface StatusLabelProps {
  isOrgAdmin?: boolean;
  isUserAccessAdmin?: boolean;
}

const StatusLabel: React.FC<StatusLabelProps> = ({ isOrgAdmin, isUserAccessAdmin }) => {
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

export default StatusLabel;
