import React from 'react';
import PageHeader from '@patternfly/react-component-groups/dist/dynamic/PageHeader';
import ServiceCard from '@patternfly/react-component-groups/dist/dynamic/ServiceCard';
import { Button, ButtonVariant } from '@patternfly/react-core/dist/dynamic/components/Button';
import { DataList } from '@patternfly/react-core/dist/dynamic/components/DataList';
import { Gallery, GalleryItem } from '@patternfly/react-core/dist/dynamic/layouts/Gallery';
import { Label } from '@patternfly/react-core/dist/dynamic/components/Label';
import { List } from '@patternfly/react-core/dist/dynamic/components/List';
import { ListItem } from '@patternfly/react-core/dist/dynamic/components/List';
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { ContentVariants } from '@patternfly/react-core/dist/dynamic/components/Content';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';

import CustomDataListItem from '../../../shared/components/data-display/CustomDataListItem';
import ExternalLinkAltIcon from '@patternfly/react-icons/dist/js/icons/external-link-alt-icon';
import IdBadgeIcon from '@patternfly/react-icons/dist/js/icons/id-badge-icon';
import InfrastructureIcon from '@patternfly/react-icons/dist/js/icons/infrastructure-icon';
import KeyIcon from '@patternfly/react-icons/dist/js/icons/key-icon';
import LinkIcon from '@patternfly/react-icons/dist/js/icons/link-icon';
import UsersIcon from '@patternfly/react-icons/dist/js/icons/users-icon';
import { Table } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Tbody } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Td } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Tr } from '@patternfly/react-table/dist/dynamic/components/Table';
import { useIntl } from 'react-intl';
import useAppNavigate from '../../../shared/hooks/useAppNavigate';
import { useAppLink } from '../../../shared/hooks/useAppLink';
import useExternalLink from '../../../shared/hooks/useExternalLink';
import { ExternalLink } from '../../../shared/components/navigation/ExternalLink';
import pathnames from '../../utilities/pathnames';

const VIEW_DEFAULT_GROUPS = 'https://console.redhat.com/iam/user-access/groups';
// to do - update link when available
const GRANT_ACCESS = '';
const workspacesIcon = '/apps/frontend-assets/technology-icons/iam.svg';

