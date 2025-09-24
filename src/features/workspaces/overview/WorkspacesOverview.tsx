import React from 'react';
import { ContentHeader, ServiceCard } from '@patternfly/react-component-groups';
import {
  Button,
  ButtonVariant,
  DataList,
  Gallery,
  GalleryItem,
  Label,
  List,
  ListItem,
  PageSection,
  Text,
  TextVariants,
  Title,
} from '@patternfly/react-core';
import messages from '../../../Messages';
import CustomDataListItem from '../../../components/data-display/CustomDataListItem';
import { ExternalLinkAltIcon, IdBadgeIcon, InfrastructureIcon, KeyIcon, LinkIcon, UsersIcon } from '@patternfly/react-icons';
import { Table, Tbody, Td, Tr } from '@patternfly/react-table';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';

const VIEW_DEFAULT_GROUPS = 'https://console.redhat.com/iam/user-access/groups';
// to do - update link when available
const GRANT_ACCESS = '';
const workspacesIcon = '/apps/frontend-assets/technology-icons/iam.svg';

export const WorkspacesOverview = () => {
  // const [isExpanded, setIsExpanded] = React.useState(false);
  const intl = useIntl();
  const navigate = useNavigate();

  return (
    <>
      <ContentHeader
        title={intl.formatMessage(messages.workspacesOverviewTitle)}
        // to do - add url for viewing assets once available
        subtitle={intl.formatMessage(messages.workspacesOverviewSubtitle)}
        icon={<img src={workspacesIcon} alt="workspaces-header-icon" />}
        linkProps={{
          label: intl.formatMessage(messages.learnMore),
          isExternal: true,
          // to do - add learn more url once available
        }}
      />
      <PageSection>
        <Title headingLevel="h2" className="pf-v5-u-mb-md" data-ouia-component-id="header-title">
          {intl.formatMessage(messages.workspacesOverviewTitle)}
        </Title>
        <Text component={TextVariants.p}>{intl.formatMessage(messages.workspacesPageSubtitle)} </Text>
        <br></br>

        <br />

        <Gallery hasGutter minWidths={{ default: '330px' }}>
          <GalleryItem>
            <ServiceCard
              isFullHeight
              title="Workspaces"
              subtitle=""
              description={intl.formatMessage(messages.workspacesServiceCardDescription)}
              icon={<InfrastructureIcon className="pf-v5-u-primary-color-100 pf-v5-c-icon pf-m-lg" />}
              footer={
                <Button
                  variant={ButtonVariant.primary}
                  isInline
                  component="a"
                  href="/iam/access-management/workspaces"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/iam/access-management/workspaces');
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
              icon={<UsersIcon className="pf-v5-u-primary-color-100 pf-v5-c-icon pf-m-lg" />}
              footer={
                <Button
                  variant={ButtonVariant.secondary}
                  isInline
                  component="a"
                  href="/iam/access-management/users-and-user-groups?&activeTab=user-groups"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/iam/access-management/users-and-user-groups?&activeTab=user-groups');
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
              icon={<IdBadgeIcon className="pf-v5-u-primary-color-100 pf-v5-c-icon pf-m-lg" />}
              footer={
                <Button
                  variant={ButtonVariant.secondary}
                  isInline
                  component="a"
                  href="/iam/access-management/roles"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/iam/access-management/roles');
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
              icon={<LinkIcon className="pf-v5-u-primary-color-100 pf-v5-c-icon pf-m-lg" />}
              footer={
                <Button
                  variant={ButtonVariant.secondary}
                  isInline
                  component="a"
                  href="/iam/access-management/access-requests"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/iam/access-management/access-requests');
                  }}
                >
                  View access requests
                </Button>
              }
              ouiaId="bindings-service-card"
            />
          </GalleryItem>
        </Gallery>

        <br></br>

        <Title headingLevel="h2" className="pf-v5-u-mb-md" data-ouia-component-id="understanding-access-title">
          Understanding access
        </Title>

        <DataList aria-label="understanding access" className="pf-v5-u-mb-md">
          <CustomDataListItem
            icon={<UsersIcon className="pf-v5-u-primary-color-100" />}
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
            icon={<KeyIcon className="pf-v5-u-primary-color-100" />}
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

        <Title headingLevel="h2" className="pf-v5-u-mb-md" data-ouia-component-id="recommended-content-title">
          Recommended content
        </Title>

        <Table aria-label="Recommended content" className="pf-v5-u-mb-lg">
          <Tbody>
            <Tr className="noti-c-table-border-top">
              <Td>Create a workspace and grant access</Td>
              <Td>
                <Label color="green">Quick start</Label>
              </Td>
              <Td className="pf-v5-u-text-align-right">
                {/* to do - add link when available */}
                <a href="">
                  Begin Quick start <ExternalLinkAltIcon />
                </a>
              </Td>
            </Tr>
            <Tr>
              <Td>Structuring your workspaces to fit your organizational use cases</Td>
              <Td>
                <Label color="orange">Documentation</Label>
              </Td>
              <Td className="pf-v5-u-text-align-right">
                {/* to do - add link when available */}
                <a href="">
                  View documentation <ExternalLinkAltIcon />
                </a>
              </Td>
            </Tr>
            <Tr>
              <Td>Understanding Workspace hierarchy and inheritance</Td>
              <Td>
                <Label color="orange">Documentation</Label>
              </Td>
              <Td className="pf-v5-u-text-align-right">
                {/* to do - add link when available */}
                <a href="">
                  View documentation <ExternalLinkAltIcon />
                </a>
              </Td>
            </Tr>
            <Tr>
              <Td>Understanding access management</Td>
              <Td>
                <Label color="orange">Documentation</Label>
              </Td>
              <Td className="pf-v5-u-text-align-right">
                {/* to do - add link when available */}
                <a href="">
                  View documentation <ExternalLinkAltIcon />
                </a>
              </Td>
            </Tr>
          </Tbody>
        </Table>

        <a href={`/settings/learning-resources`} className="pf-v5-u-mb-lg">
          View all Identity and Access Management Learning resources
        </a>
      </PageSection>
    </>
  );
};

export default WorkspacesOverview;
