import React from 'react';
import { PageHeader, ServiceCard } from '@patternfly/react-component-groups';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { ButtonVariant } from '@patternfly/react-core';
import { DataList } from '@patternfly/react-core/dist/dynamic/components/DataList';
import { Gallery } from '@patternfly/react-core';
import { GalleryItem } from '@patternfly/react-core';
import { Label } from '@patternfly/react-core/dist/dynamic/components/Label';
import { List } from '@patternfly/react-core/dist/dynamic/components/List';
import { ListItem } from '@patternfly/react-core/dist/dynamic/components/List';
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { ContentVariants } from '@patternfly/react-core/dist/dynamic/components/Content';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import {} from '@patternfly/react-core';
import messages from '../../../Messages';
import CustomDataListItem from '../../../components/data-display/CustomDataListItem';
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
import useAppNavigate from '../../../hooks/useAppNavigate';
import { useAppLink } from '../../../hooks/useAppLink';
import useExternalLink from '../../../hooks/useExternalLink';
import { ExternalLink } from '../../../components/navigation/ExternalLink';
import pathnames from '../../../utilities/pathnames';

const VIEW_DEFAULT_GROUPS = 'https://console.redhat.com/iam/user-access/groups';
// to do - update link when available
const GRANT_ACCESS = '';
const workspacesIcon = '/apps/frontend-assets/technology-icons/iam.svg';

