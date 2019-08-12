import React, { Fragment, useState, useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Route } from 'react-router-dom';
import debouncePromise from 'awesome-debounce-promise';
import { Table, TableHeader, TableBody, expandable } from '@patternfly/react-table';

import AddPolicyWizard from './add-policy/add-policy-wizard';
import AddPolicy from './add-policy-modal';
import PoliciesToolbar from './policies-toolbar';
import RemovePolicy from './remove-policy-modal';
import { createRows } from './policy-table-helpers';
import { fetchPolicies } from '../../redux/actions/policy-actions';
import { scrollToTop, getNewPage } from '../../helpers/shared/helpers';

const columns = [{ title: 'Name', cellFormatters: [ expandable ]}, 'Description', 'Members' ];

const Policies = ({ fetchPolicies, pagination, history: { push }}) => {
  const [ filterValue, setFilterValue ] = useState('');
  const [ rows, setRows ] = useState([]);

  useEffect(() => {
    fetchPolicies().then(({ value: { data }}) => setRows(createRows(data)));
    scrollToTop();
  }, []);

  const handleOnPerPageSelect = limit => fetchPolicies({
    offset: pagination.offset,
    limit
  }).then(({ value: { data }}) => setRows(createRows(data)));

  const  handleSetPage = (number, debounce) => {
    const options = {
      offset: getNewPage(number, pagination.limit),
      limit: pagination.limit
    };
    const request = () => fetchPolicies(options);
    if (debounce) {
      return debouncePromise(request, 250)();
    }

    return request().then(({ value: { data }}) => setRows(createRows(data)));
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

  const actionResolver = (_policyData, { rowIndex }) =>
    rowIndex % 2 === 1 ? null :
      [
        {
          title: 'Edit',
          onClick: (_event, _rowId, policy) =>
            push(`/policies/edit/${policy.uuid}`)
        },
        {
          title: 'Delete',
          style: { color: 'var(--pf-global--danger-color--100)'	},
          onClick: (_event, _rowId, policy) =>
            push(`/policies/remove/${policy.uuid}`)
        }
      ];

  return (
    <Fragment>
      <Route exact path="/policies/add-policy" component={ AddPolicyWizard } />
      <Route exact path="/policies/edit/:id" component={ AddPolicy } />
      <Route exact path="/policies/remove/:id" component={ RemovePolicy } />
      <PoliciesToolbar
        filterValue={ filterValue }
        onFilterChange={ onFilterChange }
        pagination={ pagination }
        handleOnPerPageSelect={ handleOnPerPageSelect }
        handleSetPage={ handleSetPage }
      />
      <Table
        aria-label="Policies table"
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

const mapStateToProps = ({ policyReducer: { policies, filterValue, isLoading }}) => ({
  policies: policies.data,
  pagination: policies.meta,
  isLoading,
  searchFilter: filterValue
});

const mapDispatchToProps = dispatch => {
  return {
    fetchPolicies: apiProps => dispatch(fetchPolicies(apiProps))
  };
};

Policies.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired
  }),
  policies: PropTypes.array,
  platforms: PropTypes.array,
  isLoading: PropTypes.bool,
  searchFilter: PropTypes.string,
  fetchPolicies: PropTypes.func.isRequired,
  pagination: PropTypes.shape({
    limit: PropTypes.number.isRequired,
    offset: PropTypes.number.isRequired,
    count: PropTypes.number.isRequired
  })
};

Policies.defaultProps = {
  policies: [],
  pagination: {}
};

export default connect(mapStateToProps, mapDispatchToProps)(Policies);
