import React from 'react';
import propTypes from 'prop-types';
import { PageHeader, PageHeaderTitle, Table, Section } from '@red-hat-insights/insights-frontend-components';
import { Bullseye } from '@patternfly/react-core';

const ContentList = ({ isLoading, items, noItems = 'No Items' }) => {

  if (isLoading)
  {
    return (
      <PageHeader>
        <PageHeaderTitle title={ noItems }/>
      </PageHeader>
    );
  }

  if (items && items.length > 0) {
    items.sort(function (a, b) {
      let dateA = new Date(a.created_at);
      let dateB = new Date(b.created_at);
      return dateB - dateA; //sort by date descending1
    });
  }

  const headers = items.reduce((acc, curr) => Object.keys(curr).length > acc.length ? Object.keys(curr) : acc,  []);
  return (
    <React.Fragment>
      <Bullseye>
        <div>
          { isLoading && (<span color={ '#00b9e4' }> Loading...</span>) }
        </div>
      </Bullseye>
      <Section type='content'>
        { (items && items.length > 0) && (
          <Table
            header={ headers }
            rows={ items.map(item => {
              let row = {};
              row.cells = (Object.values(item)).map(val => (!val || val === undefined) ? '' : val.toString());
              return row;
            }) }
          />)
        }
      </Section>
    </React.Fragment>
  );
};

ContentList.propTypes = {
  isLoading: propTypes.bool,
  items: propTypes.array,
  noItems: propTypes.string
};
export default ContentList;