export const WorkspacesOverview = () => {
  // const [isExpanded, setIsExpanded] = React.useState(false);
  const intl = useIntl();
  const navigate = useAppNavigate();
  const toAppLink = useAppLink();
  const externalLink = useExternalLink();

  return (
    <>
      <PageHeader
        data-codemods
        title={intl.formatMessage(messages.workspacesOverviewTitle)}
        // to do - add url for viewing assets once available
        subtitle={intl.formatMessage(messages.workspacesOverviewSubtitle)}
        icon={<img src={workspacesIcon} alt="workspaces-header-icon" />}
        linkProps={{
          label: intl.formatMessage(messages.learnMore),
          // to do - add learn more url once available
          // isExternal removed - PatternFly ContentHeader doesn't properly handle this prop
        }}
      />
      <PageSection hasBodyWrapper={false}>
        <Title headingLevel="h2" className="pf-v6-u-mb-md" data-ouia-component-id="header-title">
          {intl.formatMessage(messages.workspacesOverviewTitle)}
        </Title>
        <Content component={ContentVariants.p}>{intl.formatMessage(messages.workspacesPageSubtitle)} </Content>
        <br></br>

        <br />

        <Gallery hasGutter minWidths={{ default: '330px' }}>
          <GalleryItem>
            <ServiceCard
              isFullHeight
              title="Workspaces"
              subtitle=""
              description={intl.formatMessage(messages.workspacesServiceCardDescription)}
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
                  Workspaces
                </Button>
              }
              ouiaId="workspaces-service-card"
            />
          </GalleryItem>
          <GalleryItem>
            <ServiceCard
              isFullHeight
              title="Groups"
              subtitle=""
              description={intl.formatMessage(messages.groupsServiceCardDescription)}
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
                  View groups
                </Button>
              }
              ouiaId="groups-service-card"
            />
          </GalleryItem>
          <GalleryItem>
            <ServiceCard
              isFullHeight
              title="Role"
              subtitle=""
              description={intl.formatMessage(messages.roleServiceCardDescription)}
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
                  View roles
                </Button>
              }
              ouiaId="role-service-card"
            />
          </GalleryItem>
          <GalleryItem>
            <ServiceCard
              isFullHeight
              title="Bindings"
              subtitle=""
              description={intl.formatMessage(messages.bindingsServiceCardDescription)}
              icon={<LinkIcon className="pf-v6-u-primary-color-100 pf-v6-c-icon pf-m-lg" />}
              footer={
                <Button variant={ButtonVariant.secondary} isInline onClick={() => externalLink.navigate('/iam/access-management/access-requests')}>
                  View access requests
                </Button>
              }
              ouiaId="bindings-service-card"
            />
          </GalleryItem>
        </Gallery>

        <br></br>

        <Title headingLevel="h2" className="pf-v6-u-mb-md" data-ouia-component-id="understanding-access-title">
          Understanding access
        </Title>

        <DataList aria-label="understanding access" className="pf-v6-u-mb-md">
          <CustomDataListItem
            icon={<UsersIcon className="pf-v6-u-primary-color-100" />}
            isExpanded
            heading="Default groups"
            linkTitle="View your default groups"
            linkTarget={VIEW_DEFAULT_GROUPS}
            expandableContent={
              <List>
                <ListItem>
                  The <b>All Users group</b> contains all authenticated users in your organization.
                </ListItem>
                <ListItem>
                  The <b>Admin Users group</b> should contain any users within your organization who require key admin privileges (like workspace
                  administrator, or user access administrator) so they can be applied to roles and workspaces.
                </ListItem>
              </List>
            }
          />
          <CustomDataListItem
            icon={<KeyIcon className="pf-v6-u-primary-color-100" />}
            heading="Granting access in workspaces"
            linkTitle="Grant access"
            linkTarget={GRANT_ACCESS}
            expandableContent={
              <List>
                <ListItem>
                  <b>User Groups</b>: group your organization’s end users and service accounts based on common functions (e.g., Developers, Security,
                  Ops, etc.) to help streamline permission management.{' '}
                </ListItem>
                <ListItem>
                  <b>Roles</b>: predefined roles (e.g., Viewer, Editor, Admin) provide distinct levels of access tailored to the needs of each user
                  group.
                </ListItem>
                <ListItem>
                  <b>Granting access</b>: assigning user groups and specific roles to a workspace grants all members of that group the corresponding
                  permissions within the role for the services and assets within the workspace.
                </ListItem>
              </List>
            }
          />
        </DataList>

        <Title headingLevel="h2" className="pf-v6-u-mb-md" data-ouia-component-id="recommended-content-title">
          Recommended content
        </Title>

        <Table aria-label="Recommended content" className="pf-v6-u-mb-lg">
          <Tbody>
            <Tr className="noti-c-table-border-top">
              <Td>Create a workspace and grant access</Td>
              <Td>
                <Label color="green">Quick start</Label>
              </Td>
              <Td className="pf-v6-u-text-align-right">
                {/* to do - add link when available */}
                <ExternalLink to="#">
                  Begin Quick start <ExternalLinkAltIcon />
                </ExternalLink>
              </Td>
            </Tr>
            <Tr>
              <Td>Structuring your workspaces to fit your organizational use cases</Td>
              <Td>
                <Label color="orange">Documentation</Label>
              </Td>
              <Td className="pf-v6-u-text-align-right">
                {/* to do - add link when available */}
                <ExternalLink to="#">
                  View documentation <ExternalLinkAltIcon />
                </ExternalLink>
              </Td>
            </Tr>
            <Tr>
              <Td>Understanding Workspace hierarchy and inheritance</Td>
              <Td>
                <Label color="orange">Documentation</Label>
              </Td>
              <Td className="pf-v6-u-text-align-right">
                {/* to do - add link when available */}
                <ExternalLink to="#">
                  View documentation <ExternalLinkAltIcon />
                </ExternalLink>
              </Td>
            </Tr>
            <Tr>
              <Td>Understanding access management</Td>
              <Td>
                <Label color="orange">Documentation</Label>
              </Td>
              <Td className="pf-v6-u-text-align-right">
                {/* to do - add link when available */}
                <ExternalLink to="#">
                  View documentation <ExternalLinkAltIcon />
                </ExternalLink>
              </Td>
            </Tr>
          </Tbody>
        </Table>

        <ExternalLink to="/settings/learning-resources" className="pf-v6-u-mb-lg">
          View all Identity and Access Management Learning resources
        </ExternalLink>
      </PageSection>
    </>
  );
};

export default WorkspacesOverview;
