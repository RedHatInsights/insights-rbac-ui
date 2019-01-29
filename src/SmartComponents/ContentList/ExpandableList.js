import React from 'react';
import { DataList } from '@patternfly/react-core';
import DataRow from '../../SmartComponents/Common/DataRow';

const ExpandableList = ({ isLoading, items, noItems = 'No Items' }) => {

  if (isLoading)
  {
    return (
      <PageHeader>
        <PageHeaderTitle title={ noItems }/>
      </PageHeader>
    );
  }

  state = {
    expanded: []
  };

  render() {
    const toggle = id => {
      const expanded = this.state.expanded;
      const index = expanded.indexOf(id);
      const newExpanded =
        index >= 0 ? [ ...expanded.slice(0, index), ...expanded.slice(index + 1, expanded.length) ] : [ ...expanded, id ];
      this.setState(() => ({ expanded: newExpanded }));
    };

    return (
      <DataList aria-label="Expandable data list">
        { items.map( (item) => <DataRow isExpanded={ this.state.expanded.includes( item.name) } toggle={ toggle }/>)}
      </DataList>
    );
  }
}

export default ExpandableDataList;
