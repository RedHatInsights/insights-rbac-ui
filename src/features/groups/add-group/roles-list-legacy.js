import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { sortable } from '@patternfly/react-table';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import { defaultCompactSettings } from '../../../helpers/pagination';
import { mappedProps } from '../../../helpers/dataUtilities';
import { TableToolbarView } from '../../../components/tables/TableToolbarView';
import { fetchRolesWithPolicies } from '../../../redux/roles/actions';
import { fetchAddRolesForGroup } from '../../../redux/groups/actions';
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
        [],
      )
    : [];
};

const RolesList = ({ selectedRoles, setSelectedRoles, rolesExcluded, groupId: groupUuid }) => {
  const intl = useIntl();
  const chrome = useChrome();
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
      selectedGroup: {
        addRoles: { roles, pagination, loaded },
        uuid,
      },
    },
  }) => ({
    roles,
    pagination: pagination || { ...defaultCompactSettings, count: roles?.length },
    isLoading: !loaded,
    groupId: groupUuid || uuid,
  });
  const { roles, pagination, isLoading, groupId, filters } = useSelector(rolesExcluded ? selectorRolesExluded : selector, shallowEqual);

  const { current: columns } = useRef([
    { title: intl.formatMessage(messages.name), key: 'display_name', ...(rolesExcluded ? { orderBy: 'name' } : { transforms: [sortable] }) },
    { title: intl.formatMessage(messages.description) },
  ]);

  const [filterValue, setFilterValue] = useState('');
  const [sortByState, setSortByState] = useState({ index: 1, direction: 'asc' });

  const setCheckedItems = (newSelection) => {
    setSelectedRoles((roles) => newSelection(roles).map(({ uuid, name, label }) => ({ uuid, label: label || name })));
  };

  const fetchRoles = useCallback(
    (groupId, config) =>
      rolesExcluded ? dispatch(fetchAddRolesForGroup(groupId, config)) : dispatch(fetchRolesWithPolicies(mappedProps({ ...config, chrome }))),
    [rolesExcluded],
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
                  {},
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
  groupId: PropTypes.string,
};

RolesList.defaultProps = {
  roles: [],
  pagination: defaultCompactSettings,
  canSort: true,
};

export default RolesList;
