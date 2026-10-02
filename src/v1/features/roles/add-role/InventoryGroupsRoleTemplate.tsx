import React from 'react';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { defineMessages, useIntl } from 'react-intl';

import { useWorkspacesRenameFlag } from '../../../../capabilities/useWorkspacesRenameFlag';

const messages = defineMessages({
  workspacesAccessTitle: {
    id: 'workspacesAccessTitle',
    defaultMessage: 'Define Workspaces access',
    description: 'Step for adding correct workspaces permissions to role.',
  },
  inventoryGroupsAccessTitle: {
    id: 'inventoryGroupsAccessTitle',
    defaultMessage: 'Define Inventory group access',
    description: 'Step for adding correct group permissions to role.',
  },
});

interface InventoryGroupsRoleTemplateProps {
  formFields: React.ReactNode[];
}

const InventoryGroupsRoleTemplate: React.FC<InventoryGroupsRoleTemplateProps> = ({ formFields }) => {
  const intl = useIntl();
  const enableWorkspacesNameChange = useWorkspacesRenameFlag();

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
