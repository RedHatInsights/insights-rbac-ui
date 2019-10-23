import React, { useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { defaultCompactSettings } from '../../../helpers/shared/pagination';
import { fetchRoles } from '../../../redux/actions/role-actions';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';
import { fetchRolesList } from '../../../helpers/role/role-helper';

const columns = [
  { title: 'Role name', orderBy: 'name' },
  { title: 'Description' }
];

const createRows = (data, filterValue = undefined) => (
  data ? data.filter(item => { const filter = filterValue ? item.name.includes(filterValue) : true;
    return filter; }).reduce((acc,  { uuid, name, description }) => ([
    ...acc, {
      uuid,
      cells: [ name, description ]
    }
  ]), []) : []
);

const RolesList = ({ fetchRoles, isLoading, pagination, selectedRoles, setSelectedRoles }) => {
  const [ filterValue, setFilterValue ] = useState('');
  const [ roles, setRoles ] = useState([]);

  const fetchData = () => {
    fetchRolesList(filterValue, pagination).then(({ data }) => setRoles(data));
  };

  const setCheckedItems = (checkedItems) =>
    setSelectedRoles(checkedItems.map(item => item.uuid));

  return <TableToolbarView
    columns={ columns }
    isSelectable={ true }
    isCompact={ true }
    borders = { false }
    createRows={ createRows }
    data={ roles }
    fetchData={ fetchData }
    filterValue={ filterValue }
    setFilterValue={ setFilterValue }
    isLoading={ isLoading }
    pagination={ pagination }
    request={ fetchRoles }
    checkedItems={ selectedRoles }
    setCheckedItems={ setCheckedItems }
    titlePlural="roles"
    titleSingular="role"
  />;
};

const mapStateToProps = ({ roleReducer: { roles, filterValue, isLoading }}) => ({
  roles: roles.data,
  pagination: roles.meta,
  isLoading,
  searchFilter: filterValue
});

const mapDispatchToProps = dispatch => {
  return {
    fetchRoles: apiProps => dispatch(fetchRoles(apiProps))
  };
};

RolesList.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired
  }),
  roles: PropTypes.array,
  platforms: PropTypes.array,
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
