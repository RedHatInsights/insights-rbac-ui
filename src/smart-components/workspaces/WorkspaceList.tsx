import React from 'react';
import { useIntl } from 'react-intl';
import messages from '../../Messages';
import { ContentHeader } from '@patternfly/react-component-groups';
import { PageSection } from '@patternfly/react-core';
import WorkspaceListTable from './WorkspaceListTable';

const WorkspaceList = () => {
  const intl = useIntl();

  return (
    <React.Fragment>
      <ContentHeader
        title={intl.formatMessage(messages.workspaces)}
        subtitle={intl.formatMessage(messages.workspacesSubtitle)}
        linkProps={{
          label: intl.formatMessage(messages.workspacesLearnMore),
          isExternal: true,
          href: '#', //TODO: URL to be specified by UX team later
        }}
      />
      <PageSection>
        <WorkspaceListTable />
      </PageSection>
    </React.Fragment>
  );
};

export default WorkspaceList;
