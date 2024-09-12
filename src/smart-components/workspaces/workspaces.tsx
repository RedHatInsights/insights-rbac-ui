import React from 'react';
import { useIntl } from 'react-intl';
import messages from '../../Messages';
import { ContentHeader } from '@patternfly/react-component-groups';
import { Card, PageSection } from '@patternfly/react-core';

const Workspaces = () => {
  const intl = useIntl();

  return (
    <React.Fragment>
      <ContentHeader
        title={intl.formatMessage(messages.workspaces)}
        subtitle={intl.formatMessage(messages.workspacesSubtitle)}
        linkProps={{
          label: intl.formatMessage(messages.workspacesLearnMore),
          isExternal: true,
          // TODO: URL to be provided by UX later on
          href: '#',
        }}
      />
      <PageSection>
        <Card aria-label="Get started card" className="pf-u-mb-lg" data-ouia-component-id="get-started-card">
          Table to be added
        </Card>
      </PageSection>
    </React.Fragment>
  );
};

export default Workspaces;
