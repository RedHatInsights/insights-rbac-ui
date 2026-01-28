import React, { Suspense, useMemo } from 'react';
import { Button, PageSection } from '@patternfly/react-core';
import { Outlet, useParams } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { TableView } from '../../components/table-view/TableView';
import { useTableState } from '../../components/table-view/hooks/useTableState';
import { DefaultEmptyStateNoData, DefaultEmptyStateNoResults } from '../../components/table-view/components/TableViewEmptyState';
import { isInventoryHostsPermission, isInventoryPermission } from './roleResourceDefinitionsTableHelpers';
import { PageLayout } from '../../components/layout/PageLayout';
import paths from '../../utilities/pathnames';
import { AppLink } from '../../components/navigation/AppLink';
import { useAppLink } from '../../hooks/useAppLink';
import { getBackRoute } from '../../helpers/navigation';
import { useRoleQuery } from '../../data/queries/roles';
import { processResourceDefinitions, useInventoryGroupsDetailsQuery } from '../../data/queries/inventory';
import messages from '../../Messages';
import type { ColumnConfigMap, FilterConfig } from '../../components/table-view/types';

interface ResourceDefinitionRow {
  id: string;
  value: string | null;
}

const COLUMNS = ['resource'] as const;

const RoleResourceDefinitions: React.FC = () => {
  const intl = useIntl();
  const { roleId, permissionId } = useParams<{ roleId: string; permissionId: string }>();
  const isInventory = useMemo(() => isInventoryPermission(permissionId!), [permissionId]);
  const isInventoryHosts = useMemo(() => isInventoryHostsPermission(permissionId!), [permissionId]);
  const toAppLink = useAppLink();

  // Fetch role data
  const { data: role, isLoading: isRoleLoading } = useRoleQuery(roleId ?? '');

  // Derive permission from role
  const permission = useMemo(() => role?.access?.find((a) => a.permission === permissionId) || {}, [role?.access, permissionId]);

  // Get inventory group IDs from resource definitions
  const inventoryGroupIds = useMemo(() => {
    if (!isInventory || !('resourceDefinitions' in permission)) return [];
    return processResourceDefinitions(permission.resourceDefinitions as never[]).filter(
      (id): id is string => typeof id === 'string' && id !== 'null',
    );
  }, [isInventory, permission]);

  // Fetch inventory group details (only for inventory permissions)
  const { data: inventoryGroupsData, isLoading: isLoadingInventoryDetails } = useInventoryGroupsDetailsQuery(inventoryGroupIds, {
    enabled: isInventory && inventoryGroupIds.length > 0,
  });

  // Convert inventory groups response to a lookup map
  const inventoryGroupsDetails = useMemo(() => {
    if (!inventoryGroupsData?.results) return {};
    return inventoryGroupsData.results.reduce<Record<string, { id: string; name: string }>>((acc, group) => {
      if (group.id && group.name) {
        acc[group.id] = { id: group.id, name: group.name };
      }
      return acc;
    }, {});
  }, [inventoryGroupsData]);

  // Process all data
  const allData = useMemo<ResourceDefinitionRow[]>(() => {
    if (isRoleLoading || (isInventory && isLoadingInventoryDetails)) return [];

    const resourceDefs = 'resourceDefinitions' in permission ? permission.resourceDefinitions : undefined;
    const processed = processResourceDefinitions(resourceDefs as never[]) as (string | null)[];
    return processed.map((item, index) => ({
      id: `${index}`,
      value: !isInventory || item == null ? item : (inventoryGroupsDetails?.[item]?.name ?? item),
    }));
  }, [permissionId, isRoleLoading, isLoadingInventoryDetails, permission, isInventory, inventoryGroupsDetails]);

  // Table state
  const tableState = useTableState({
    columns: COLUMNS,
    getRowId: (row: ResourceDefinitionRow) => row.id,
    initialPerPage: 20,
    initialFilters: { name: '' },
  });

  // Filter data based on filters
  const filteredData = useMemo(() => {
    const nameFilter = (tableState.filters.name as string) || '';
    return allData.filter((row) => (nameFilter ? row.value?.toLowerCase().includes(nameFilter.toLowerCase()) || row.value === null : true));
  }, [allData, tableState.filters.name]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const start = (tableState.page - 1) * tableState.perPage;
    return filteredData.slice(start, start + tableState.perPage);
  }, [filteredData, tableState.page, tableState.perPage]);

  const isLoading = isRoleLoading || (isInventory && isLoadingInventoryDetails);

  // Column config
  const columnConfig: ColumnConfigMap<typeof COLUMNS> = {
    resource: { label: intl.formatMessage(messages.resource) },
  };

  // Cell renderers
  const cellRenderers = {
    resource: (row: ResourceDefinitionRow) => {
      if (row.value === null && isInventoryHosts) {
        return intl.formatMessage(messages.ungroupedSystems);
      }
      return row.value;
    },
  };

  // Filter config
  const filterConfig: FilterConfig[] = [
    {
      type: 'search',
      id: 'name',
      placeholder: intl.formatMessage(messages.filterByKey, { key: intl.formatMessage(messages.resource).toLowerCase() }),
    },
  ];

  // Toolbar actions
  const toolbarActions = !role?.system ? (
    <AppLink to={paths['role-detail-permission-edit'].link.replace(':roleId', roleId!).replace(':permissionId', permissionId!)}>
      <Button variant="primary" aria-label="Edit">
        {intl.formatMessage(messages.edit)}
      </Button>
    </AppLink>
  ) : null;

  return (
    <PageLayout
      breadcrumbs={[
        {
          title: intl.formatMessage(messages.roles),
          // Construct URL string from getBackRoute's pathname and search
          to: (() => {
            const basePath = toAppLink(paths['roles'].link);
            // toAppLink returns string when passed a string
            const pathStr = typeof basePath === 'string' ? basePath : basePath.pathname || paths['roles'].link;
            const route = getBackRoute(pathStr, { limit: 20, offset: 0 }, {});
            return `${route.pathname}?${route.search}`;
          })(),
        },
        {
          title: isRoleLoading ? undefined : role && (role.display_name || role.name),
          // toAppLink returns string when passed a string, but TS needs help
          to: (() => {
            const link = toAppLink(paths['role-detail'].link.replace(':roleId', roleId!));
            return typeof link === 'string' ? link : link.pathname;
          })(),
        },
        { title: permissionId, isActive: true },
      ]}
      title={{ title: permissionId, description: intl.formatMessage(messages.definedResources) }}
    >
      <PageSection hasBodyWrapper={false}>
        <TableView
          columns={COLUMNS}
          columnConfig={columnConfig}
          data={isLoading ? undefined : paginatedData}
          totalCount={filteredData.length}
          getRowId={(row) => row.id}
          cellRenderers={cellRenderers}
          variant="compact"
          // Pagination
          page={tableState.page}
          perPage={tableState.perPage}
          onPageChange={tableState.onPageChange}
          onPerPageChange={tableState.onPerPageChange}
          // Filtering
          filterConfig={filterConfig}
          filters={tableState.filters}
          onFiltersChange={tableState.onFiltersChange}
          clearAllFilters={tableState.clearAllFilters}
          // Toolbar
          toolbarActions={toolbarActions}
          // Empty states
          emptyStateNoData={
            <DefaultEmptyStateNoData
              title={intl.formatMessage(messages.noMatchingItemsFound, { items: intl.formatMessage(messages.resources).toLowerCase() })}
            />
          }
          emptyStateNoResults={
            <DefaultEmptyStateNoResults
              title={intl.formatMessage(messages.noMatchingItemsFound, { items: intl.formatMessage(messages.resources).toLowerCase() })}
              body={intl.formatMessage(messages.tryChangingFilters)}
              onClearFilters={tableState.clearAllFilters}
            />
          }
          ouiaId="role-resource-definitions-table"
          ariaLabel={intl.formatMessage(messages.resourceDefinitions)}
        />
        <Suspense>
          <Outlet
            context={{
              cancelRoute: paths['role-detail-permission'].link.replace(':roleId', roleId!).replace(':permissionId', permissionId!),
            }}
          />
        </Suspense>
      </PageSection>
    </PageLayout>
  );
};

// Feature component (used by Routing.tsx) - both named and default exports
export { RoleResourceDefinitions };
export default RoleResourceDefinitions;
