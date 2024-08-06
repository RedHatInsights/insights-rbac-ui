import React from 'react';
import { ContentHeader } from '@patternfly/react-component-groups';
import { DataList, ExpandableSection, Text, TextVariants, Title } from '@patternfly/react-core';

const WorkspacesOverview = () => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const onToggle = (_event: React.MouseEvent, isExpanded: boolean) => {
    setIsExpanded(isExpanded);
  };

  const workspacesIcon = '/apps/frontend-assets/rbac-landing/rbac-landing-icon.svg';

  return (
    <>
      <ContentHeader
        title="Access Management"
        // to do - add url for viewing assets once available
        subtitle="Securely manage user access and organize assets within your organization using workspaces. Implement granular access controls to streamline permission management and ensure efficient, secure access to resources. View assets and roles organization diagram."
        icon={<img src={workspacesIcon} alt="workspaces-header-icon" />}
        linkProps={{
          label: 'Learn more',
          isExternal: true,
          // to do - add learn more url once available
        }}
      />

      <Title headingLevel="h2" className="pf-u-mb-md" data-ouia-component-id="header-title">
        Get started with workspaces
      </Title>
      <Text component={TextVariants.p}>
        Workspaces let&apos;s you group related assets together (such as RHEL hosts). This simplifies management and user access control.
      </Text>

      <ExpandableSection
        toggleText="Show me how my assets and permissions will be organized into workspaces"
        onToggle={onToggle}
        isExpanded={isExpanded}
      >
        {/* to do - add migration visualization when ready */}
      </ExpandableSection>

      {/* to do - add service-card component */}

      <Title headingLevel="h2" className="pf-u-mb-md" data-ouia-component-id="understanding-access-title">
        Understanding access
      </Title>

      <DataList aria-label="understanding access list" className="pf-u-mb-lg"></DataList>
    </>
  );
};

export default WorkspacesOverview;
