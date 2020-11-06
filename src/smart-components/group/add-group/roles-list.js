import React, { useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { sortable } from '@patternfly/react-table';
import { mappedProps } from '../../../helpers/shared/helpers';
import { defaultCompactSettings, defaultSettings } from '../../../helpers/shared/pagination';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';
import { fetchRolesWithPolicies } from '../../../redux/actions/role-actions';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import { fetchAddRolesForGroup } from '../../../redux/actions/group-actions';

const createRows = (data, expanded, checkedRows = []) => {
  return data
    ? data.reduce(
        (acc, { uuid, display_name, name, description }) => [
          ...acc,
          {
            uuid,
            cells: [display_name || name, description],
            selected: Boolean(checkedRows && checkedRows.find((row) => row.uuid === uuid)),
          },
        ],
        []
      )
    : [];
};

const RolesList = ({ roles, fetchRoles, isLoading, pagination, selectedRoles, canSort, setSelectedRoles }) => {
  const [filterValue, setFilterValue] = useState('');
  const { current: columns } = useRef([
    { title: 'Name', key: 'display_name', ...(canSort ? { transforms: [sortable] } : { orderBy: 'name' }) },
    { title: 'Description' },
  ]);

  useEffect(() => {
    fetchRoles({ orderBy: 'display_name' });
  }, []);

  const setCheckedItems = (newSelection) => {
    setSelectedRoles((roles) => {
      return newSelection(roles).map(({ uuid, name, label }) => ({ uuid, label: label || name }));
    });
  };

  return (
    <TableToolbarView
      columns={columns}
      isSelectable
      isCompact
      borders={false}
      createRows={createRows}
      data={roles}
      filterValue={filterValue}
      fetchData={(config) => fetchRoles(mappedProps(config))}
      setFilterValue={({ name }) => setFilterValue(name)}
      isLoading={isLoading}
      ouiaId="roles-table"
      pagination={pagination}
      checkedRows={selectedRoles}
      setCheckedItems={setCheckedItems}
      titlePlural="roles"
      titleSingular="role"
    />
  );
};

const mapStateToProps = ({ roleReducer: { roles, isLoading } }) => ({
  roles: roles.data,
  pagination: roles.meta,
  isLoading,
});

const mapDispatchToProps = (dispatch) => {
  return {
    fetchRoles: (apiProps) => {
      dispatch(fetchRolesWithPolicies(mappedProps(apiProps)));
    },
    addNotification: (...props) => dispatch(addNotification(...props)),
  };
};

RolesList.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired,
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
    count: PropTypes.number,
  }),
  canSort: PropTypes.bool,
};

RolesList.defaultProps = {
  roles: [],
  pagination: defaultCompactSettings,
  canSort: true,
};

const mapStateToPropsGroup = ({ groupReducer: { selectedGroup } }) => {
  const roles = selectedGroup.addRoles.roles;

  return {
    roles,
    pagination: selectedGroup.addRoles.pagination || { ...defaultSettings, count: roles && roles.length },
    isLoading: !selectedGroup.addRoles.loaded,
    groupId: selectedGroup.uuid,
  };
};

const mapDispatchToPropsGroup = (dispatch) => {
  return {
    fetchRoles: (groupId, apiProps) => {
      dispatch(fetchAddRolesForGroup(groupId, apiProps));
    },
    addNotification: (...props) => dispatch(addNotification(...props)),
  };
};

const mergeProps = (propsFromState, propsFromDispatch, ownProps) => {
  return {
    ...ownProps,
    ...propsFromState,
    ...propsFromDispatch,
    canSort: false,
    fetchRoles: (apiProps) => propsFromDispatch.fetchRoles(propsFromState.groupId, apiProps),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(RolesList);
export const ExcludedRolesList = connect(mapStateToPropsGroup, mapDispatchToPropsGroup, mergeProps)(RolesList);
