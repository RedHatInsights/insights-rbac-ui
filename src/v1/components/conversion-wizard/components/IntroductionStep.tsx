import React, { useState } from 'react';
import { Alert, AlertActionCloseButton } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core/dist/dynamic/components/DescriptionList';
import { FormattedMessage, useIntl } from 'react-intl';

import WorkspaceHierarchyDiagram from '../assets/workspace-hierarchy.svg';
import PermissionsDiagram from '../assets/permissions-diagram.svg';
import RoleBindingsDiagram from '../assets/role-bindings-diagram.svg';

export const IntroductionStep: React.FC = () => {
  const intl = useIntl();
  const [showProductAvailabilityAlert, setShowProductAvailabilityAlert] = useState(true);
  const [showApiIntegrationAlert, setShowApiIntegrationAlert] = useState(true);

  return (
    <div>
      {/* Product availability warning alert */}
      {showProductAvailabilityAlert && (
        <Alert
          variant="warning"
          title={intl.formatMessage({
            id: 'conversionWizardProductAvailabilityAlertTitle',
            defaultMessage: 'Not all products are available yet',
            description: 'Title for product availability warning alert',
          })}
          isInline
          actionClose={<AlertActionCloseButton onClose={() => setShowProductAvailabilityAlert(false)} />}
          className="pf-v6-u-mb-md"
        >
          {intl.formatMessage({
            id: 'conversionWizardProductAvailabilityAlertDescription',
            defaultMessage:
              "Not every Red Hat product is available in this new experience yet. If your organization uses OpenShift Cluster Manager, Ansible Automation Platform, or Cost Management we recommend postponing conversion. Check back soon; we'll update this notice as each product completes integration.",
            description: 'Description for product availability warning alert',
          })}
        </Alert>
      )}

      {/* API integration info alert */}
      {showApiIntegrationAlert && (
        <Alert
          variant="info"
          title={intl.formatMessage({
            id: 'conversionWizardApiIntegrationAlertTitle',
            defaultMessage: 'Custom API Integrations Will Need to be Updated',
            description: 'Title for API integration info alert',
          })}
          isInline
          actionClose={<AlertActionCloseButton onClose={() => setShowApiIntegrationAlert(false)} />}
          className="pf-v6-u-mb-md"
        >
          <FormattedMessage
            id={'conversionWizardApiIntegrationAlertDescription'}
            defaultMessage={
              "If your organization has built custom integrations, scripts, or automation using Red Hat's {rbacApiLink}, these connections will need to be updated to use the new v2 RBAC API after this conversion. See {kbLink} for migration guidance."
            }
            description={'Description for API integration info alert'}
            values={{
              rbacApiLink: (
                <a href="https://developers.redhat.com/api-catalog/api/rbac" target="_blank" rel="noopener noreferrer">
                  RBAC API
                </a>
              ),
              kbLink: (
                <a href="https://access.redhat.com/articles/7147677" target="_blank" rel="noopener noreferrer">
                  {intl.formatMessage({
                    id: 'conversionWizardApiIntegrationKbLinkText',
                    defaultMessage: 'KB migration article',
                    description: 'Link text for KB article in API integration alert',
                  })}
                </a>
              ),
            }}
          />
        </Alert>
      )}

      {/* What changes during conversion */}
      <Title headingLevel="h2" size="xl">
        {intl.formatMessage({
          id: 'conversionWizardWhatChangesTitle',
          defaultMessage: 'What changes during conversion',
          description: 'Title for What changes during conversion section',
        })}
      </Title>

      <Content component="p" className="pf-v6-u-mt-md">
        <FormattedMessage
          id={'conversionWizardWorkspacesIntro'}
          defaultMessage={
            "The Red Hat Hybrid Cloud Console's new access management model replaces the legacy User Access feature. It introduces <strong>workspaces</strong>—a hierarchical structure that allows you to organize assets and control who can access them in your organization."
          }
          description={'Introduction paragraph about workspaces'}
          values={{ strong: (chunks) => <strong>{chunks}</strong> }}
        />
      </Content>

      <Content component="p" className="pf-v6-u-mt-md">
        {intl.formatMessage({
          id: 'conversionWizardPermissionsCascade',
          defaultMessage:
            'Instead of managing permissions for each system individually, you can organize systems into workspaces and grant permissions that automatically cascade down through your organizational structure.',
          description: 'Paragraph about permissions cascading',
        })}
      </Content>

      <Content component="p" className="pf-v6-u-mt-md">
        <FormattedMessage
          id={'conversionWizardLearnMoreGuide'}
          defaultMessage={'Learn more in our {link} Guide'}
          description={'Learn more in our guide text'}
          values={{
            link: (
              <a
                href="https://access.redhat.com/system/files/private_announcement_files/Hybrid-Cloud-Console-Access-Management-with-Workspaces.pdf#page=1"
                target="_blank"
                rel="noopener noreferrer"
              >
                {intl.formatMessage({
                  id: 'conversionWizardGetStartedLink',
                  defaultMessage: 'Getting Started with Access Management',
                  description: 'Getting Started with Access Management link text',
                })}
              </a>
            ),
          }}
        />
      </Content>

      <Title headingLevel="h3" size="lg" className="pf-v6-u-mt-lg">
        {intl.formatMessage({
          id: 'conversionWizardHierarchyTitle',
          defaultMessage: 'During conversion a workspace hierarchy will be created',
          description: 'During conversion a workspace hierarchy will be created title',
        })}
      </Title>

      <DescriptionList isHorizontal isCompact autoFitMinModifier={{ default: '200px' }} className="pf-v6-u-mt-md">
        <DescriptionListGroup>
          <DescriptionListTerm>
            {intl.formatMessage({ id: 'conversionWizardRootWorkspace', defaultMessage: 'Root workspace', description: 'Root workspace term' })}
          </DescriptionListTerm>
          <DescriptionListDescription>
            {intl.formatMessage({
              id: 'conversionWizardRootWorkspaceDesc',
              defaultMessage: 'Created at the top level for organization access',
              description: 'Root workspace description',
            })}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>
            {intl.formatMessage({
              id: 'conversionWizardDefaultWorkspace',
              defaultMessage: 'Default workspace',
              description: 'Default workspace term',
            })}
          </DescriptionListTerm>
          <DescriptionListDescription>
            {intl.formatMessage({
              id: 'conversionWizardDefaultWorkspaceDesc',
              defaultMessage: 'Created under Root, existing workspaces move here as sub workspaces',
              description: 'Default workspace description',
            })}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>
            {intl.formatMessage({
              id: 'conversionWizardExistingWorkspaces',
              defaultMessage: 'Existing workspaces',
              description: 'Existing workspaces term',
            })}
          </DescriptionListTerm>
          <DescriptionListDescription>
            {intl.formatMessage({
              id: 'conversionWizardExistingWorkspacesDesc',
              defaultMessage: 'Moved under the default workspace. Configured permissions are preserved.',
              description: 'Existing workspaces description',
            })}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>
            {intl.formatMessage({
              id: 'conversionWizardUngroupedHosts',
              defaultMessage: 'Ungrouped hosts workspace',
              description: 'Ungrouped hosts workspace term',
            })}
          </DescriptionListTerm>
          <DescriptionListDescription>
            {intl.formatMessage({
              id: 'conversionWizardUngroupedHostsDesc',
              defaultMessage: 'Created under Default for existing systems not yet in a workspace',
              description: 'Ungrouped hosts workspace description',
            })}
          </DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>

      <div className="pf-v6-u-mt-md">
        <img
          src={WorkspaceHierarchyDiagram}
          alt={intl.formatMessage({
            id: 'conversionWizardWorkspaceHierarchyDiagramAlt',
            defaultMessage: 'Workspace hierarchy diagram',
            description: 'Alt text for workspace hierarchy diagram',
          })}
        />
      </div>

      {/* How permissions change */}
      <Title headingLevel="h2" size="xl" className="pf-v6-u-mt-xl">
        {intl.formatMessage({
          id: 'conversionWizardPermissionsChangeTitle',
          defaultMessage: 'How permissions change',
          description: 'How permissions change section title',
        })}
      </Title>

      <DescriptionList isHorizontal className="pf-v6-u-mt-md">
        <DescriptionListGroup>
          <DescriptionListTerm>
            {intl.formatMessage({
              id: 'conversionWizardDefaultAdminAccess',
              defaultMessage: 'Default Admin access',
              description: 'Default Admin access term',
            })}
          </DescriptionListTerm>
          <DescriptionListDescription>
            {intl.formatMessage({
              id: 'conversionWizardDefaultAdminAccessDesc',
              defaultMessage: 'Scoped to root workspace (all workspaces)',
              description: 'Default Admin access description',
            })}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>
            {intl.formatMessage({ id: 'conversionWizardDefaultAccess', defaultMessage: 'Default Access', description: 'Default Access term' })}
          </DescriptionListTerm>
          <DescriptionListDescription>
            {intl.formatMessage({
              id: 'conversionWizardDefaultAccessDesc',
              defaultMessage: 'Scoped to default workspace and sub workspaces only',
              description: 'Default Access description',
            })}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>
            {intl.formatMessage({ id: 'conversionWizardCustomGroups', defaultMessage: 'Custom groups', description: 'Custom groups term' })}
          </DescriptionListTerm>
          <DescriptionListDescription>
            {intl.formatMessage({
              id: 'conversionWizardCustomGroupsDesc',
              defaultMessage: 'Preserved with all memberships intact',
              description: 'Custom groups description',
            })}
          </DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>

      <Content component="p" className="pf-v6-u-mt-md">
        {intl.formatMessage({
          id: 'conversionWizardIsolatedEnvironments',
          defaultMessage:
            'To create isolated environments, remove unnecessary permissions in the default workspace and create peer workspaces directly under the default workspace so they will not inherit additional permissions from the default workspace. In this example, the Project Alpha workspace is created to allow for fewer permissions for that workspace:',
          description: 'Creating isolated environments paragraph',
        })}
      </Content>

      <div className="pf-v6-u-mt-md">
        <img
          src={PermissionsDiagram}
          alt={intl.formatMessage({
            id: 'conversionWizardPermissionsDiagramAlt',
            defaultMessage: 'Permissions and workspace hierarchy diagram',
            description: 'Alt text for permissions and workspace hierarchy diagram',
          })}
        />
      </div>

      {/* How role bindings work */}
      <Title headingLevel="h2" size="xl" className="pf-v6-u-mt-xl">
        {intl.formatMessage({
          id: 'conversionWizardRoleBindingsTitle',
          defaultMessage: 'How role bindings work',
          description: 'How role bindings work section title',
        })}
      </Title>

      <Content component="p" className="pf-v6-u-mt-md">
        {intl.formatMessage({
          id: 'conversionWizardRoleBindingsIntro',
          defaultMessage:
            'Role bindings are the mechanism that link subjects (users, groups, service accounts) and roles to a workspace. While workspace access management is the "what", role bindings are the "how".',
          description: 'Role bindings introduction paragraph',
        })}
      </Content>

      <Title headingLevel="h3" size="md" className="pf-v6-u-mt-md">
        {intl.formatMessage({
          id: 'conversionWizardRoleBindingConnectsTitle',
          defaultMessage: 'A role binding connects:',
          description: 'A role binding connects title',
        })}
      </Title>

      <DescriptionList isHorizontal className="pf-v6-u-mt-sm">
        <DescriptionListGroup>
          <DescriptionListTerm>
            {intl.formatMessage({ id: 'conversionWizardRoleBindingWho', defaultMessage: 'Who', description: 'Role binding Who term' })}
          </DescriptionListTerm>
          <DescriptionListDescription>
            {intl.formatMessage({
              id: 'conversionWizardRoleBindingWhoDesc',
              defaultMessage: 'User group',
              description: 'Role binding Who description',
            })}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>
            {intl.formatMessage({ id: 'conversionWizardRoleBindingWhat', defaultMessage: 'What', description: 'Role binding What term' })}
          </DescriptionListTerm>
          <DescriptionListDescription>
            {intl.formatMessage({
              id: 'conversionWizardRoleBindingWhatDesc',
              defaultMessage: 'Role (permissions)',
              description: 'Role binding What description',
            })}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>
            {intl.formatMessage({ id: 'conversionWizardRoleBindingWhere', defaultMessage: 'Where', description: 'Role binding Where term' })}
          </DescriptionListTerm>
          <DescriptionListDescription>
            {intl.formatMessage({
              id: 'conversionWizardRoleBindingWhereDesc',
              defaultMessage: 'Workspace',
              description: 'Role binding Where description',
            })}
          </DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>

      <Content component="p" className="pf-v6-u-mt-md">
        {intl.formatMessage({
          id: 'conversionWizardRoleBindingExample',
          defaultMessage:
            'The following example demonstrates how role bindings provide administrative access to Ethan from the engineering team for RHEL systems in the Project Alpha workspace:',
          description: 'Role binding example paragraph',
        })}
      </Content>

      <div className="pf-v6-u-mt-md">
        <img
          src={RoleBindingsDiagram}
          alt={intl.formatMessage({
            id: 'conversionWizardRoleBindingsDiagramAlt',
            defaultMessage: 'Role bindings example diagram',
            description: 'Alt text for role bindings example diagram',
          })}
        />
      </div>

      <Content component="p" className="pf-v6-u-mt-md">
        <FormattedMessage
          id={'conversionWizardRoleBindingsLinkContext'}
          defaultMessage={'See {link} for more information.'}
          description={'Context text around role bindings link'}
          values={{
            link: (
              <a
                href="https://access.redhat.com/system/files/private_announcement_files/Hybrid-Cloud-Console-Access-Management-with-Workspaces.pdf#page=21"
                target="_blank"
                rel="noopener noreferrer"
              >
                {intl.formatMessage({
                  id: 'conversionWizardRoleBindingsLinkText',
                  defaultMessage: 'How role bindings work',
                  description: 'How role bindings work link text',
                })}
              </a>
            ),
          }}
        />
      </Content>

      {/* Legacy remediation plans will be deleted */}
      <Title headingLevel="h2" size="xl" className="pf-v6-u-mt-xl">
        {intl.formatMessage({
          id: 'conversionWizardRemediationPlansTitle',
          defaultMessage: 'Legacy remediation plans will be deleted',
          description: 'Legacy remediation plans will be deleted section title',
        })}
      </Title>

      <Content component="p" className="pf-v6-u-mt-md">
        {intl.formatMessage({
          id: 'conversionWizardRemediationPlansWarning',
          defaultMessage:
            'Once you proceed with this conversion, all existing remediation plans across your organization will be deleted. Please ensure your teams have executed or downloaded any active plans before continuing.',
          description: 'Remediation plans warning paragraph',
        })}
      </Content>

      <Content component="p" className="pf-v6-u-mt-md">
        {intl.formatMessage({
          id: 'conversionWizardRemediationPlansNew',
          defaultMessage:
            'Remediation plans created after this conversion will be tied to your workspaces rather than individual users, enabling authorized team members to seamlessly collaborate, update, and execute them.',
          description: 'New remediation plans features paragraph',
        })}
      </Content>
    </div>
  );
};
