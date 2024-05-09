import React from 'react';
import PropTypes from 'prop-types';
import { Title } from '@patternfly/react-core';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';
import { useFlag } from '@unleash/proxy-client-react';

const InventoryGroupsRoleTemplate = ({ formFields }) => {
  const intl = useIntl();
  const enableWorkspacesNameChange = useFlag('platform.rbac.groups-to-workspaces-rename');

  return (
    <div className="rbac">
      <Title headingLevel="h1" size="xl" className="pf-v5-u-mb-lg">
        {intl.formatMessage(enableWorkspacesNameChange ? messages.workspacesAccessTitle : messages.inventoryGroupsAccessTitle)}
      </Title>
      {formFields}
    </div>
  );
};

InventoryGroupsRoleTemplate.propTypes = {
  formFields: PropTypes.array,
};

export default InventoryGroupsRoleTemplate;
