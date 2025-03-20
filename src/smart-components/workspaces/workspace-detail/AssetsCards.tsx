import {
  Brand,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  Gallery,
  Icon,
  Panel,
  PanelHeader,
  PanelMain,
  PanelMainBody,
} from '@patternfly/react-core';
import { ArrowRightIcon } from '@patternfly/react-icons';
import Messages from '../../../Messages';
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

  return (
    <Panel>
      <PanelHeader>{intl.formatMessage(Messages.assetManagementOverview)}</PanelHeader>
      <PanelMain>
        <PanelMainBody>
          <Gallery
            hasGutter
            minWidths={{
              md: '100px',
              lg: '150px',
              xl: '200px',
              '2xl': '300px',
            }}
          >
            <Card>
              <CardHeader>
                <Brand src={InsightsIcon} alt="Insights logo" style={{ width: '48px' }} />
              </CardHeader>
              <CardTitle>{intl.formatMessage(Messages.assetManagementInsights)}</CardTitle>
              <CardBody>{intl.formatMessage(Messages.assetManagementInsightsOverview)}</CardBody>
              <CardFooter>
                <a href={InsightsNavURL}>
                  {intl.formatMessage(Messages.assetManagementInsightsNav)}
                  <Icon className="pf-v5-u-ml-sm" isInline>
                    <ArrowRightIcon />
                  </Icon>
                </a>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <Brand src={OpenShiftIcon} alt="OpenShift logo" style={{ width: '48px' }} />
              </CardHeader>
              <CardTitle>{intl.formatMessage(Messages.assetManagementOpenShift)}</CardTitle>
              <CardBody>{intl.formatMessage(Messages.assetManagementOpenShiftOverview)}</CardBody>
              <CardFooter>
                <a href={OpenShiftNavURL}>
                  {intl.formatMessage(Messages.assetManagementOpenShiftNav)}
                  <Icon className="pf-v5-u-ml-sm" isInline>
                    <ArrowRightIcon />
                  </Icon>
                </a>
              </CardFooter>
            </Card>
          </Gallery>
        </PanelMainBody>
      </PanelMain>
    </Panel>
  );
};

export default AssetsCards;
