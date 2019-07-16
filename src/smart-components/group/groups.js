import React, { Fragment, useState, useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Route } from 'react-router-dom';
import debouncePromise from 'awesome-debounce-promise';
import { Table, TableHeader, TableBody, expandable } from '@patternfly/react-table';

import AddGroupWizard from './add-group/add-group-wizard';
import AddGroup from './add-group-modal';
import GroupsToolbar from './groups-toolbar';
import RemoveGroup from './remove-group-modal';
import { createInitialRows } from './group-table-helpers';
import { fetchGroups } from '../../redux/actions/group-actions';
import { scrollToTop, getNewPage } from '../../helpers/shared/helpers';

const columns = [{ title: 'Name', cellFormatters: [ expandable ]}, 'Description', 'Members' ];

const Groups = ({ fetchGroups, pagination, history: { push }}) => {
  const [ filterValue, setFilterValue ] = useState('');
  const [ rows, setRows ] = useState([]);

  useEffect(() => {
    fetchGroups().then(({ value: { data }}) => setRows(createInitialRows(data)));
    scrollToTop();
  }, []);

  const handleOnPerPageSelect = limit => fetchGroups({
    offset: pagination.offset,
    limit
  }).then(({ value: { data }}) => setRows(createInitialRows(data)));

  const  handleSetPage = (number, debounce) => {
    const options = {
      offset: getNewPage(number, pagination.limit),
      limit: pagination.limit
    };
    const request = () => fetchGroups(options);
    if (debounce) {
      return debouncePromise(request, 250)();
    }

    return request().then(({ value: { data }}) => setRows(createInitialRows(data)));
  };

  const handleOpen = (data, uuid) => data.map(row => {
    if (row.uuid === uuid) {
      return {
        ...row,
        isOpen: !row.isOpen
      };
    }

    return { ...row };
  });

  const handleSelected = (data, uuid) => data.map(row => {
    if (row.uuid === uuid) {
      return {
        ...row,
        selected: !row.selected
      };
    }

    return { ...row };
  });

  const onCollapse = (_event, _index, _isOpen, { uuid }) => setRows(rows => handleOpen(rows, uuid));

  const onFilterChange = (value) => {
    setFilterValue(value);
  };

  const selectRow = (_event, selected, index, { uuid } = {}) => index === -1
    ? setRows(rows.map(row => ({ ...row, selected })))
    : setRows(rows => handleSelected(rows, uuid));

  const actionResolver = (_groupData, { rowIndex }) =>
    rowIndex % 2 === 1 ? null :
      [
        {
          title: 'Edit',
          onClick: (_event, _rowId, group) =>
            push(`/groups/edit/${group.uuid}`)
        },
        {
          title: 'Delete',
          style: { color: 'var(--pf-global--danger-color--100)'	},
          onClick: (_event, _rowId, group) =>
            push(`/groups/remove/${group.uuid}`)
        }
      ];

  return (
    <Fragment>
      <Route exact path="/groups/add-group" component={ AddGroupWizard } />
      <Route exact path="/groups/edit/:id" component={ AddGroup } />
      <Route exact path="/groups/remove/:id" component={ RemoveGroup } />
      <GroupsToolbar
        filterValue={ filterValue }
        onFilterChange={ onFilterChange }
        pagination={ pagination }
        handleOnPerPageSelect={ handleOnPerPageSelect }
        handleSetPage={ handleSetPage }
      />
      <Table
        aria-label="Groups table"
        onCollapse={ onCollapse }
        rows={ rows }
        cells={ columns }
        onSelect={ selectRow }
        actionResolver={ actionResolver }
      >
        <TableHeader />
        <TableBody />
      </Table>
    </Fragment>
  );
};

const mapStateToProps = ({ groupReducer: { groups, filterValue, isLoading }}) => ({
  groups: groups.data,
  pagination: groups.meta,
  isLoading,
  searchFilter: filterValue
});

const mapDispatchToProps = dispatch => {
  return {
    fetchGroups: apiProps => dispatch(fetchGroups(apiProps))
  };
};

Groups.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired
  }),
  groups: PropTypes.array,
  platforms: PropTypes.array,
  isLoading: PropTypes.bool,
  searchFilter: PropTypes.string,
  fetchGroups: PropTypes.func.isRequired,
  pagination: PropTypes.shape({
    limit: PropTypes.number.isRequired,
    offset: PropTypes.number.isRequired,
    count: PropTypes.number.isRequired
  })
};

Groups.defaultProps = {
  groups: [],
  pagination: {}
};

export default connect(mapStateToProps, mapDispatchToProps)(Groups);
