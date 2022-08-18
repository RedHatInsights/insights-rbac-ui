import React from 'react';
import { EmptyState, EmptyStateBody, EmptyStateIcon, Title, List, ListItem } from '@patternfly/react-core';
import { CogsIcon } from '@patternfly/react-icons';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';
// import RhelBundle from './rhel';

import './MUABundles.scss';

// eslint-disable-next-line no-unused-vars
const ApplicationServices = () => {
  const intl = useIntl();
  return (
    <EmptyState variant="large" className="rbac-m-myUserAccess-bundle-emptyState">
      <EmptyStateIcon icon={CogsIcon} />
      <Title headingLevel="h4">{intl.formatMessage(messages.appServicesNotManaged)}</Title>
      <EmptyStateBody>
        <List className="rbac-m-myUserAccess-bundle-emptyState-list">
          <ListItem>{intl.formatMessage(messages.allUsersViewEverything)}</ListItem>
          <ListItem>{intl.formatMessage(messages.actionsOnClustersPermissions)}</ListItem>
        </List>
      </EmptyStateBody>
    </EmptyState>
  );
};

export default ApplicationServices;
