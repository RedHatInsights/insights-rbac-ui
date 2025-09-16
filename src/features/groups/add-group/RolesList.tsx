import React, { useCallback, useEffect, useRef, useState } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { sortable } from '@patternfly/react-table';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import { defaultCompactSettings } from '../../../helpers/pagination';
import { mappedProps } from '../../../helpers/dataUtilities';
import { TableToolbarView } from '../../../components/tables/TableToolbarView';
import { fetchRolesWithPolicies } from '../../../redux/roles/actions';
import { fetchAddRolesForGroup } from '../../../redux/groups/actions';
import type { RBACStore } from '../../../redux/store.d';

interface Role {
  uuid: string;
  display_name?: string;
  name: string;
  description?: string;
}

interface RoleRow {
  uuid: string;
  cells: (string | undefined)[];
  selected: boolean;
}

interface RolesListProps {
  selectedRoles: Role[];
  setSelectedRoles: (roles: Role[]) => void;
  rolesExcluded?: boolean;
  groupId?: string;
}

const createRows = (data: Role[] | undefined, checkedRows: Role[] = []): RoleRow[] => {
  return data
    ? data.reduce<RoleRow[]>(
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

export const RolesList: React.FC<RolesListProps> = ({ selectedRoles, setSelectedRoles, rolesExcluded = false, groupId: groupUuid }) => {
  const chrome = useChrome();
  const dispatch = useDispatch();
  const textFilterRef = useRef<HTMLInputElement>(null);

  const selector = ({ roleReducer }: RBACStore) => ({
    roles: roleReducer?.roles?.data,
    pagination: roleReducer?.roles?.meta,
    isLoading: roleReducer?.isLoading,
    filters: roleReducer?.roles?.filters,
  });

  const { roles, pagination, isLoading } = useSelector(selector, shallowEqual);
  const [filterValue, setFilterValue] = useState<{ name?: string }>({ name: '' });

  const fetchData = useCallback(
    (apiProps: Record<string, unknown>) => {
      if (rolesExcluded && groupUuid) {
        return dispatch(fetchAddRolesForGroup(groupUuid, apiProps));
      } else {
        return dispatch(fetchRolesWithPolicies(mappedProps(apiProps)));
      }
    },
    [rolesExcluded, groupUuid, dispatch],
  );

  useEffect(() => {
    fetchData(defaultCompactSettings);
    chrome?.hideGlobalFilter?.(true);
    return () => chrome?.hideGlobalFilter?.(false);
  }, [fetchData, chrome]);

  const setCheckedItems = (newSelection: Role[]) => {
    setSelectedRoles(newSelection);
  };

  const columns = [
    {
      title: 'Role name',
      key: 'name',
      transforms: [sortable],
      props: { width: 20 },
    },
    {
      title: 'Description',
    },
  ];

  const roleRows = createRows(roles, selectedRoles);

  return (
    <TableToolbarView
      tableId="roles-list-table"
      columns={columns}
      isSelectable={true}
      isCompact={true}
      borders={false}
      data={roles}
      fetchData={(config: Record<string, unknown>) => {
        fetchData(config);
        // Focus the text filter after data fetch
        setTimeout(() => {
          textFilterRef?.current?.focus();
        }, 0);
      }}
      filterValue={filterValue as unknown as string | string[]}
      setFilterValue={({ name }: { name?: string }) => {
        setFilterValue({
          name: typeof name === 'undefined' ? filterValue.name : name,
        });
      }}
      isLoading={isLoading}
      pagination={pagination}
      checkedRows={selectedRoles}
      setCheckedItems={setCheckedItems}
      titlePlural="roles"
      titleSingular="role"
      emptyFilters={{ name: '' }}
      filters={[
        {
          key: 'name',
          value: filterValue.name,
          placeholder: 'Filter by role name',
          innerRef: textFilterRef,
        },
      ]}
      isFilterable={true}
      rows={roleRows}
      routes={() => null}
      toolbarButtons={() => []}
    />
  );
};
