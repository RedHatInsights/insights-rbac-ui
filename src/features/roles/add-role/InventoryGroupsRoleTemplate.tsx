import React from 'react';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';
import { useFlag } from '@unleash/proxy-client-react';

interface InventoryGroupsRoleTemplateProps {
  formFields: React.ReactNode[];
}

const InventoryGroupsRoleTemplate: React.FC<InventoryGroupsRoleTemplateProps> = ({ formFields }) => {
  const intl = useIntl();
  const enableWorkspacesNameChange = useFlag('platform.rbac.groups-to-workspaces-rename');

  return (
    <div className="rbac">
      <Title headingLevel="h1" size="xl" className="pf-v6-u-mb-lg">
        {intl.formatMessage(enableWorkspacesNameChange ? messages.workspacesAccessTitle : messages.inventoryGroupsAccessTitle)}
      </Title>
      {formFields}
    </div>
  );
};

export default InventoryGroupsRoleTemplate;
