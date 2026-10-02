import React from 'react';
import { useIntl } from 'react-intl';

import { Label } from '@patternfly/react-core/dist/dynamic/components/Label';
import { Tooltip } from '@patternfly/react-core/dist/dynamic/components/Tooltip';
import { TooltipPosition } from '@patternfly/react-core/dist/dynamic/components/Tooltip';

interface StatusLabelProps {
  isOrgAdmin?: boolean;
  isUserAccessAdmin?: boolean;
}

const StatusLabel: React.FC<StatusLabelProps> = ({ isOrgAdmin, isUserAccessAdmin }) => {
  const intl = useIntl();

  const tootltipLabel = isOrgAdmin
    ? intl.formatMessage({ id: 'orgAdministrator', defaultMessage: 'Org. Administrator', description: 'Org. Administrator name' })
    : intl.formatMessage({ id: 'userAccessAdmin', defaultMessage: 'User Access Admin', description: 'User Access Admin name' });
  const tooltipContent = (
    <span>
      {isOrgAdmin
        ? intl.formatMessage({
            id: 'orgAdminHint',
            defaultMessage: "You can manage other users' permissions with 'User access'",
            description: 'User Access Admin hint about permissions',
          })
        : intl.formatMessage({
            id: 'userAccessAdminHint',
            defaultMessage: "You can manage other users' permissions with 'User access'",
            description: 'Org. Admin hint about permissions',
          })}
    </span>
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

export default StatusLabel;