const V2Overview: React.FC = () => {
  const intl = useIntl();
  const navigate = useAppNavigate();
  const toAppLink = useAppLink();
  const externalLink = useExternalLink();

  return (
    <>
      <PageHeader
        data-codemods
        title={intl.formatMessage({ id: 'workspacesTitle', defaultMessage: 'Access Management', description: 'workspaces title' })}
        // to do - add url for viewing assets once available
        subtitle={intl.formatMessage({
          id: 'workspacesOverviewSubtitle',
          defaultMessage:
            'Securely manage user access and organize assets within your organization using workspaces. Implement granular access controls to streamline permission management and ensure efficient, secure access to resources. View assets and roles organization diagram.',
          description: 'Securely manage user access and organize assets within your organization using workspaces.',
        })}
        icon={<img src={workspacesIcon} alt="workspaces-header-icon" />}
        linkProps={{
          label: intl.formatMessage({ id: 'learnMore', defaultMessage: 'Learn more', description: 'learn more link' }),
          // to do - add learn more url once available
          // isExternal removed - PatternFly ContentHeader doesn't properly handle this prop
        }}
      />
      <PageSection hasBodyWrapper={false}>
        <Title headingLevel="h2" className="pf-v6-u-mb-md" data-ouia-component-id="header-title">
          {intl.formatMessage({ id: 'workspacesTitle', defaultMessage: 'Access Management', description: 'workspaces title' })}
        </Title>
        <Content component={ContentVariants.p} className="pf-v6-u-mb-lg">
          {intl.formatMessage({
            id: 'workspacesOverviewPageSubtitle',
            defaultMessage:
              "Workspaces let's you group related assets together (such as RHEL hosts). This simplifies management and user access control.",
            description: 'workspaces page section subtitle',
          })}{' '}
        </Content>

        <Gallery hasGutter minWidths={{ default: '330px' }}>
          <GalleryItem>
            <ServiceCard
              isFullHeight
              title={intl.formatMessage({
                id: 'workspacesServiceCardTitle',
                defaultMessage: 'Workspaces',
                description: 'Workspaces service card title',
              })}
              subtitle=""
              description={intl.formatMessage({
                id: 'workspacesServiceCardDescription',
                defaultMessage:
                  'Configure workspaces to fit your organizational structure. They can be structured in a heirarchy (parent-child relationships).     Permissions assigned to a parent workspace are automatically inherited by its child workspaces, saving you congfiguration time.',
                description: 'workspaces service card description',
              })}
              icon={<InfrastructureIcon className="pf-v6-u-primary-color-100 pf-v6-c-icon pf-m-lg" />}
              footer={
                <Button
                  variant={ButtonVariant.primary}
                  isInline
                  component="a"
                  href={toAppLink(pathnames['access-management-workspaces'].link()) as string}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(pathnames['access-management-workspaces'].link());
                  }}
                >
                  {intl.formatMessage({ id: 'workspacesButton', defaultMessage: 'Workspaces', description: 'Workspaces button label' })}
                </Button>
              }
              ouiaId="workspaces-service-card"
            />
          </GalleryItem>
          <GalleryItem>
            <ServiceCard
              isFullHeight
              title={intl.formatMessage({ id: 'groupsServiceCardTitle', defaultMessage: 'Groups', description: 'Groups service card title' })}
              subtitle=""
              description={intl.formatMessage({
                id: 'groupsServiceCardDescription',
                defaultMessage:
                  "Create user groups of both end-users and service accounts. Tailor these groups to mirror your organization's structure.",
                description: 'groups service card description',
              })}
              icon={<UsersIcon className="pf-v6-u-primary-color-100 pf-v6-c-icon pf-m-lg" />}
              footer={
                <Button
                  variant={ButtonVariant.secondary}
                  isInline
                  component="a"
                  href={`${toAppLink(pathnames['users-and-user-groups'].link())}?activeTab=user-groups`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate({ pathname: pathnames['users-and-user-groups'].link(), search: '?activeTab=user-groups' });
                  }}
                >
                  {intl.formatMessage({ id: 'viewGroupsButton', defaultMessage: 'View groups', description: 'View groups button label' })}
                </Button>
              }
              ouiaId="groups-service-card"
            />
          </GalleryItem>
          <GalleryItem>
            <ServiceCard
              isFullHeight
              title={intl.formatMessage({ id: 'roleServiceCardTitle', defaultMessage: 'Role', description: 'Role service card title' })}
              subtitle=""
              description={intl.formatMessage({
                id: 'roleServiceCardDescription',
                defaultMessage: 'Explore predefined roles to see if they fit your needs. If not, create custom roles with specific permissions.',
                description: 'role service card description',
              })}
              icon={<IdBadgeIcon className="pf-v6-u-primary-color-100 pf-v6-c-icon pf-m-lg" />}
              footer={
                <Button
                  variant={ButtonVariant.secondary}
                  isInline
                  component="a"
                  href={toAppLink(pathnames['access-management-roles'].link()) as string}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(pathnames['access-management-roles'].link());
                  }}
                >
                  {intl.formatMessage({ id: 'viewRolesButton', defaultMessage: 'View roles', description: 'View roles button label' })}
                </Button>
              }
              ouiaId="role-service-card"
            />
          </GalleryItem>
          <GalleryItem>
            <ServiceCard
              isFullHeight
              title={intl.formatMessage({ id: 'bindingsServiceCardTitle', defaultMessage: 'Bindings', description: 'Bindings service card title' })}
              subtitle=""
              description={intl.formatMessage({
                id: 'bindingsServiceCardDescription',
                defaultMessage:
                  "Grant access to your workspaces. This connects roles and user groups to specific workspaces. These bindings determine who can access what, and the actions they're allowed to perform.",
                description: 'bindings service card description',
              })}
              icon={<LinkIcon className="pf-v6-u-primary-color-100 pf-v6-c-icon pf-m-lg" />}
              footer={
                <Button variant={ButtonVariant.secondary} isInline onClick={() => externalLink.navigate('/iam/access-management/access-requests')}>
                  {intl.formatMessage({
                    id: 'viewAccessRequestsButton',
                    defaultMessage: 'View access requests',
                    description: 'View access requests button label',
                  })}
                </Button>
              }
              ouiaId="bindings-service-card"
            />
          </GalleryItem>
        </Gallery>

        <Title headingLevel="h2" className="pf-v6-u-mb-md pf-v6-u-mt-lg" data-ouia-component-id="understanding-access-title">
          {intl.formatMessage({
            id: 'understandingAccessTitle',
            defaultMessage: 'Understanding access',
            description: 'Understanding access section title',
          })}
        </Title>

        <DataList aria-label="understanding access" className="pf-v6-u-mb-md">
          <CustomDataListItem
            icon={<UsersIcon className="pf-v6-u-primary-color-100" />}
            isExpanded
            heading={intl.formatMessage({ id: 'defaultGroupsHeading', defaultMessage: 'Default groups', description: 'Default groups heading' })}
            linkTitle={intl.formatMessage({
              id: 'viewYourDefaultGroups',
              defaultMessage: 'View your default groups',
              description: 'View your default groups link text',
            })}
            linkTarget={VIEW_DEFAULT_GROUPS}
            expandableContent={
              <List>
                <ListItem>
                  {intl.formatMessage(
                    {
                      id: 'allUsersGroupDescription',
                      defaultMessage: 'The {bold} contains all authenticated users in your organization.',
                      description: 'All Users group description',
                    },
                    {
                      bold: (
                        <b>
                          {intl.formatMessage({
                            id: 'allUsersGroupBold',
                            defaultMessage: 'All Users group',
                            description: 'All Users group bold text',
                          })}
                        </b>
                      ),
                    },
                  )}
                </ListItem>
                <ListItem>
                  {intl.formatMessage(
                    {
                      id: 'adminUsersGroupDescription',
                      defaultMessage:
                        'The {bold} should contain any users within your organization who require key admin privileges (like workspace administrator, or user access administrator) so they can be applied to roles and workspaces.',
                      description: 'Admin Users group description',
                    },
                    {
                      bold: (
                        <b>
                          {intl.formatMessage({
                            id: 'adminUsersGroupBold',
                            defaultMessage: 'Admin Users group',
                            description: 'Admin Users group bold text',
                          })}
                        </b>
                      ),
                    },
                  )}
                </ListItem>
              </List>
            }
          />
          <CustomDataListItem
            icon={<KeyIcon className="pf-v6-u-primary-color-100" />}
            heading={intl.formatMessage({
              id: 'grantingAccessInWorkspacesHeading',
              defaultMessage: 'Granting access in workspaces',
              description: 'Granting access in workspaces heading',
            })}
            linkTitle={intl.formatMessage({ id: 'grantAccessLink', defaultMessage: 'Grant access', description: 'Grant access link text' })}
            linkTarget={GRANT_ACCESS}
            expandableContent={
              <List>
                <ListItem>
                  {intl.formatMessage(
                    {
                      id: 'userGroupsDescription',
                      defaultMessage:
                        "{bold}: group your organization's end users and service accounts based on common functions (e.g., Developers, Security, Ops, etc.) to help streamline permission management.",
                      description: 'User Groups description in granting access section',
                    },
                    {
                      bold: (
                        <b>{intl.formatMessage({ id: 'userGroupsBold', defaultMessage: 'User Groups', description: 'User Groups bold text' })}</b>
                      ),
                    },
                  )}{' '}
                </ListItem>
                <ListItem>
                  {intl.formatMessage(
                    {
                      id: 'rolesDescription',
                      defaultMessage:
                        '{bold}: predefined roles (e.g., Viewer, Editor, Admin) provide distinct levels of access tailored to the needs of each user group.',
                      description: 'Roles description in granting access section',
                    },
                    {
                      bold: <b>{intl.formatMessage({ id: 'rolesBold', defaultMessage: 'Roles', description: 'Roles bold text' })}</b>,
                    },
                  )}
                </ListItem>
                <ListItem>
                  {intl.formatMessage(
                    {
                      id: 'grantingAccessDescription',
                      defaultMessage:
                        '{bold}: assigning user groups and specific roles to a workspace grants all members of that group the corresponding permissions within the role for the services and assets within the workspace.',
                      description: 'Granting access description',
                    },
                    {
                      bold: (
                        <b>
                          {intl.formatMessage({
                            id: 'grantingAccessBold',
                            defaultMessage: 'Granting access',
                            description: 'Granting access bold text',
                          })}
                        </b>
                      ),
                    },
                  )}
                </ListItem>
              </List>
            }
          />
        </DataList>

        <Title headingLevel="h2" className="pf-v6-u-mb-md" data-ouia-component-id="recommended-content-title">
          {intl.formatMessage({
            id: 'recommendedContentTitle',
            defaultMessage: 'Recommended content',
            description: 'Recommended content section title',
          })}
        </Title>

        <Table aria-label="Recommended content" className="pf-v6-u-mb-lg">
          <Tbody>
            <Tr className="noti-c-table-border-top">
              <Td>
                {intl.formatMessage({
                  id: 'createWorkspaceQuickStart',
                  defaultMessage: 'Create a workspace and grant access',
                  description: 'Create a workspace and grant access quick start title',
                })}
              </Td>
              <Td>
                <Label color="green">
                  {intl.formatMessage({ id: 'quickStartLabel', defaultMessage: 'Quick start', description: 'Quick start label' })}
                </Label>
              </Td>
              <Td className="pf-v6-u-text-align-right">
                {/* to do - add link when available */}
                <span className="pf-v6-u-color-200" aria-disabled="true">
                  {intl.formatMessage({ id: 'beginQuickStart', defaultMessage: 'Begin Quick start', description: 'Begin Quick start link text' })}{' '}
                  <ExternalLinkAltIcon />
                </span>
              </Td>
            </Tr>
            <Tr>
              <Td>
                {intl.formatMessage({
                  id: 'structuringWorkspacesDoc',
                  defaultMessage: 'Structuring your workspaces to fit your organizational use cases',
                  description: 'Structuring your workspaces documentation title',
                })}
              </Td>
              <Td>
                <Label color="orange">
                  {intl.formatMessage({ id: 'documentationLabel', defaultMessage: 'Documentation', description: 'Documentation label' })}
                </Label>
              </Td>
              <Td className="pf-v6-u-text-align-right">
                {/* to do - add link when available */}
                <span className="pf-v6-u-color-200" aria-disabled="true">
                  {intl.formatMessage({ id: 'viewDocumentation', defaultMessage: 'View documentation', description: 'View documentation link text' })}{' '}
                  <ExternalLinkAltIcon />
                </span>
              </Td>
            </Tr>
            <Tr>
              <Td>
                {intl.formatMessage({
                  id: 'workspaceHierarchyDoc',
                  defaultMessage: 'Understanding Workspace hierarchy and inheritance',
                  description: 'Understanding Workspace hierarchy and inheritance documentation title',
                })}
              </Td>
              <Td>
                <Label color="orange">
                  {intl.formatMessage({ id: 'documentationLabel', defaultMessage: 'Documentation', description: 'Documentation label' })}
                </Label>
              </Td>
              <Td className="pf-v6-u-text-align-right">
                {/* to do - add link when available */}
                <span className="pf-v6-u-color-200" aria-disabled="true">
                  {intl.formatMessage({ id: 'viewDocumentation', defaultMessage: 'View documentation', description: 'View documentation link text' })}{' '}
                  <ExternalLinkAltIcon />
                </span>
              </Td>
            </Tr>
            <Tr>
              <Td>
                {intl.formatMessage({
                  id: 'accessManagementDoc',
                  defaultMessage: 'Understanding access management',
                  description: 'Understanding access management documentation title',
                })}
              </Td>
              <Td>
                <Label color="orange">
                  {intl.formatMessage({ id: 'documentationLabel', defaultMessage: 'Documentation', description: 'Documentation label' })}
                </Label>
              </Td>
              <Td className="pf-v6-u-text-align-right">
                {/* to do - add link when available */}
                <span className="pf-v6-u-color-200" aria-disabled="true">
                  {intl.formatMessage({ id: 'viewDocumentation', defaultMessage: 'View documentation', description: 'View documentation link text' })}{' '}
                  <ExternalLinkAltIcon />
                </span>
              </Td>
            </Tr>
          </Tbody>
        </Table>

        <ExternalLink to="/settings/learning-resources" className="pf-v6-u-mb-lg">
          {intl.formatMessage({
            id: 'viewAllIAMLearningResources',
            defaultMessage: 'View all Identity and Access Management Learning resources',
            description: 'View all IAM Learning resources link text',
          })}
        </ExternalLink>
      </PageSection>
    </>
  );
};

export { V2Overview };
export default V2Overview;
