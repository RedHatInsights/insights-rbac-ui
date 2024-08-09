import React from 'react';
import { ContentHeader } from '@patternfly/react-component-groups';
import {
  Button,
  ButtonVariant,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  DataList,
  ExpandableSection,
  Gallery,
  GalleryItem,
  Label,
  List,
  ListItem,
  PageSection,
  Split,
  SplitItem,
  Text,
  TextContent,
  TextVariants,
  Title,
} from '@patternfly/react-core';
import CustomDataListItem, { IconName } from './custom-data-list-item';
import { ExternalLinkAltIcon, InfrastructureIcon, UsersIcon } from '@patternfly/react-icons';
import { Table, Tbody, Tr, Td } from '@patternfly/react-table';

const VIEW_DEFAULT_GROUPS = 'https://console.redhat.com/iam/user-access/groups';
// to do - update link when available
const GRANT_ACCESS = '';

const WorkspacesOverview = () => {
  const workspacesIcon = '/apps/frontend-assets/rbac-landing/rbac-landing-icon.svg';
  const bindingsIcon = '/apps/frontend-assets/rbac-landing/workspaces-bindings-icon.svg';
  const rolesIcon = '/apps/frontend-assets/rbac-landing/workspaces-roles-icon.svg';

  const [isExpanded, setIsExpanded] = React.useState(false);
  const onToggle = (_event: React.MouseEvent, isExpanded: boolean) => {
    setIsExpanded(isExpanded);
  };

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
      <PageSection>
        <Title headingLevel="h2" className="pf-u-mb-md" data-ouia-component-id="header-title">
          Get started with workspaces
        </Title>
        <Text component={TextVariants.p}>
          Workspaces let&apos;s you group related assets together (such as RHEL hosts). This simplifies management and user access control.
        </Text>
        <br></br>
        <ExpandableSection
          toggleText="Show me how my assets and permissions will be organized into workspaces"
          onToggle={onToggle}
          isExpanded={isExpanded}
        >
          {/* to do - add migration visualization when ready */}
          <Card ouiaId="animation-card">
            <CardTitle>A cool animation</CardTitle>
            <CardBody>will go here</CardBody>
            <CardFooter>when its ready</CardFooter>
          </Card>
        </ExpandableSection>

        <br></br>

        <Gallery hasGutter minWidths={{ default: '330px' }}>
          <GalleryItem>
            <Card isFullHeight>
              <CardHeader>
                <Split hasGutter>
                  <SplitItem>
                    <InfrastructureIcon className="pf-u-primary-color-100 pf-v5-c-icon pf-m-lg" />
                  </SplitItem>
                  <SplitItem>
                    <TextContent>
                      <Text component={TextVariants.h2} className="pf-v5-u-text-align-center">
                        Workspaces
                      </Text>
                    </TextContent>
                  </SplitItem>
                </Split>
              </CardHeader>
              <CardBody>
                Configure workspaces to fit your organizational structure. They can be structured in a heirarchy (parent-child relationships).
                Permissions assigned to a parent workspace are automatically inherited by its child workspaces, saving you congfiguration time.
              </CardBody>
              <CardFooter>
                <Button variant={ButtonVariant.primary} isInline component="a" href="">
                  Workspaces
                </Button>
              </CardFooter>
            </Card>
          </GalleryItem>
          <GalleryItem>
            <Card isFullHeight>
              <CardHeader>
                <Split hasGutter>
                  <SplitItem>
                    <UsersIcon className="pf-u-primary-color-100 pf-v5-c-icon pf-m-lg" />
                  </SplitItem>
                  <SplitItem>
                    <TextContent>
                      <Text component={TextVariants.h2}>Groups</Text>
                    </TextContent>
                  </SplitItem>
                </Split>
              </CardHeader>
              <CardBody>
                Create user groups of both end-users and service accounts. Tailor these groups to mirror your organization&apos;s structure.
              </CardBody>
              <CardFooter>
                <Button variant={ButtonVariant.secondary} isInline component="a" href="/iam/user-access/groups">
                  View groups
                </Button>
              </CardFooter>
            </Card>
          </GalleryItem>
          <GalleryItem>
            <Card isFullHeight>
              <CardHeader>
                <Split hasGutter>
                  <SplitItem>
                    <img src={rolesIcon} alt="roles-icon" className="pf-u-primary-color-100 pf-v5-c-icon pf-m-lg" />
                  </SplitItem>
                  <SplitItem>
                    <TextContent>
                      <Text component={TextVariants.h2}>Role</Text>
                    </TextContent>
                  </SplitItem>
                </Split>
              </CardHeader>
              <CardBody>Explore predefined roles to see if they fit your needs. If not, create custom roles with specific permissions.</CardBody>
              <CardFooter>
                <Button variant={ButtonVariant.secondary} isInline component="a" href="">
                  View roles
                </Button>
              </CardFooter>
            </Card>
          </GalleryItem>
          <GalleryItem>
            <Card isFullHeight>
              <CardHeader>
                <Split hasGutter>
                  <SplitItem>
                    <img src={bindingsIcon} alt="bindings-icon" className="pf-u-primary-color-100 pf-v5-c-icon pf-m-lg" />
                  </SplitItem>
                  <SplitItem>
                    <TextContent>
                      <Text component={TextVariants.h2} className="pf-v5-u-mb-sm">
                        Bindings
                      </Text>
                    </TextContent>
                  </SplitItem>
                </Split>
              </CardHeader>
              <CardBody>
                Grant access to your workspaces. This connects roles and user groups to specific workspaces. These bindings determine who can access
                what, and the actions they&apos;re allowed to perform.
              </CardBody>
              <CardFooter>
                <Button variant={ButtonVariant.secondary} isInline component="a" href="">
                  View access requests
                </Button>
              </CardFooter>
            </Card>
          </GalleryItem>
        </Gallery>

        <br></br>

        <Title headingLevel="h2" className="pf-u-mb-md" data-ouia-component-id="understanding-access-title">
          Understanding access
        </Title>

        <DataList aria-label="understanding access" className="pf-u-mb-md">
          <CustomDataListItem
            icon={IconName.USERS}
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
            icon={IconName.KEY}
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

        <Title headingLevel="h2" className="pf-u-mb-md" data-ouia-component-id="recommended-content-title">
          Recommended content
        </Title>

        <Table aria-label="Recommended content" className="pf-u-mb-lg">
          <Tbody>
            <Tr className="noti-c-table-border-top">
              <Td>Create a workspace and grant access</Td>
              <Td>
                <Label color="green">Quick start</Label>
              </Td>
              <Td className="pf-v5-u-text-align-right">
                {/* to do - add link when available */}
                <a href={}>
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
                <a href={}>
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
                <a href={}>
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
                <a href={}>
                  View documentation <ExternalLinkAltIcon />
                </a>
              </Td>
            </Tr>
          </Tbody>
        </Table>

        <a href={`/settings/learning-resources`} className="pf-u-mb-lg">
          View all Identity and Access Management Learning resources
        </a>
      </PageSection>
    </>
  );
};

export default WorkspacesOverview;
