import { Brand } from '@patternfly/react-core/dist/dynamic/components/Brand';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Card } from '@patternfly/react-core/dist/dynamic/components/Card';
import { CardBody } from '@patternfly/react-core/dist/dynamic/components/Card';
import { CardFooter } from '@patternfly/react-core/dist/dynamic/components/Card';
import { CardHeader } from '@patternfly/react-core/dist/dynamic/components/Card';
import { CardTitle } from '@patternfly/react-core/dist/dynamic/components/Card';
import { Gallery } from '@patternfly/react-core/dist/dynamic/layouts/Gallery';
import { Panel } from '@patternfly/react-core/dist/dynamic/components/Panel';
import { PanelHeader } from '@patternfly/react-core/dist/dynamic/components/Panel';
import { PanelMain } from '@patternfly/react-core/dist/dynamic/components/Panel';
import { PanelMainBody } from '@patternfly/react-core/dist/dynamic/components/Panel';
import ArrowRightIcon from '@patternfly/react-icons/dist/js/icons/arrow-right-icon';

import React from 'react';
import { useIntl } from 'react-intl';
import messages from '../../../../../Messages';

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
      <PanelHeader>{intl.formatMessage(messages.assetManagementOverview)}</PanelHeader>
      <PanelMain>
        <PanelMainBody>
          <Gallery hasGutter minWidths={AssetsCardsWidths}>
            <Card>
              <CardHeader>
                <Brand src={InsightsIcon} alt="Insights logo" widths={AssetsCardsIconWidths} />
              </CardHeader>
              <CardTitle>{intl.formatMessage(messages.assetManagementInsights)}</CardTitle>
              <CardBody>{intl.formatMessage(messages.assetManagementInsightsOverview)}</CardBody>
              <CardFooter>
                <Button variant="link" component="a" href={InsightsNavURL} icon={<ArrowRightIcon />} iconPosition="end" isInline>
                  {intl.formatMessage(messages.assetManagementInsightsNav)}
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
