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
import { KeyIcon, UsersIcon } from '@patternfly/react-icons';
import React from 'react';
import { useNavigate } from 'react-router-dom';

export enum IconName {
  KEY = 'access',
  USERS = 'users',
}

interface CustomDataListItemProps {
  icon: IconName;
  heading: string;
  linkTitle?: string;
  linkTarget?: string;
  expandableContent: React.ReactNode;
  isRedirect?: boolean;
  isExpanded?: boolean;
}

const IconMapper = {
  [IconName.USERS]: <UsersIcon className="pf-u-primary-color-100" />,
  [IconName.KEY]: <KeyIcon className="pf-u-primary-color-100" />,
};

const CustomDataListItem: React.FC<CustomDataListItemProps> = ({
  icon,
  heading,
  linkTitle,
  linkTarget,
  expandableContent,
  isRedirect,
  isExpanded,
}) => {
  const navigate = useNavigate();
  const iconElement: React.ReactNode | null = IconMapper[icon] || null;
  const [expanded, setExpanded] = React.useState(isExpanded || false);

  return (
    <React.Fragment>
      <DataListItem aria-labelledby="item1" isExpanded={expanded}>
        <DataListItemRow className="pf-u-align-items-center">
          <DataListToggle isExpanded={expanded} id="toggle1" aria-controls="expand1" onClick={() => setExpanded(!expanded)} />
          <DataListItemCells
            dataListCells={[
              <DataListCell key={'cell-' + icon.toString().toLowerCase()}>
                <div>
                  <Flex className="pf-u-flex-nowrap">
                    <FlexItem className="pf-u-align-self-center">
                      <Icon size="lg">{iconElement}</Icon>
                    </FlexItem>
                    <Divider
                      orientation={{
                        default: 'vertical',
                      }}
                    />
                    <FlexItem className="pf-u-align-self-center">
                      <Title headingLevel="h4">{heading}</Title>
                    </FlexItem>
                  </Flex>
                </div>
              </DataListCell>,
            ]}
          />
          {linkTitle && linkTarget && (
            <DataListAction aria-labelledby="item1 action1" id="action1" aria-label="Actions" isPlainButtonAction>
              <Button
                component="a"
                href={linkTarget}
                variant="link"
                onClick={(e) => {
                  if (!isRedirect) {
                    e.preventDefault();
                    navigate(linkTarget.replace('/preview', ''));
                  }
                }}
              >
                {linkTitle}
              </Button>
            </DataListAction>
          )}
        </DataListItemRow>
        <DataListContent aria-label={heading + ' - Detailed Explanation'} id="expand1" isHidden={!expanded}>
          <p>{expandableContent}</p>
        </DataListContent>
      </DataListItem>
    </React.Fragment>
  );
};

export default CustomDataListItem;
