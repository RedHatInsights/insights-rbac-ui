import {
  Brand,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  Gallery,
  Panel,
  PanelHeader,
  PanelMain,
  PanelMainBody,
} from '@patternfly/react-core';
import { ArrowRightIcon } from '@patternfly/react-icons';
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
