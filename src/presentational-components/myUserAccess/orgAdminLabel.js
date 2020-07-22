import React from 'react';
import { Label, Tooltip, TooltipPosition } from '@patternfly/react-core';

const OrgAdminLabel = () => (
    <Tooltip
        position={ TooltipPosition.right }
        content={ <span> You can manage other users&apos; permissions with &apos;User access&apos; </span> }>
        <Label color='blue'> Org. Administrator </Label>
    </Tooltip>
);

export default OrgAdminLabel;
