import React from 'react';
import propTypes from 'prop-types';
import { PageHeader, PageHeaderTitle, Section } from '@red-hat-insights/insights-frontend-components';
import {
  Bullseye,
  DataList,
  DataListItem,
  DataListCell,
  DataListToggle,
  DataListContent,
  Text,
  TextVariants,
  TextContent } from '@patternfly/react-core';

const UserList = ({ isLoading, items, fetchGroupsByUserId, noItems = 'No Items' }) => {

  if (isLoading)
  {
    return (
      <PageHeader>
        <PageHeaderTitle title={ noItems }/>
      </PageHeader>
    );
  }

  let expandedList = [];

  const toggle = id => {
    const expanded = expandedList;
    const index = expanded.indexOf(id);
    const newExpanded =
      index >= 0 ? [ ...expanded.slice(0, index), ...expanded.slice(index + 1, expanded.length) ] : [ ...expanded, id ];
    expandedList = newExpanded;
  };

  // <UserDetail isExpanded={ expandedList.includes(item.name) } toggle={ toggle }/>) }
  return (
    <React.Fragment>
      <Bullseye>
        <div>
          { isLoading && (<span color={ '#00b9e4' }> Loading...</span>) }
        </div>
      </Bullseye>
      <Section type='content'>
        { (items && items.length > 0) && (
          <DataList aria-label="Expandable data list">
            { items.map((item) => {
              return (
                <DataListItem aria-labelledby="simple-item1">
                  <DataListCell>
                    <span id={ item.id }>{ `${item.first_name} ${item.last_name}` }</span>
                  </DataListCell>
                  <DataListCell>
                    { fetchGroupsByUserId(item.id) }
                  </DataListCell>
                </DataListItem>); })
            }
          </DataList>)
        }
      </Section>
    </React.Fragment>
  );
};

UserList.propTypes = {
  isLoading: propTypes.bool,
  items: propTypes.array,
  fetchGroupsByUserId: propTypes.func,
  noItems: propTypes.string
};
export default UserList;
