import React from 'react';
import PropTypes from 'prop-types';
import { Title } from '@patternfly/react-core';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';

const InventoryGroupsRoleTemplate = ({ formFields }) => {
  const intl = useIntl();
  return (
    <div className="rbac">
      <Title headingLevel="h1" size="xl" className="pf-v5-u-mb-lg">
        {intl.formatMessage(messages.inventoryGroupsAccessTitle)}
      </Title>
      {formFields}
    </div>
  );
};

InventoryGroupsRoleTemplate.propTypes = {
  formFields: PropTypes.array,
};

export default InventoryGroupsRoleTemplate;
