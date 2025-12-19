import React, { Fragment, Suspense, useEffect, useMemo } from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Level } from '@patternfly/react-core';
import { LevelItem } from '@patternfly/react-core';
import { Text } from '@patternfly/react-core/dist/dynamic/components/Text';
import { TextContent } from '@patternfly/react-core/dist/dynamic/components/Text';
import { TextVariants } from '@patternfly/react-core/dist/dynamic/components/Text';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet, useParams } from 'react-router-dom';
import { TableView } from '../../components/table-view/TableView';
import { useTableState } from '../../components/table-view/hooks/useTableState';
import { DefaultEmptyStateNoData, DefaultEmptyStateNoResults } from '../../components/table-view/components/TableViewEmptyState';
import { isInventoryHostsPermission, isInventoryPermission } from './roleResourceDefinitionsTableHelpers';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageHeaderTitle } from '@redhat-cloud-services/frontend-components/PageHeader';
import { ToolbarTitlePlaceholder } from '../../components/ui-states/LoaderPlaceholders';
import { defaultSettings } from '../../helpers/pagination';
import { fetchRole } from '../../redux/roles/actions';
import paths from '../../utilities/pathnames';
import { AppLink } from '../../components/navigation/AppLink';
import { useAppLink } from '../../hooks/useAppLink';
import { getBackRoute } from '../../helpers/navigation';
import { useIntl } from 'react-intl';
import { fetchInventoryGroupsDetails } from '../../redux/inventory/actions';
import { processResourceDefinitions } from '../../redux/inventory/helper';
import messages from '../../Messages';
import type { RBACStore } from '../../redux/store.d';
import type { ColumnConfigMap, FilterConfig } from '../../components/table-view/types';
import './role-permissions.scss';

interface ResourceDefinitionRow {
  id: string;
  value: string | null;
}

const COLUMNS = ['resource'] as const;

const RoleResourceDefinitions: React.FC = () => {
  const intl = useIntl();
  const dispatch = useDispatch();

  const { roleId, permissionId } = useParams<{ roleId: string; permissionId: string }>();
  const isInventory = useMemo(() => isInventoryPermission(permissionId!), [permissionId]);
  const isInventoryHosts = useMemo(() => isInventoryHostsPermission(permissionId!), [permissionId]);
  const toAppLink = useAppLink();

  // Use individual selectors to avoid creating new object references on each render
  const role = useSelector((state: RBACStore) => state.roleReducer.selectedRole);
  const isRoleLoading = useSelector((state: RBACStore) => state.roleReducer.isRecordLoading);
  const rolesPagination = useSelector((state: RBACStore) => state.roleReducer?.roles?.pagination) || defaultSettings;
  const rolesFilters = useSelector((state: RBACStore) => state.roleReducer?.roles?.filters) || {};
  const inventoryGroupsDetails = useSelector((state: RBACStore) => state.inventoryReducer?.inventoryGroupsDetails);
  const isLoadingInventoryDetails = useSelector((state: RBACStore) => state.inventoryReducer?.isLoading);

  // Derive permission from role - memoized to avoid creating new object references
  const permission = useMemo(
    () => role?.access?.find((a: { permission: string }) => a.permission === permissionId) || {},
    [role?.access, permissionId],
  );

  const fetchInventoryGroupNames = (inventoryGroupsIds: string[]) =>
    dispatch(fetchInventoryGroupsDetails(inventoryGroupsIds) as unknown as { type: string });

  const fetchData = () => {
    (
      dispatch(fetchRole(roleId!) as unknown as { type: string }) as unknown as Promise<{
        value: { access: { permission: string; resourceDefinitions: unknown[] }[] };
      }>
    ).then(({ value }) => {
      if (isInventory) {
        const resourceDefs = value?.access?.find((item) => item.permission === permissionId)?.resourceDefinitions;
        fetchInventoryGroupNames(processResourceDefinitions(resourceDefs as unknown as never[]) as unknown as string[]);
      }
    });
  };

  useEffect(() => {
    fetchData();
  }, [roleId]);

  // Process all data
  const allData = useMemo<ResourceDefinitionRow[]>(() => {
    if (isRoleLoading || isLoadingInventoryDetails) return [];

    const processed = processResourceDefinitions((permission as { resourceDefinitions?: never[] }).resourceDefinitions) as (string | null)[];
    return processed.map((item, index) => ({
      id: `${index}`,
      value: !isInventory || item == null ? item : ((inventoryGroupsDetails?.[item]?.name as string | null) ?? item),
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
    <Fragment>
      <PageLayout
        breadcrumbs={[
          {
            title: intl.formatMessage(messages.roles),
            to: getBackRoute(
              toAppLink(paths['roles'].link) as string,
              rolesPagination as { limit: number; offset: number },
              rolesFilters,
            ) as unknown as string,
          },
          {
            title: isRoleLoading ? undefined : role && (role.display_name || role.name),
            to: toAppLink(paths['role-detail'].link.replace(':roleId', roleId!)) as string,
          },
          { title: permissionId, isActive: true },
        ]}
      >
        <Level>
          <LevelItem>
            <PageHeaderTitle title={permissionId || <ToolbarTitlePlaceholder />} className="rbac-page-header__title" />
          </LevelItem>
        </Level>
      </PageLayout>
      <section className="pf-v5-c-page__main-section rbac-c-role__permissions">
        <TextContent>
          <Text component={TextVariants.h1}>{intl.formatMessage(messages.definedResources)}</Text>
        </TextContent>
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
          hasActiveFilters={tableState.hasActiveFilters}
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
      </section>
    </Fragment>
  );
};

// Feature component (used by Routing.tsx) - both named and default exports
export { RoleResourceDefinitions };
export default RoleResourceDefinitions;
