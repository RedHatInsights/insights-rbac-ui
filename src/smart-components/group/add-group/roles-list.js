import React, { useState } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { defaultCompactSettings } from '../../../helpers/shared/pagination';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';
import { fetchRoles } from '../../../redux/actions/role-actions';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';

const columns = [
  { title: 'Role name', orderBy: 'name' },
  { title: 'Description' }
];

const createRows = (data, checkedRows = [], filterValue = undefined) => {
  return data ? data.filter(item => { const filter = filterValue ? item.name.includes(filterValue) : true;
    return filter; }).reduce((acc,  { uuid, name, description }) => ([
    ...acc, {
      uuid,
      cells: [ name, description ],
      selected: checkedRows && checkedRows.indexOf(uuid) > -1
    }
  ]), []) : [];
};

const RolesList = ({ fetchRoles, isLoading, pagination, selectedRoles, setSelectedRoles }) => {
  const [ filterValue, setFilterValue ] = useState('');
  const [ roles, setRoles ] = useState([]);

  const fetchData = () => {
    fetchRoles(pagination).then(({ value: { data }}) => setRoles(data));
  };

  const setCheckedItems = (checkedItems) => {
    setSelectedRoles(checkedItems.map(item => ({ value: item.uuid, label: item.cells[0] })));
  };

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
    checkedRows={ selectedRoles ? selectedRoles.map(item => item.value) : [] }
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

const mapDispatchToProps = dispatch => bindActionCreators({
  fetchRoles,
  addNotification
}, dispatch);

RolesList.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired
  }),
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
