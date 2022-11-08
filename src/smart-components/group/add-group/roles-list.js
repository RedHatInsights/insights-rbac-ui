import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import PropTypes from 'prop-types';
import { defaultSettings, defaultCompactSettings } from '../../../helpers/shared/pagination';
import { sortable } from '@patternfly/react-table';
import { mappedProps } from '../../../helpers/shared/helpers';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';
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

const RolesList = ({ selectedRoles, setSelectedRoles, rolesExcluded }) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const textFilterRef = useRef(null);
  const selector = ({ roleReducer: { roles, isLoading } }) => ({
    roles: roles.data,
    pagination: roles.meta,
    isLoading: isLoading,
    filters: roles.filters,
  });
  const selectorRolesExluded = ({
    groupReducer: {
      selectedGroup: { addRoles, uuid },
    },
  }) => ({
    roles: addRoles.roles,
    pagination: addRoles.pagination || { ...defaultSettings, count: roles && roles.length },
    isLoading: !addRoles.loaded,
    groupId: uuid,
  });
  const { roles, pagination, isLoading, groupId, filters } = useSelector(rolesExcluded ? selectorRolesExluded : selector, shallowEqual);

  const { current: columns } = useRef([
    { title: intl.formatMessage(messages.name), key: 'display_name', ...(rolesExcluded ? { orderBy: 'name' } : { transforms: [sortable] }) },
    { title: intl.formatMessage(messages.description) },
  ]);

  const [filterValue, setFilterValue] = useState('');
  const [sortByState, setSortByState] = useState({ index: 1, direction: 'asc' });

  const setCheckedItems = (newSelection) => {
    setSelectedRoles((roles) => {
      return newSelection(roles).map(({ uuid, name, label }) => ({ uuid, label: label || name }));
    });
  };

  const fetchRoles = useCallback(
    (groupId, config) => (rolesExcluded ? dispatch(fetchAddRolesForGroup(groupId, config)) : dispatch(fetchRolesWithPolicies(mappedProps(config)))),
    [rolesExcluded]
  );
  const fetchTableData = (groupId, config) => {
    const { name, count, limit, offset, orderBy } = config;
    return fetchRoles(groupId, mappedProps({ count, limit, offset, orderBy, filters: { display_name: name } }));
  };
  const orderBy = `${sortByState?.direction === 'desc' ? '-' : ''}${columns[sortByState?.index].key}`;
  const rows = createRows(roles, selectedRoles);

  useEffect(() => {
    fetchRoles(groupId, { ...pagination, orderBy });
  }, []);

  return (
    <TableToolbarView
      isSelectable
      isCompact
      borders={false}
      columns={columns}
      rows={rows}
      sortBy={sortByState}
      onSort={(e, index, direction, isSelectable) => {
        const orderBy = `${direction === 'desc' ? '-' : ''}${columns[isSelectable ? index - 1 : index].key}`;
        setSortByState({ index, direction });
        fetchTableData(groupId, {
          ...pagination,
          offset: 0,
          orderBy,
          ...(filters?.length > 0
            ? {
                ...filters.reduce(
                  (acc, curr) => ({
                    ...acc,
                    [curr.key]: curr.value,
                  }),
                  {}
                ),
              }
            : { name: filterValue }),
        });
      }}
      data={roles}
      filterValue={filterValue}
      filterPlaceholder={intl.formatMessage(messages.roleName).toLowerCase()}
      fetchData={(config) => fetchRoles(groupId, { ...config, filters: { display_name: config.name } })}
      setFilterValue={({ name }) => setFilterValue(name)}
      isLoading={isLoading}
      ouiaId="roles-table"
      pagination={pagination}
      checkedRows={selectedRoles}
      setCheckedItems={setCheckedItems}
      titlePlural={intl.formatMessage(messages.roles).toLowerCase()}
      titleSingular={intl.formatMessage(messages.role)}
      tableId="roles-list"
      textFilterRef={textFilterRef}
    />
  );
};

RolesList.propTypes = {
  canSort: PropTypes.bool,
  setSelectedRoles: PropTypes.func.isRequired,
  selectedRoles: PropTypes.array,
  rolesExcluded: PropTypes.bool.isRequired,
};

RolesList.defaultProps = {
  roles: [],
  pagination: defaultCompactSettings,
  canSort: true,
};

export default RolesList;
