import React, { useState } from 'react';
import {
  ActionList,
  ActionListItem,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardTitle,
  DataList,
  DataListCell,
  DataListContent,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
  DataListToggle,
  Divider,
  Flex,
  FlexItem,
  Grid,
  GridItem,
  Icon,
  Label,
  List,
  ListItem,
  PageSection,
  Title,
} from '@patternfly/react-core';
import ContentHeader from '@patternfly/react-component-groups/dist/dynamic/ContentHeader';
import { useIntl } from 'react-intl';
import messages from '../../Messages';
import { ArrowRightIcon, CubesIcon, ExternalLinkAltIcon } from '@patternfly/react-icons';
import './overview.scss';
import { Table, Tbody, Td, Tr } from '@patternfly/react-table';
import AppLink from '../../presentational-components/shared/AppLink';
import pathnames from '../../utilities/pathnames';
import EnableWorkspacesAlert from './enable-workspaces-alert';
import { useFlag } from '@unleash/proxy-client-react';

const Overview = () => {
  const intl = useIntl();
  const [expanded, setExpanded] = useState(true);
  const isWorkspacesFlag = useFlag('platform.rbac.workspaces');
  const isWorkspacesEligible = useFlag('platform.rbac.workspaces-eligible');

  return (
    <React.Fragment>
      {isWorkspacesEligible && !isWorkspacesFlag && <EnableWorkspacesAlert />}
      <ContentHeader
        title={intl.formatMessage(messages.overview)}
        subtitle={intl.formatMessage(messages.overviewSubtitle)}
        icon={<img src="/apps/frontend-assets/rbac-landing/rbac-landing-icon.svg" className="rbac-overview-icon" alt="RBAC landing page icon" />}
        linkProps={{
          label: intl.formatMessage(messages.learnMore),
          isExternal: true,
          to: 'https://access.redhat.com/documentation/en-us/red_hat_hybrid_cloud_console/2023/html/user_access_configuration_guide_for_role-based_access_control_rbac/index',
        }}
      />
      <PageSection>
        <Card aria-label="Get started card" className="pf-v5-u-mb-lg" data-ouia-component-id="get-started-card">
          <Grid hasGutter>
            <GridItem sm={12} md={6} lg={8}>
              <CardTitle>
                <Title headingLevel="h2" data-ouia-component-id="get-started-title">
                  {intl.formatMessage(messages.overviewHeroTitle)}
                </Title>
              </CardTitle>
              <CardBody>
                <p className="pf-v5-u-mb-sm">{intl.formatMessage(messages.overviewHeroSubtitle)}</p>
                <List>
                  <ListItem>{intl.formatMessage(messages.overviewHeroListItem1)}</ListItem>
                  <ListItem>{intl.formatMessage(messages.overviewHeroListItem2)}</ListItem>
                  <ListItem>{intl.formatMessage(messages.overviewHeroListItem3)}</ListItem>
                </List>
              </CardBody>
              <CardFooter>
                <ActionList>
                  <ActionListItem>
                    <AppLink to={pathnames.groups.link}>
                      <Button variant="primary" size="lg" aria-label="View groups" ouiaId="getstarted-view-groups-button">
                        {intl.formatMessage(messages.viewGroupsBtn)}
                      </Button>
                    </AppLink>
                  </ActionListItem>
                  <ActionListItem>
                    <AppLink to={pathnames.roles.link}>
                      <Button variant="secondary" aria-label="View roles" size="lg" ouiaId="getstarted-view-roles-button">
                        {intl.formatMessage(messages.viewRolesBtn)}
                      </Button>
                    </AppLink>
                  </ActionListItem>
                </ActionList>
              </CardFooter>
            </GridItem>
            <GridItem md={6} lg={4} className="pf-v5-u-display-none pf-v5-u-display-block-on-md pf-c-card__cover-image"></GridItem>
          </Grid>
        </Card>
        <DataList aria-label="Supporting features list" className="pf-v5-u-mb-lg">
          <DataListItem aria-labelledby="item1" isExpanded={expanded} className={expanded && 'active-item'}>
            <DataListItemRow className="pf-v5-u-align-items-center">
              <DataListToggle
                isExpanded={expanded}
                aria-controls="about-default-groups"
                data-ouia-component-id="about-toggle"
                onClick={() => setExpanded(!expanded)}
              />
              <DataListItemCells
                dataListCells={[
                  <DataListCell key="about-default-groups-key" data-ouia-component-id="about-card">
                    <div>
                      <Flex className="pf-v5-u-flex-nowrap">
                        <FlexItem className="pf-v5-u-align-self-center">
                          <Icon size="lg">
                            <CubesIcon className="pf-v5-u-primary-color-100" />
                          </Icon>
                        </FlexItem>
                        <Divider
                          orientation={{
                            default: 'vertical',
                          }}
                        />
                        <FlexItem className="pf-v5-u-align-self-center">
                          <Title headingLevel="h4" data-ouia-component-id="about-title">
                            {intl.formatMessage(messages.overviewSupportingFeaturesTitle)}
                          </Title>
                        </FlexItem>
                      </Flex>
                    </div>
                  </DataListCell>,
                ]}
              />
            </DataListItemRow>
            <DataListContent
              hasNoPadding
              className="pf-v5-u-px-lg pf-v5-u-pb-xl"
              aria-label="About default groups - detailed explanation"
              id="about-default-groups"
              data-ouia-component-id="about-view-default-group"
              isHidden={!expanded}
            >
              <p className="pf-v5-u-mb-md">{intl.formatMessage(messages.overviewSupportingFeaturesSubtitle1)}</p>
              <p className="pf-v5-u-mb-md">{intl.formatMessage(messages.overviewSupportingFeaturesSubtitle2)}</p>
              <AppLink to={pathnames.groups.link}>
                <Button variant="link" isInline>
                  {intl.formatMessage(messages.viewDefaultGroupsLink)}
                </Button>
              </AppLink>
            </DataListContent>
          </DataListItem>
        </DataList>

        <Title headingLevel="h2" className="pf-v5-u-mb-md" data-ouia-component-id="recommended-title">
          {intl.formatMessage(messages.recommendedContentTitle)}
        </Title>
        <Table aria-label="Recommended content table" className="pf-v5-u-mb-lg" data-ouia-component-id="recommended-table">
          <Tbody>
            <Tr key="row1">
              <Td dataLabel="Recommended content label">{intl.formatMessage(messages.recommendedContentItem1)}</Td>
              <Td dataLabel="Recommended content category">
                <Label color="green">{intl.formatMessage(messages.labelQuickStart)}</Label>
              </Td>
              <Td dataLabel="Recommended content link" className="pf-v5-u-text-align-right">
                <a
                  href="https://console.redhat.com/iam/user-access/overview?quickstart=rbac-admin-vuln-permissions"
                  title="Link to Quick start - Restricting access to a service to a team"
                >
                  {intl.formatMessage(messages.beginQuickStartLink)} <ArrowRightIcon />
                </a>
              </Td>
            </Tr>
            <Tr key="row2">
              <Td dataLabel="Recommended content label">{intl.formatMessage(messages.recommendedContentItem2)}</Td>
              <Td dataLabel="Recommended content category">
                <Label color="green">{intl.formatMessage(messages.labelQuickStart)}</Label>
              </Td>
              <Td dataLabel="Recommended content link" className="pf-v5-u-text-align-right">
                <a
                  href="http://console.redhat.com/iam/user-access/overview?quickstart=rbac-granular-malware-rhel-access"
                  title="Link to Quick start - Configuring granular permissions by service"
                >
                  {intl.formatMessage(messages.beginQuickStartLink)} <ArrowRightIcon />
                </a>
              </Td>
            </Tr>
            <Tr key="row3">
              <Td dataLabel="Recommended content label">{intl.formatMessage(messages.recommendedContentItem3)}</Td>
              <Td dataLabel="Recommended content category">
                <Label color="green">{intl.formatMessage(messages.labelQuickStart)}</Label>
              </Td>
              <Td dataLabel="Recommended content link" className="pf-v5-u-text-align-right">
                <a
                  href="http://console.redhat.com/iam/user-access/overview?quickstart=rbac-read-only-vuln-permissions"
                  title="Link to Quick start - Configuring read-only permissions for a team"
                >
                  {intl.formatMessage(messages.beginQuickStartLink)} <ArrowRightIcon />
                </a>
              </Td>
            </Tr>
            <Tr key="row4">
              <Td dataLabel="Recommended content label">{intl.formatMessage(messages.recommendedContentItem4)}</Td>
              <Td dataLabel="Recommended content category">
                <Label color="green">{intl.formatMessage(messages.labelQuickStart)}</Label>
              </Td>
              <Td dataLabel="Recommended content link" className="pf-v5-u-text-align-right">
                <a
                  href="http://console.redhat.com/iam/user-access/overview?quickstart=rbac-reducing-permissions"
                  title="Link to Quick start - Reducing permissions across my organization"
                >
                  {intl.formatMessage(messages.beginQuickStartLink)} <ArrowRightIcon />
                </a>
              </Td>
            </Tr>
            <Tr key="row5">
              <Td dataLabel="Recommended content label">{intl.formatMessage(messages.recommendedContentItem5)}</Td>
              <Td dataLabel="Recommended content category">
                <Label color="orange">{intl.formatMessage(messages.labelDocumentation)}</Label>
              </Td>
              <Td dataLabel="Recommended content link" className="pf-v5-u-text-align-right">
                <a
                  href="https://access.redhat.com/documentation/en-us/red_hat_hybrid_cloud_console/2023/html/user_access_configuration_guide_for_role-based_access_control_rbac/index"
                  title="Link to User Access Configuration Guide for RBAC"
                  target="_blank"
                  rel="noreferrer"
                >
                  {intl.formatMessage(messages.viewDocumentationLink)} <ExternalLinkAltIcon />
                </a>
              </Td>
            </Tr>
            <Tr key="row6">
              <Td dataLabel="Recommended content label">{intl.formatMessage(messages.recommendedContentItem6)}</Td>
              <Td dataLabel="Recommended content category">
                <Label color="purple">{intl.formatMessage(messages.labelOtherResource)}</Label>
              </Td>
              <Td dataLabel="Recommended content link" className="pf-v5-u-text-align-right">
                <a href="https://developers.redhat.com/api-catalog/api/rbac" title="Link to RBAC API" target="_blank" rel="noreferrer">
                  {intl.formatMessage(messages.viewApiSiteLink)} <ExternalLinkAltIcon />
                </a>
              </Td>
            </Tr>
            <Tr key="row7">
              <Td dataLabel="Recommended content label">{intl.formatMessage(messages.recommendedContentItem7)}</Td>
              <Td dataLabel="Recommended content category">
                <Label color="purple">{intl.formatMessage(messages.labelOtherResource)}</Label>
              </Td>
              <Td dataLabel="Recommended content link" className="pf-v5-u-text-align-right">
                <a
                  href="https://www.redhat.com/en/blog/role-based-access-control-red-hat-hybrid-cloud-console"
                  title="Link to Red Hat blog post on Console RBAC"
                  target="_blank"
                  rel="noreferrer"
                >
                  {intl.formatMessage(messages.readBlogPostLink)} <ExternalLinkAltIcon />
                </a>
              </Td>
            </Tr>
          </Tbody>
        </Table>

        <a
          href="https://console.redhat.com/settings/learning-resources?quickstart=rbac-admin-vuln-permissions"
          className="pf-v5-u-mb-lg"
          data-ouia-component-id="overview-view-all-resources-button"
        >
          {intl.formatMessage(messages.iamLearningResourcesLink)}
        </a>
      </PageSection>
    </React.Fragment>
  );
};

export default Overview;
