import {
  Button,
  DataListAction,
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
import React from 'react';

interface CustomDataListItemProps {
  icon: React.ReactNode;
  heading: string;
  linkTitle?: string;
  linkTarget?: string;
  expandableContent: React.ReactNode;
  isRedirect?: boolean;
  isExpanded?: boolean;
}

const CustomDataListItem: React.FC<CustomDataListItemProps> = ({ icon, heading, linkTitle, linkTarget, expandableContent, isExpanded }) => {
  const [expanded, setExpanded] = React.useState(isExpanded || false);

  return (
    <React.Fragment>
      <DataListItem aria-labelledby="item1" isExpanded={expanded}>
        <DataListItemRow className="pf-v5-u-align-items-center">
          <DataListToggle isExpanded={expanded} id="toggle1" aria-controls="expand1" onClick={() => setExpanded(!expanded)} />
          <DataListItemCells
            dataListCells={[
              <DataListCell key={`cell-${icon?.toString().toLowerCase()}`}>
                <div>
                  <Flex className="pf-v5-u-flex-nowrap">
                    <FlexItem className="pf-v5-u-align-self-center">
                      <Icon size="lg">{icon}</Icon>
                    </FlexItem>
                    <Divider
                      orientation={{
                        default: 'vertical',
                      }}
                    />
                    <FlexItem className="pf-v5-u-align-self-center">
                      <Title headingLevel="h4">{heading}</Title>
                    </FlexItem>
                  </Flex>
                </div>
              </DataListCell>,
            ]}
          />
          {linkTitle && linkTarget && (
            <DataListAction aria-labelledby="item1 action1" id="action1" aria-label="Actions" isPlainButtonAction>
              <Button component="a" href={linkTarget} variant="link">
                {linkTitle}
              </Button>
            </DataListAction>
          )}
        </DataListItemRow>
        <DataListContent aria-label={`${heading} - Detailed Explanation`} id="expand1" isHidden={!expanded}>
          {expandableContent}
        </DataListContent>
      </DataListItem>
    </React.Fragment>
  );
};

export default CustomDataListItem;
