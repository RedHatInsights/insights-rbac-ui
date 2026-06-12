import React from 'react';
import { PageHeader, ServiceCard } from '@patternfly/react-component-groups';
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
import messages from '../../../Messages';
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
        <Content component={ContentVariants.p} className="pf-v6-u-mb-lg">
          {intl.formatMessage(messages.workspacesPageSubtitle)}{' '}
        </Content>

        <Gallery hasGutter minWidths={{ default: '330px' }}>
          <GalleryItem>
            <ServiceCard
              isFullHeight
              title={intl.formatMessage(messages.workspacesServiceCardTitle)}
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
                  {intl.formatMessage(messages.workspacesButton)}
                </Button>
              }
              ouiaId="workspaces-service-card"
            />
          </GalleryItem>
          <GalleryItem>
            <ServiceCard
              isFullHeight
              title={intl.formatMessage(messages.groupsServiceCardTitle)}
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
                  {intl.formatMessage(messages.viewGroupsButton)}
                </Button>
              }
              ouiaId="groups-service-card"
            />
          </GalleryItem>
          <GalleryItem>
            <ServiceCard
              isFullHeight
              title={intl.formatMessage(messages.roleServiceCardTitle)}
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
                  {intl.formatMessage(messages.viewRolesButton)}
                </Button>
              }
              ouiaId="role-service-card"
            />
          </GalleryItem>
          <GalleryItem>
            <ServiceCard
              isFullHeight
              title={intl.formatMessage(messages.bindingsServiceCardTitle)}
              subtitle=""
              description={intl.formatMessage(messages.bindingsServiceCardDescription)}
              icon={<LinkIcon className="pf-v6-u-primary-color-100 pf-v6-c-icon pf-m-lg" />}
              footer={
                <Button variant={ButtonVariant.secondary} isInline onClick={() => externalLink.navigate('/iam/access-management/access-requests')}>
                  {intl.formatMessage(messages.viewAccessRequestsButton)}
                </Button>
              }
              ouiaId="bindings-service-card"
            />
          </GalleryItem>
        </Gallery>

        <Title headingLevel="h2" className="pf-v6-u-mb-md pf-v6-u-mt-lg" data-ouia-component-id="understanding-access-title">
          {intl.formatMessage(messages.understandingAccessTitle)}
        </Title>

        <DataList aria-label="understanding access" className="pf-v6-u-mb-md">
          <CustomDataListItem
            icon={<UsersIcon className="pf-v6-u-primary-color-100" />}
            isExpanded
            heading={intl.formatMessage(messages.defaultGroupsHeading)}
            linkTitle={intl.formatMessage(messages.viewYourDefaultGroups)}
            linkTarget={VIEW_DEFAULT_GROUPS}
            expandableContent={
              <List>
                <ListItem>
                  {intl.formatMessage(messages.allUsersGroupDescription, {
                    bold: <b>{intl.formatMessage(messages.allUsersGroupBold)}</b>,
                  })}
                </ListItem>
                <ListItem>
                  {intl.formatMessage(messages.adminUsersGroupDescription, {
                    bold: <b>{intl.formatMessage(messages.adminUsersGroupBold)}</b>,
                  })}
                </ListItem>
              </List>
            }
          />
          <CustomDataListItem
            icon={<KeyIcon className="pf-v6-u-primary-color-100" />}
            heading={intl.formatMessage(messages.grantingAccessInWorkspacesHeading)}
            linkTitle={intl.formatMessage(messages.grantAccessLink)}
            linkTarget={GRANT_ACCESS}
            expandableContent={
              <List>
                <ListItem>
                  {intl.formatMessage(messages.userGroupsDescription, {
                    bold: <b>{intl.formatMessage(messages.userGroupsBold)}</b>,
                  })}{' '}
                </ListItem>
                <ListItem>
                  {intl.formatMessage(messages.rolesDescription, {
                    bold: <b>{intl.formatMessage(messages.rolesBold)}</b>,
                  })}
                </ListItem>
                <ListItem>
                  {intl.formatMessage(messages.grantingAccessDescription, {
                    bold: <b>{intl.formatMessage(messages.grantingAccessBold)}</b>,
                  })}
                </ListItem>
              </List>
            }
          />
        </DataList>

        <Title headingLevel="h2" className="pf-v6-u-mb-md" data-ouia-component-id="recommended-content-title">
          {intl.formatMessage(messages.recommendedContentTitle)}
        </Title>

        <Table aria-label="Recommended content" className="pf-v6-u-mb-lg">
          <Tbody>
            <Tr className="noti-c-table-border-top">
              <Td>{intl.formatMessage(messages.createWorkspaceQuickStart)}</Td>
              <Td>
                <Label color="green">{intl.formatMessage(messages.quickStartLabel)}</Label>
              </Td>
              <Td className="pf-v6-u-text-align-right">
                {/* to do - add link when available */}
                <span className="pf-v6-u-color-200" aria-disabled="true">
                  {intl.formatMessage(messages.beginQuickStart)} <ExternalLinkAltIcon />
                </span>
              </Td>
            </Tr>
            <Tr>
              <Td>{intl.formatMessage(messages.structuringWorkspacesDoc)}</Td>
              <Td>
                <Label color="orange">{intl.formatMessage(messages.documentationLabel)}</Label>
              </Td>
              <Td className="pf-v6-u-text-align-right">
                {/* to do - add link when available */}
                <span className="pf-v6-u-color-200" aria-disabled="true">
                  {intl.formatMessage(messages.viewDocumentation)} <ExternalLinkAltIcon />
                </span>
              </Td>
            </Tr>
            <Tr>
              <Td>{intl.formatMessage(messages.workspaceHierarchyDoc)}</Td>
              <Td>
                <Label color="orange">{intl.formatMessage(messages.documentationLabel)}</Label>
              </Td>
              <Td className="pf-v6-u-text-align-right">
                {/* to do - add link when available */}
                <span className="pf-v6-u-color-200" aria-disabled="true">
                  {intl.formatMessage(messages.viewDocumentation)} <ExternalLinkAltIcon />
                </span>
              </Td>
            </Tr>
            <Tr>
              <Td>{intl.formatMessage(messages.accessManagementDoc)}</Td>
              <Td>
                <Label color="orange">{intl.formatMessage(messages.documentationLabel)}</Label>
              </Td>
              <Td className="pf-v6-u-text-align-right">
                {/* to do - add link when available */}
                <span className="pf-v6-u-color-200" aria-disabled="true">
                  {intl.formatMessage(messages.viewDocumentation)} <ExternalLinkAltIcon />
                </span>
              </Td>
            </Tr>
          </Tbody>
        </Table>

        <ExternalLink to="/settings/learning-resources" className="pf-v6-u-mb-lg">
          {intl.formatMessage(messages.viewAllIAMLearningResources)}
        </ExternalLink>
      </PageSection>
    </>
  );
};

export { V2Overview };
export default V2Overview;
