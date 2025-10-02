import { Brand } from '@patternfly/react-core/dist/dynamic/components/Brand';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Card } from '@patternfly/react-core/dist/dynamic/components/Card';
import { CardBody } from '@patternfly/react-core/dist/dynamic/components/Card';
import { CardFooter } from '@patternfly/react-core/dist/dynamic/components/Card';
import { CardHeader } from '@patternfly/react-core/dist/dynamic/components/Card';
import { CardTitle } from '@patternfly/react-core/dist/dynamic/components/Card';
import { Gallery } from '@patternfly/react-core';
import { Panel } from '@patternfly/react-core/dist/dynamic/components/Panel';
import { PanelHeader } from '@patternfly/react-core/dist/dynamic/components/Panel';
import { PanelMain } from '@patternfly/react-core/dist/dynamic/components/Panel';
import { PanelMainBody } from '@patternfly/react-core/dist/dynamic/components/Panel';
import {} from '@patternfly/react-core';
import ArrowRightIcon from '@patternfly/react-icons/dist/js/icons/arrow-right-icon';
import Messages from '../../../../Messages';
import React from 'react';
import { useIntl } from 'react-intl';

interface AssetsCardsProps {
  workspaceName: string;
}

const AssetsCards: React.FunctionComponent<AssetsCardsProps> = ({ workspaceName }: AssetsCardsProps) => {
  const InsightsIcon = '/apps/frontend-assets/technology-icons/insights.svg';
  const InsightsNavURL = `/insights/inventory?workspace=${workspaceName}`;
  const intl = useIntl();
  const AssetsCardsWidths = {
    md: '100px',
    lg: '150px',
    xl: '200px',
    '2xl': '300px',
  };
  const AssetsCardsIconWidths = {
    default: '48px',
  };

  return (
    <Panel>
      <PanelHeader>{intl.formatMessage(Messages.assetManagementOverview)}</PanelHeader>
      <PanelMain>
        <PanelMainBody>
          <Gallery hasGutter minWidths={AssetsCardsWidths}>
            <Card>
              <CardHeader>
                <Brand src={InsightsIcon} alt="Insights logo" widths={AssetsCardsIconWidths} />
              </CardHeader>
              <CardTitle>{intl.formatMessage(Messages.assetManagementInsights)}</CardTitle>
              <CardBody>{intl.formatMessage(Messages.assetManagementInsightsOverview)}</CardBody>
              <CardFooter>
                <Button variant="link" component="a" href={InsightsNavURL} icon={<ArrowRightIcon />} iconPosition="end" isInline>
                  {intl.formatMessage(Messages.assetManagementInsightsNav)}
                </Button>
              </CardFooter>
            </Card>
          </Gallery>
        </PanelMainBody>
      </PanelMain>
    </Panel>
  );
};

export default AssetsCards;
