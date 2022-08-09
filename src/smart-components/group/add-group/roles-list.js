import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import PropTypes from 'prop-types';
import { sortable } from '@patternfly/react-table';
import { mappedProps } from '../../../helpers/shared/helpers';
import { syncDefaultFiltersWithUrl } from '../../../helpers/shared/filters';
import { TableToolbarViewForRoles } from '../../../presentational-components/shared/table-toolbar-view';
import { fetchRolesWithPolicies } from '../../../redux/actions/role-actions';
import { fetchAddRolesForGroup } from '../../../redux/actions/group-actions';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';

const createRows = (data, checkedRows = []) => {
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

export const RolesList = ({ selectedRoles, setSelectedRoles, rolesExcluded }) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const selector = ({ roleReducer: { roles, isLoading }, groupReducer: { selectedGroup } }) => ({
    roles: rolesExcluded ? selectedGroup.addRoles.roles : roles.data,
    pagination: rolesExcluded ? selectedGroup.addRoles.pagination : roles.meta,
    isLoading,
    filters: roles.filters,
    groupId: selectedGroup.uuid,
  });
  const { roles, pagination, isLoading, groupId } = useSelector(selector, shallowEqual);
  const [filterValue, setFilterValue] = useState('');
  const { current: columns } = useRef([
    { title: intl.formatMessage(messages.name), key: 'display_name', ...(!rolesExcluded ? { transforms: [sortable] } : { orderBy: 'name' }) },
    { title: intl.formatMessage(messages.description) },
  ]);
  const setCheckedItems = (newSelection) => {
    setSelectedRoles((roles) => {
      return newSelection(roles).map(({ uuid, name, label }) => ({ uuid, label: label || name }));
    });
  };
  const fetchRoles = (config) => dispatch(fetchRolesWithPolicies(mappedProps({ ...config })));
  const fetchRolesForGroup = (config, groupId) => dispatch(fetchAddRolesForGroup(...config, groupId));

  const [sortByState, setSortByState] = useState({ index: 0, direction: 'asc' });
  const orderBy = `${sortByState?.direction === 'desc' ? '-' : ''}${columns[sortByState?.index].key}`;

  const rows = createRows(roles, selectedRoles);

  useEffect(() => {
    const { display_name } = syncDefaultFiltersWithUrl(history, ['display_name'], { display_name: filterValue });
    setFilterValue(display_name);
    rolesExcluded ? fetchRolesForGroup({ orderBy, filters: { display_name } }) : fetchRoles({ orderBy, filters: { display_name } });
  }, []);

  const fetchTableData = (config) => {
    const { name, count, limit, offset, orderBy } = config;
    return fetchRoles(mappedProps({ count, limit, offset, orderBy, filters: { display_name: name } }));
  };

  return (
    <TableToolbarViewForRoles
      isSelectable
      isCompact
      borders={false}
      columns={columns}
      rowsTesting={rows}
      createRows={createRows}
      sortBy={sortByState}
      onSort={(e, index, direction, isSelectable) => {
        const orderBy = `${direction === 'desc' ? '-' : ''}${columns[isSelectable ? index - 1 : index].key}`;
        setSortByState({ index, direction });
        fetchTableData({
          ...pagination,
          offset: 0,
          name: filterValue,
          orderBy,
        });
      }}
      data={roles}
      filterValue={filterValue}
      filterPlaceholder={intl.formatMessage(messages.roleName).toLowerCase()}
      fetchData={
        rolesExcluded
          ? (config) => fetchRolesForGroup(mappedProps({ ...config, filters: { display_name: config.name } }), groupId)
          : (config) => fetchRoles(mappedProps({ ...config, filters: { display_name: config.name } }))
      }
      setFilterValue={({ name }) => setFilterValue(name)}
      isLoading={isLoading}
      ouiaId="roles-table"
      pagination={pagination}
      checkedRows={selectedRoles}
      setCheckedItems={setCheckedItems}
      titlePlural={intl.formatMessage(messages.roles).toLowerCase()}
      titleSingular={intl.formatMessage(messages.role)}
      tableId="roles-list"
      testRoles={true}
    />
  );
};

RolesList.propTypes = {
  setSelectedRoles: PropTypes.func.isRequired,
  selectedRoles: PropTypes.array,
  rolesExcluded: PropTypes.bool.isRequired,
};
