import React from 'react';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core/dist/dynamic/components/DescriptionList';
import { FormattedMessage, useIntl } from 'react-intl';
import messages from '../../../../Messages';
import WorkspaceHierarchyDiagram from '../assets/workspace-hierarchy.svg';
import PermissionsDiagram from '../assets/permissions-diagram.svg';
import RoleBindingsDiagram from '../assets/role-bindings-diagram.svg';

export const IntroductionStep: React.FC = () => {
  const intl = useIntl();

  return (
    <div>
      {/* What changes during conversion */}
      <Title headingLevel="h2" size="xl">
        {intl.formatMessage(messages.conversionWizardWhatChangesTitle)}
      </Title>

      <Content component="p" className="pf-v6-u-mt-md">
        <FormattedMessage {...messages.conversionWizardWorkspacesIntro} values={{ strong: (chunks) => <strong>{chunks}</strong> }} />
      </Content>

      <Content component="p" className="pf-v6-u-mt-md">
        {intl.formatMessage(messages.conversionWizardPermissionsCascade)}
      </Content>

      <Content component="p" className="pf-v6-u-mt-md">
        <FormattedMessage
          {...messages.conversionWizardLearnMoreGuide}
          values={{
            link: (
              <a
                href="https://access.redhat.com/system/files/private_announcement_files/Hybrid-Cloud-Console-Access-Management-with-Workspaces.pdf#page=1"
                target="_blank"
                rel="noopener noreferrer"
              >
                {intl.formatMessage(messages.conversionWizardGetStartedLink)}
              </a>
            ),
          }}
        />
      </Content>

      <Title headingLevel="h3" size="lg" className="pf-v6-u-mt-lg">
        {intl.formatMessage(messages.conversionWizardHierarchyTitle)}
      </Title>

      <DescriptionList isHorizontal isCompact autoFitMinModifier={{ default: '200px' }} className="pf-v6-u-mt-md">
        <DescriptionListGroup>
          <DescriptionListTerm>{intl.formatMessage(messages.conversionWizardRootWorkspace)}</DescriptionListTerm>
          <DescriptionListDescription>{intl.formatMessage(messages.conversionWizardRootWorkspaceDesc)}</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{intl.formatMessage(messages.conversionWizardDefaultWorkspace)}</DescriptionListTerm>
          <DescriptionListDescription>{intl.formatMessage(messages.conversionWizardDefaultWorkspaceDesc)}</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{intl.formatMessage(messages.conversionWizardExistingWorkspaces)}</DescriptionListTerm>
          <DescriptionListDescription>{intl.formatMessage(messages.conversionWizardExistingWorkspacesDesc)}</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{intl.formatMessage(messages.conversionWizardUngroupedHosts)}</DescriptionListTerm>
          <DescriptionListDescription>{intl.formatMessage(messages.conversionWizardUngroupedHostsDesc)}</DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>

      <div className="pf-v6-u-mt-md">
        <img src={WorkspaceHierarchyDiagram} alt="Workspace hierarchy diagram" />
      </div>

      {/* How permissions change */}
      <Title headingLevel="h2" size="xl" className="pf-v6-u-mt-xl">
        {intl.formatMessage(messages.conversionWizardPermissionsChangeTitle)}
      </Title>

      <DescriptionList isHorizontal className="pf-v6-u-mt-md">
        <DescriptionListGroup>
          <DescriptionListTerm>{intl.formatMessage(messages.conversionWizardDefaultAdminAccess)}</DescriptionListTerm>
          <DescriptionListDescription>{intl.formatMessage(messages.conversionWizardDefaultAdminAccessDesc)}</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{intl.formatMessage(messages.conversionWizardDefaultAccess)}</DescriptionListTerm>
          <DescriptionListDescription>{intl.formatMessage(messages.conversionWizardDefaultAccessDesc)}</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{intl.formatMessage(messages.conversionWizardCustomGroups)}</DescriptionListTerm>
          <DescriptionListDescription>{intl.formatMessage(messages.conversionWizardCustomGroupsDesc)}</DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>

      <Content component="p" className="pf-v6-u-mt-md">
        {intl.formatMessage(messages.conversionWizardIsolatedEnvironments)}
      </Content>

      <div className="pf-v6-u-mt-md">
        <img src={PermissionsDiagram} alt="Permissions and workspace hierarchy diagram" />
      </div>

      {/* How role bindings work */}
      <Title headingLevel="h2" size="xl" className="pf-v6-u-mt-xl">
        {intl.formatMessage(messages.conversionWizardRoleBindingsTitle)}
      </Title>

      <Content component="p" className="pf-v6-u-mt-md">
        {intl.formatMessage(messages.conversionWizardRoleBindingsIntro)}
      </Content>

      <Title headingLevel="h3" size="md" className="pf-v6-u-mt-md">
        {intl.formatMessage(messages.conversionWizardRoleBindingConnectsTitle)}
      </Title>

      <DescriptionList isHorizontal className="pf-v6-u-mt-sm">
        <DescriptionListGroup>
          <DescriptionListTerm>{intl.formatMessage(messages.conversionWizardRoleBindingWho)}</DescriptionListTerm>
          <DescriptionListDescription>{intl.formatMessage(messages.conversionWizardRoleBindingWhoDesc)}</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{intl.formatMessage(messages.conversionWizardRoleBindingWhat)}</DescriptionListTerm>
          <DescriptionListDescription>{intl.formatMessage(messages.conversionWizardRoleBindingWhatDesc)}</DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{intl.formatMessage(messages.conversionWizardRoleBindingWhere)}</DescriptionListTerm>
          <DescriptionListDescription>{intl.formatMessage(messages.conversionWizardRoleBindingWhereDesc)}</DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>

      <Content component="p" className="pf-v6-u-mt-md">
        {intl.formatMessage(messages.conversionWizardRoleBindingExample)}
      </Content>

      <div className="pf-v6-u-mt-md">
        <img src={RoleBindingsDiagram} alt="Role bindings example diagram" />
      </div>

      <Content component="p" className="pf-v6-u-mt-md">
        <FormattedMessage
          {...messages.conversionWizardRoleBindingsLinkContext}
          values={{
            link: (
              <a
                href="https://access.redhat.com/system/files/private_announcement_files/Hybrid-Cloud-Console-Access-Management-with-Workspaces.pdf#page=21"
                target="_blank"
                rel="noopener noreferrer"
              >
                {intl.formatMessage(messages.conversionWizardRoleBindingsLinkText)}
              </a>
            ),
          }}
        />
      </Content>

      {/* Legacy remediation plans will be deleted */}
      <Title headingLevel="h2" size="xl" className="pf-v6-u-mt-xl">
        {intl.formatMessage(messages.conversionWizardRemediationPlansTitle)}
      </Title>

      <Content component="p" className="pf-v6-u-mt-md">
        {intl.formatMessage(messages.conversionWizardRemediationPlansWarning)}
      </Content>

      <Content component="p" className="pf-v6-u-mt-md">
        {intl.formatMessage(messages.conversionWizardRemediationPlansNew)}
      </Content>
    </div>
  );
};
