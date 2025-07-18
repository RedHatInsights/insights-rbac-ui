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
import Messages from '../../Messages';
import React from 'react';
import { useIntl } from 'react-intl';

interface AssetsCardsProps {
  workspaceName: string;
}

const AssetsCards: React.FunctionComponent<AssetsCardsProps> = ({ workspaceName }: AssetsCardsProps) => {
  const InsightsIcon = '/apps/frontend-assets/console-landing/insights.svg';
  const OpenShiftIcon = '/apps/frontend-assets/console-landing/openshift.svg';
  const InsightsNavURL = `/insights/inventory?workspace=${workspaceName}`;
  const OpenShiftNavURL = `/openshift/?workspace=${workspaceName}`;
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
            <Card>
              <CardHeader>
                <Brand src={OpenShiftIcon} alt="OpenShift logo" widths={AssetsCardsIconWidths} />
              </CardHeader>
              <CardTitle>{intl.formatMessage(Messages.assetManagementOpenShift)}</CardTitle>
              <CardBody>{intl.formatMessage(Messages.assetManagementOpenShiftOverview)}</CardBody>
              <CardFooter>
                <Button variant="link" component="a" href={OpenShiftNavURL} icon={<ArrowRightIcon />} iconPosition="end" isInline>
                  {intl.formatMessage(Messages.assetManagementOpenShiftNav)}
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
