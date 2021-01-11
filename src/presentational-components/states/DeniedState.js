import React from 'react';

import { Title, Button, EmptyState, EmptyStateVariant, EmptyStateIcon, EmptyStateBody } from '@patternfly/react-core';

import { LockIcon } from '@patternfly/react-icons';
import { PageHeader, PageHeaderTitle, Main } from '@redhat-cloud-services/frontend-components';

import './DeniedState.scss';

const DeniedState = () => {
  return (
    <React.Fragment>
      <PageHeader>
        <PageHeaderTitle title="User access" />
      </PageHeader>
      <Main>
        <EmptyState variant={EmptyStateVariant.full} className="ins-c-rbac-denied-state">
          <EmptyStateIcon icon={LockIcon} />
          <Title headingLevel="h4">You do not have permissions to view or manage User access</Title>
          <EmptyStateBody>Contact your organization administrator(s) for more information.</EmptyStateBody>
          {document.referrer ? (
            <Button variant="primary" onClick={() => history.back()}>
              Return to previous page
            </Button>
          ) : (
            <Button variant="primary" component="a" href=".">
              Go to landing page
            </Button>
          )}
        </EmptyState>
      </Main>
    </React.Fragment>
  );
};

export default DeniedState;
