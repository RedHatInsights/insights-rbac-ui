import React, { useState } from 'react';
import {
  Button,
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
  Icon,
  Title,
} from '@patternfly/react-core';
import { CubesIcon } from '@patternfly/react-icons';
import { useIntl } from 'react-intl';
import { AppLink } from '../../../components/navigation/AppLink';
import pathnames from '../../../utilities/pathnames';
import messages from '../../../Messages';

interface SupportingFeaturesSectionProps {
  className?: string;
  initialExpanded?: boolean;
}

export const SupportingFeaturesSection: React.FC<SupportingFeaturesSectionProps> = ({ className, initialExpanded = true }) => {
  const intl = useIntl();
  const [expanded, setExpanded] = useState(initialExpanded);

  return (
    <DataList aria-label="Supporting features list" className={className}>
      <DataListItem aria-labelledby="item1" isExpanded={expanded} className={expanded ? 'active-item' : undefined}>
        <DataListItemRow className="pf-v5-u-align-items-center">
          <DataListToggle
            id="supporting-features-toggle"
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
  );
};
