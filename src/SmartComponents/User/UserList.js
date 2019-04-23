import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { DataList } from '@patternfly/react-core';
import { PageHeader, PageHeaderTitle } from '@red-hat-insights/insights-frontend-components';

import User from './User';

const UserList = ({ isLoading, noItems, items }) => {
  const [ expanded, setExpanded ] = useState([]);

  const toggleExpand = id => {
    const index = expanded.indexOf(id);
    const newExpanded = index >= 0 ? [ ...expanded.slice(0, index), ...expanded.slice(index + 1, expanded.length) ] : [ ...expanded, id ];
    setExpanded(newExpanded);
  };

  const isExpanded = key => expanded.includes(key);

  if (isLoading) {
    return (
      <PageHeader>
        <PageHeaderTitle title={ noItems }/>
      </PageHeader>
    );
  }

  return (
    <DataList aria-label="Expandable data list">
      { items.map(item => (
        <User
          key= { item.email }
          item={ item }
          isExpanded={ isExpanded }
          toggleExpand={ toggleExpand }/>
      )) }
    </DataList>
  );
};

UserList.propTypes = {
  isLoading: PropTypes.bool,
  items: PropTypes.arrayOf(PropTypes.shape({
    email: PropTypes.string.isRequired
  })),
  noItems: PropTypes.string
};

UserList.defaultProps = {
  items: []
};

export default UserList;
