import React, { useState } from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { DataList } from '@patternfly/react-core/dist/dynamic/components/DataList';
import {
  DataListCell,
  DataListContent,
  DataListItemCells,
  DataListItemRow,
  DataListToggle,
} from '@patternfly/react-core/dist/dynamic/components/DataList';
import { Flex, FlexItem } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import { Divider } from '@patternfly/react-core/dist/dynamic/components/Divider';
import { Icon } from '@patternfly/react-core/dist/dynamic/components/Icon';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { DataListItem } from '@patternfly/react-core/dist/dynamic/components/DataList';
import CubesIcon from '@patternfly/react-icons/dist/js/icons/cubes-icon';
import { useIntl } from 'react-intl';
import { AppLink } from '../../../../shared/components/navigation/AppLink';

interface SupportingFeaturesSectionProps {
  className?: string;
  initialExpanded?: boolean;
  groupsLink: string;
}

export const SupportingFeaturesSection: React.FC<SupportingFeaturesSectionProps> = ({ className, initialExpanded = true, groupsLink }) => {
  const intl = useIntl();
  const [expanded, setExpanded] = useState(initialExpanded);

  return (
    <DataList aria-label="Supporting features list" className={className}>
      <DataListItem aria-labelledby="item1" isExpanded={expanded} className={expanded ? 'active-item' : undefined}>
        <DataListItemRow className="pf-v6-u-align-items-center">
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
                  <Flex className="pf-v6-u-flex-nowrap">
                    <FlexItem className="pf-v6-u-align-self-center">
                      <Icon size="lg">
                        <CubesIcon className="pf-v6-u-primary-color-100" />
                      </Icon>
                    </FlexItem>
                    <Divider
                      orientation={{
                        default: 'vertical',
                      }}
                    />
                    <FlexItem className="pf-v6-u-align-self-center">
                      <Title headingLevel="h4" data-ouia-component-id="about-title">
                        {intl.formatMessage({
                          id: 'overviewSupportingFeaturesTitle',
                          defaultMessage: 'About default groups',
                          description: 'Overview Supporting Features title',
                        })}
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
          className="pf-v6-u-px-lg pf-v6-u-pb-xl"
          aria-label="About default groups - detailed explanation"
          id="about-default-groups"
          data-ouia-component-id="about-view-default-group"
          isHidden={!expanded}
        >
          <p className="pf-v6-u-mb-md">
            {intl.formatMessage({
              id: 'overviewSupportingFeaturesSubtitle1',
              defaultMessage:
                'The Default access group contains all authenticated users in your organization. These users automatically inherit a selection of predefined roles. The Default admin access group is limited to Organization Administrator users in your organization.',
              description: 'Overview Supporting Features subtitle',
            })}
          </p>
          <p className="pf-v6-u-mb-md">
            {intl.formatMessage({
              id: 'overviewSupportingFeaturesSubtitle2',
              defaultMessage:
                'If you need to modify the default access group to add or remove roles, this new group will change to a Custom default access group.',
              description: 'Overview Supporting Features subtitle',
            })}
          </p>
          <AppLink to={groupsLink}>
            <Button variant="link" isInline>
              {intl.formatMessage({
                id: 'viewDefaultGroupsLink',
                defaultMessage: 'View your default groups',
                description: 'View Default Groups link',
              })}
            </Button>
          </AppLink>
        </DataListContent>
      </DataListItem>
    </DataList>
  );
};
