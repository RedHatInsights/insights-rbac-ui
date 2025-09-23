import React from 'react';
import { ActionList } from '@patternfly/react-core';
import { ActionListItem } from '@patternfly/react-core';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Card } from '@patternfly/react-core/dist/dynamic/components/Card';
import { CardBody } from '@patternfly/react-core/dist/dynamic/components/Card';
import { CardFooter } from '@patternfly/react-core/dist/dynamic/components/Card';
import { CardTitle } from '@patternfly/react-core/dist/dynamic/components/Card';
import { Grid } from '@patternfly/react-core';
import { GridItem } from '@patternfly/react-core';
import { List } from '@patternfly/react-core/dist/dynamic/components/List';
import { ListItem } from '@patternfly/react-core/dist/dynamic/components/List';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import {} from '@patternfly/react-core';
import { useIntl } from 'react-intl';
import { AppLink } from '../../../components/navigation/AppLink';
import pathnames from '../../../utilities/pathnames';
import messages from '../../../Messages';

interface GetStartedCardProps {
  className?: string;
}

export const GetStartedCard: React.FC<GetStartedCardProps> = ({ className }) => {
  const intl = useIntl();

  return (
    <Card aria-label="Get started card" className={className} data-ouia-component-id="get-started-card">
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
  );
};
