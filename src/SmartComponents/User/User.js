import React from 'react';
import PropTypes from 'prop-types';
import {
  Stack,
  StackItem,
  DataListItem,
  DataListCell,
  DataListCheck,
  DataListToggle,
  DataListContent,
  Title,
  TextVariants,
  TextContent
} from '@patternfly/react-core';

const fetchGroupListForUser = (groups = []) => groups.map(group => group.name).join(', ');

const User = ({ item, isExpanded, toggleExpand }) => (
  <DataListItem
    aria-labelledby={ `check-user-${item.email}` }
    isExpanded={ isExpanded(item.email) }>
    <DataListToggle
      onClick={ () => toggleExpand(item.email) }
      isExpanded={ isExpanded(item.email) }
      id={ `user-${item.email}` }
      aria-labelledby={ `user-${item.email} user-${item.email}` }
      aria-label="Toggle details for"
    />
    <DataListCheck aria-labelledby={ `check-user-${item.email}` } name={ `check-user-${item.email}` }/>
    <DataListCell>
      <StackItem>
        <span id={ item.email }>{ `${item.username}` } </span>
      </StackItem>
      <StackItem>
        <span id={ item.email }>{ `${item.email}` } </span>
      </StackItem>
    </DataListCell>
    <DataListCell>
      { fetchGroupListForUser(item.groups) }
    </DataListCell>
    <DataListContent aria-label="User Content Details"
      isHidden={ !isExpanded(item.email) }>
      <Stack gutter="md">
        <StackItem>
          <Title size="md">Groups</Title>
        </StackItem>
        <StackItem>
          <TextContent component={ TextVariants.h6 }>
            { fetchGroupListForUser(item.groups) }
          </TextContent>
        </StackItem>
      </Stack>
    </DataListContent>
  </DataListItem>
);

User.propTypes = {
  item: PropTypes.shape({
    email: PropTypes.string.isRequired,
    username: PropTypes.string.isRequired,
    groups: PropTypes.array
  }),
  isExpanded: PropTypes.func.isRequired,
  toggleExpand: PropTypes.func.isRequired
};

export default User;
