import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { mappedProps } from '../../../helpers/shared/helpers';
import { defaultCompactSettings } from '../../../helpers/shared/pagination';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';
import { fetchRolesWithPolicies } from '../../../redux/actions/role-actions';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import debouncePromise from '@redhat-cloud-services/frontend-components-utilities/files/debounce';

const debouncedFetch = debouncePromise(callback => callback());

const columns = [
  { title: 'Role name', orderBy: 'name' },
  { title: 'Description' }
];

const createRows = (data, expanded, checkedRows = []) => {
  return data ? data.reduce((acc,  { uuid, name, description }) => ([
    ...acc, {
      uuid,
      cells: [ name, description ],
      selected: checkedRows && checkedRows.indexOf(uuid) !== -1
    }
  ]), []) : [];
};

const RolesList = ({ roles, fetchRoles, isLoading, pagination, selectedRoles, setSelectedRoles }) => {
  const [ filterValue, setFilterValue ] = useState('');

  useEffect(() => {
    fetchRoles({ ...pagination, name: filterValue });
  }, []);

  const setCheckedItems = (event, isSelected, _rowId, { uuid, cells: [ label ] } = { cells: []}) => {
    setSelectedRoles((selected) => {
      let currRows = [{ uuid, label }];
      if (typeof event === 'number') {
        if (event === -1) {
          return [];
        }

        currRows = roles.map(({ uuid, name }) => ({ uuid, label: name }));
      }

      if (!isSelected) {
        return selected.filter((row) => !currRows.find(({ uuid }) => uuid === row.uuid));
      } else {
        return [
          ...selected,
          ...currRows
        ].filter((row, key, arr) => arr.findIndex(({ uuid }) => row.uuid === uuid) === key);
      }
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
    setFilterValue={ (config, isDebounce) => {
      setFilterValue(config.name);
      if (isDebounce) {
        debouncedFetch(() => fetchRoles(config));
      } else {
        fetchRoles(config);
      }
    } }
    isLoading={ isLoading }
    pagination={ pagination }
    request={ fetchRoles }
    checkedRows={ selectedRoles ? selectedRoles.map(item => item.uuid) : [] }
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
