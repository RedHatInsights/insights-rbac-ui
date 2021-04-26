import React from 'react';
import { EmptyState, EmptyStateBody, EmptyStateIcon, Title, List, ListItem } from '@patternfly/react-core';
import { CogsIcon } from '@patternfly/react-icons';
// import RhelBundle from './rhel';

import './MUABundles.scss';

// eslint-disable-next-line no-unused-vars
const ApplicationServices = () => (
  <EmptyState variant="large" className="ins-l-myUserAccess-bundle-emptyState">
    <EmptyStateIcon icon={CogsIcon} />
    <Title headingLevel="h4">Application Services permissions are not managed with User Access</Title>
    <EmptyStateBody>
      <List className="ins-l-myUserAccess-bundle-emptyState-list">
        <ListItem>All users in the organization may view everything.</ListItem>
        <ListItem>Only Org. Administrators and cluster owners can perform actions on clusters.</ListItem>
        <ListItem>Only Org. Administrators and cluster owners can perform actions on clusters.</ListItem>
      </List>
    </EmptyStateBody>
  </EmptyState>
);

export default ApplicationServices;
