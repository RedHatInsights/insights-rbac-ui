import React from 'react';
import { ActionList, ActionListItem } from '@patternfly/react-core/dist/dynamic/components/ActionList';
import { Grid, GridItem } from '@patternfly/react-core/dist/dynamic/layouts/Grid';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Card } from '@patternfly/react-core/dist/dynamic/components/Card';
import { CardBody } from '@patternfly/react-core/dist/dynamic/components/Card';
import { CardFooter } from '@patternfly/react-core/dist/dynamic/components/Card';
import { CardTitle } from '@patternfly/react-core/dist/dynamic/components/Card';
import { List } from '@patternfly/react-core/dist/dynamic/components/List';
import { ListItem } from '@patternfly/react-core/dist/dynamic/components/List';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { useIntl } from 'react-intl';
import { AppLink } from '../../../../shared/components/navigation/AppLink';

interface GetStartedCardProps {
  className?: string;
  groupsLink: string;
  rolesLink: string;
}

export const GetStartedCard: React.FC<GetStartedCardProps> = ({ className, groupsLink, rolesLink }) => {
  const intl = useIntl();

  return (
    <Card aria-label="Get started card" className={className} data-ouia-component-id="get-started-card">
      <Grid hasGutter>
        <GridItem sm={12} md={6} lg={8}>
          <CardTitle>
            <Title headingLevel="h2" data-ouia-component-id="get-started-title">
              {intl.formatMessage({
                id: 'overviewHeroTitle',
                defaultMessage: 'Get started with User Access',
                description: 'Overview Hero section title',
              })}
            </Title>
          </CardTitle>
          <CardBody>
            <p className="pf-v6-u-mb-sm">
              {intl.formatMessage({
                id: 'overviewHeroSubtitle',
                defaultMessage: 'The Red Hat Hybrid Cloud Console uses role-based access control (RBAC).',
                description: 'Overview Hero section subtitle',
              })}
            </p>
            <List>
              <ListItem>
                {intl.formatMessage({
                  id: 'overviewHeroListItem1',
                  defaultMessage: 'Control user access by organizing roles instead of assigning permissions individually to users',
                  description: 'Overview Hero first list item',
                })}
              </ListItem>
              <ListItem>
                {intl.formatMessage({
                  id: 'overviewHeroListItem2',
                  defaultMessage: 'Create groups that include roles and their corresponding permissions',
                  description: 'Overview Hero second list item',
                })}
              </ListItem>
              <ListItem>
                {intl.formatMessage({
                  id: 'overviewHeroListItem3',
                  defaultMessage: "Assign users to these groups, allowing them to inherit the permissions associated with their group's roles",
                  description: 'Overview Hero third list item',
                })}
              </ListItem>
            </List>
          </CardBody>
          <CardFooter>
            <ActionList>
              <ActionListItem>
                <AppLink to={groupsLink}>
                  <Button variant="primary" size="lg" aria-label="View groups" ouiaId="getstarted-view-groups-button">
                    {intl.formatMessage({ id: 'viewGroupsBtn', defaultMessage: 'View groups', description: 'View groups button' })}
                  </Button>
                </AppLink>
              </ActionListItem>
              <ActionListItem>
                <AppLink to={rolesLink}>
                  <Button variant="secondary" aria-label="View roles" size="lg" ouiaId="getstarted-view-roles-button">
                    {intl.formatMessage({ id: 'viewRolesBtn', defaultMessage: 'View roles', description: 'View roles button' })}
                  </Button>
                </AppLink>
              </ActionListItem>
            </ActionList>
          </CardFooter>
        </GridItem>
        <GridItem md={6} lg={4} className="pf-v6-u-display-none pf-v6-u-display-block-on-md pf-c-card__cover-image"></GridItem>
      </Grid>
    </Card>
  );
};
