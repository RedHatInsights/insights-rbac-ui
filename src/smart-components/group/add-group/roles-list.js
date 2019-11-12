import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { mappedProps } from '../../../helpers/shared/helpers';
import { defaultCompactSettings } from '../../../helpers/shared/pagination';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';
import { fetchRolesWithPolicies } from '../../../redux/actions/role-actions';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';

const columns = [
  { title: 'Role name', orderBy: 'name' },
  { title: 'Description' }
];

const createRows = (data, expanded, checkedRows = []) => {
  return data ? data.reduce((acc,  { uuid, name, description }) => ([
    ...acc, {
      uuid,
      cells: [ name, description ],
      selected: Boolean(checkedRows && checkedRows.find(row => row.uuid === uuid))
    }
  ]), []) : [];
};

const RolesList = ({ roles, fetchRoles, isLoading, pagination, selectedRoles, setSelectedRoles }) => {
  const [ filterValue, setFilterValue ] = useState('');

  useEffect(() => {
    fetchRoles({});
  }, []);

  const setCheckedItems = (newSelection) => {
    setSelectedRoles((roles) => {
      return newSelection(roles).map(({ uuid, name, label }) => ({ uuid, label: label || name }));
    });
  };

  return <TableToolbarView
    columns={ columns }
    isSelectable={ true }
    isCompact={ true }
    borders = { false }
    createRows={ createRows }
    data={ roles }
    filterValue={ filterValue }
    fetchData={ (config) => fetchRoles(mappedProps(config)) }
    setFilterValue={ ({ name }) => setFilterValue(name) }
    isLoading={ isLoading }
    pagination={ pagination }
    request={ fetchRoles }
    checkedRows={ selectedRoles }
    setCheckedItems={ setCheckedItems }
    titlePlural="roles"
    titleSingular="role"
  />;
};

const mapStateToProps = ({ roleReducer: { roles, isLoading }}) => ({
  roles: roles.data,
  pagination: roles.meta,
  isLoading
});

const mapDispatchToProps = dispatch => {
  return {
    fetchRoles: (apiProps) => {
      dispatch(fetchRolesWithPolicies(mappedProps(apiProps)));
    },
    addNotification: (...props) => dispatch(addNotification(...props))
  };
};

RolesList.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired
  }),
  roles: PropTypes.array,
  isLoading: PropTypes.bool,
  searchFilter: PropTypes.string,
  fetchRoles: PropTypes.func.isRequired,
  setSelectedRoles: PropTypes.func.isRequired,
  selectedRoles: PropTypes.array,
  pagination: PropTypes.shape({
    limit: PropTypes.number.isRequired,
    offset: PropTypes.number.isRequired,
    count: PropTypes.number
  })
};

RolesList.defaultProps = {
  roles: [],
  pagination: defaultCompactSettings
};

export default connect(mapStateToProps, mapDispatchToProps)(RolesList);
