import React, { Fragment, useCallback, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';

import { TableView, useTableState } from '../../../../../components/table-view';
import type { CellRendererMap, ColumnConfigMap, FilterConfig } from '../../../../../components/table-view/types';
import { defaultSettings } from '../../../../../helpers/pagination';
import { mappedProps } from '../../../../../helpers/dataUtilities';
import { fetchRolesWithPolicies } from '../../../../../redux/roles/actions';
import { fetchAddRolesForGroup } from '../../../../../redux/groups/actions';
import { selectIsRolesLoading, selectRoles, selectRolesMeta } from '../../../../../redux/roles/selectors';
import { RolesListEmptyState } from './RolesListEmptyState';
import type { RBACStore } from '../../../../../redux/store';
import { createSelector } from 'reselect';

// Memoized selectors for addRoles data from groups reducer (when rolesExcluded=true)
const selectGroupReducer = (state: RBACStore) => state.groupReducer;
const selectSelectedGroup = createSelector([selectGroupReducer], (groupReducer) => groupReducer?.selectedGroup);
const selectAddRoles = createSelector([selectSelectedGroup], (selectedGroup) => selectedGroup?.addRoles);

const selectAddRolesForGroup = createSelector([selectAddRoles], (addRoles) => addRoles?.roles || []);
const selectAddRolesMetaForGroup = createSelector([selectAddRoles], (addRoles) => addRoles?.pagination || { count: 0 });
const selectAddRolesLoading = createSelector([selectAddRoles], (addRoles) => !addRoles?.loaded);

// Types
interface Role {
  uuid: string;
  display_name?: string;
  name: string;
  description?: string;
}

interface RolesListProps {
  initialSelectedRoles: Role[];
  onSelect: (selectedRoles: Role[]) => void;
  rolesExcluded?: boolean;
  groupId?: string;
  usesMetaInURL?: boolean;
}

// Column definitions
const columns = ['name', 'description'] as const;

export const RolesList: React.FC<RolesListProps> = ({ initialSelectedRoles, onSelect, rolesExcluded = false, groupId, usesMetaInURL = false }) => {
  const chrome = useChrome();
  const dispatch = useDispatch();

  // Redux selectors - use different selectors based on whether we're fetching excluded roles
  const rolesFromRolesReducer = useSelector(selectRoles);
  const metaFromRolesReducer = useSelector(selectRolesMeta);
  const isLoadingFromRolesReducer = useSelector(selectIsRolesLoading);

  const rolesFromGroupsReducer = useSelector(selectAddRolesForGroup);
  const metaFromGroupsReducer = useSelector(selectAddRolesMetaForGroup);
  const isLoadingFromGroupsReducer = useSelector(selectAddRolesLoading);

  // Select correct data source based on rolesExcluded flag
  const roles = rolesExcluded && groupId ? rolesFromGroupsReducer : rolesFromRolesReducer;
  const meta = rolesExcluded && groupId ? metaFromGroupsReducer : metaFromRolesReducer;
  const isLoading = rolesExcluded && groupId ? isLoadingFromGroupsReducer : isLoadingFromRolesReducer;
  const totalCount = meta.count || 0;

  // Column configuration
  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      name: { label: 'Name' },
      description: { label: 'Description' },
    }),
    [],
  );

  // Filter configuration
  const filterConfig: FilterConfig[] = useMemo(() => [{ id: 'name', label: 'Role name', type: 'text', placeholder: 'Filter by role name' }], []);

  // Handle data fetching via onStaleData
  const handleStaleData = useCallback(
    (params: { offset: number; limit: number; orderBy?: string; filters: Record<string, string | string[]> }) => {
      const nameFilter = params.filters.name as string | undefined;

      if (rolesExcluded && groupId) {
        // Group-specific roles fetching
        dispatch(
          fetchAddRolesForGroup(groupId, {
            limit: params.limit,
            offset: params.offset,
            ...(nameFilter && nameFilter.trim() ? { name: nameFilter } : {}),
          }),
        );
      } else {
        // General roles fetching
        dispatch(
          fetchRolesWithPolicies(
            mappedProps({
              limit: params.limit,
              offset: params.offset,
              usesMetaInURL,
              ...(nameFilter && nameFilter.trim() ? { filters: { name: nameFilter } } : {}),
            }),
          ),
        );
      }
    },
    [dispatch, rolesExcluded, groupId, usesMetaInURL],
  );

  // useTableState for all state management
  const tableState = useTableState<typeof columns, Role>({
    columns,
    initialPerPage: defaultSettings.limit || 20,
    perPageOptions: [10, 20, 50, 100],
    getRowId: (role) => role.uuid,
    initialSelectedRows: initialSelectedRoles,
    onStaleData: handleStaleData,
  });

  // Propagate selection changes to parent
  useEffect(() => {
    onSelect(tableState.selectedRows);
  }, [tableState.selectedRows, onSelect]);

  // Chrome global filter setup
  useEffect(() => {
    chrome?.hideGlobalFilter?.(true);
    return () => chrome?.hideGlobalFilter?.(false);
  }, [chrome]);

  // Cell renderers
  const cellRenderers: CellRendererMap<typeof columns, Role> = useMemo(
    () => ({
      name: (role) => role.display_name || role.name,
      description: (role) => role.description || '—',
    }),
    [],
  );

  return (
    <Fragment>
      <TableView<typeof columns, Role>
        columns={columns}
        columnConfig={columnConfig}
        data={isLoading ? undefined : roles}
        totalCount={totalCount}
        getRowId={(role) => role.uuid}
        cellRenderers={cellRenderers}
        filterConfig={filterConfig}
        selectable
        emptyStateNoData={<RolesListEmptyState hasActiveFilters={false} />}
        emptyStateNoResults={<RolesListEmptyState hasActiveFilters={true} />}
        variant="compact"
        ariaLabel="Roles list table"
        ouiaId="roles-list-table"
        {...tableState}
      />
    </Fragment>
  );
};
