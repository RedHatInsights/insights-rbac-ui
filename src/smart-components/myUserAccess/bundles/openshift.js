import React from 'react';
import { EmptyState, EmptyStateBody, EmptyStateIcon, Title } from '@patternfly/react-core';
import { CogsIcon } from '@patternfly/react-icons';

import './MUABundles.scss';

const OpenshiftBundle = () => (
  <EmptyState variant="large" className="ins-l-myUserAccess-bundle-emptyState">
    <EmptyStateIcon icon={CogsIcon} />
    <Title headingLevel="h4">OpenShift Cluster Manager permissions are not managed with User Access</Title>
    <EmptyStateBody>
      All users in the organization may view everything, but only Org. Administrators and cluster owners can perform actions on clusters.
    </EmptyStateBody>
  </EmptyState>
);

export default OpenshiftBundle;
