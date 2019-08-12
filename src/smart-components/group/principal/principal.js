import React, { Fragment, useState, useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Route } from 'react-router-dom';
import debouncePromise from 'awesome-debounce-promise';
import { Table, TableHeader, TableBody, expandable } from '@patternfly/react-table';

import AddPrincipal from './add-principal-modal';
import PrincipalsToolbar from './principals-toolbar';
import RemovePrincipal from './remove-principal-modal';
import { createInitialRows } from './principal-table-helpers';
import { fetchPrincipals } from '../../redux/actions/principal-actions';
import { scrollToTop, getNewPage } from '../../helpers/shared/helpers';

const columns = [{ title: 'Name', cellFormatters: [ expandable ]}, 'Description', 'Members' ];

const Principals = ({ fetchPrincipals, pagination, history: { push }}) => {
  const [ filterValue, setFilterValue ] = useState('');
  const [ rows, setRows ] = useState([]);

  useEffect(() => {
    fetchPrincipals().then(({ value: { data }}) => setRows(createInitialRows(data)));
    scrollToTop();
  }, []);

  const handleOnPerPageSelect = limit => fetchPrincipals({
    offset: pagination.offset,
    limit
  }).then(({ value: { data }}) => setRows(createInitialRows(data)));

  const  handleSetPage = (number, debounce) => {
    const options = {
      offset: getNewPage(number, pagination.limit),
      limit: pagination.limit
    };
    const request = () => fetchPrincipals(options);
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

  const actionResolver = (_principalData, { rowIndex }) =>
    rowIndex % 2 === 1 ? null :
      [
        {
          title: 'Edit',
          onClick: (_event, _rowId, principal) =>
            push(`/principals/edit/${principal.uuid}`)
        },
        {
          title: 'Delete',
          style: { color: 'var(--pf-global--danger-color--100)'	},
          onClick: (_event, _rowId, principal) =>
            push(`/principals/remove/${principal.uuid}`)
        }
      ];

  return (
    <Fragment>
      <Route exact path="/groups/add-principal" component={ AddPrincipal } />
      <Route exact path="/groups/remove/:id" component={ RemovePrincipal } />
      <PrincipalsToolbar
        filterValue={ filterValue }
        onFilterChange={ onFilterChange }
        pagination={ pagination }
        handleOnPerPageSelect={ handleOnPerPageSelect }
        handleSetPage={ handleSetPage }
      />
      <Table
        aria-label="Principals table"
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

const mapStateToProps = ({ principalReducer: { principals, filterValue, isLoading }}) => ({
  principals: principals.data,
  pagination: principals.meta,
  isLoading,
  searchFilter: filterValue
});

const mapDispatchToProps = dispatch => {
  return {
    fetchPrincipals: apiProps => dispatch(fetchPrincipals(apiProps))
  };
};

Principals.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired
  }),
  principals: PropTypes.array,
  platforms: PropTypes.array,
  isLoading: PropTypes.bool,
  searchFilter: PropTypes.string,
  fetchPrincipals: PropTypes.func.isRequired,
  pagination: PropTypes.shape({
    limit: PropTypes.number.isRequired,
    offset: PropTypes.number.isRequired,
    count: PropTypes.number.isRequired
  })
};

Principals.defaultProps = {
  principals: [],
  pagination: {}
};

export default connect(mapStateToProps, mapDispatchToProps)(Principals);
