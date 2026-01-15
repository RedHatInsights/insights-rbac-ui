import React, { useEffect, useMemo, useState } from 'react';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import useFieldApi from '@data-driven-forms/react-form-renderer/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import usePermissions from '@redhat-cloud-services/frontend-components-utilities/RBACHook';
import { useIntl } from 'react-intl';
import { TableView } from '../../../components/table-view/TableView';
import { useTableState } from '../../../components/table-view/hooks/useTableState';
import { DefaultEmptyStateNoData, DefaultEmptyStateNoResults } from '../../../components/table-view/components/TableViewEmptyState';
import { useExpandSplatsQuery, usePermissionOptionsQuery, usePermissionsQuery } from '../../../data/queries/permissions';
import { useResourceTypesQuery } from '../../../data/queries/cost';
import { useRoleQuery } from '../../../data/queries/roles';
import messages from '../../../Messages';
import type { ColumnConfigMap, FilterConfig } from '../../../components/table-view/types';

interface Permission {
  application: string;
  resource: string;
  operation: string;
  uuid: string;
  requires?: string[];
}

interface SelectedPermission {
  uuid: string;
  requires?: string[];
  application?: string;
}

interface ResourceType {
  value: string;
  count?: number;
}

interface AddPermissionsTableProps {
  selectedPermissions: SelectedPermission[];
  setSelectedPermissions: (fn: (prev: SelectedPermission[]) => SelectedPermission[] | SelectedPermission[]) => void;
  name: string;
  [key: string]: unknown;
}

const COLUMNS = ['application', 'resourceType', 'operation'] as const;

const AddPermissionsTable: React.FC<AddPermissionsTableProps> = ({ selectedPermissions, setSelectedPermissions, ...props }) => {
  const [isOrgAdmin, setIsOrgAdmin] = useState<boolean | null>(null);
  const [basePermissionsLoaded, setBasePermissionsLoaded] = useState(false);
  const { auth } = useChrome();
  const intl = useIntl();
  const { hasAccess: hasCostAccess } = usePermissions('cost-management', ['cost-management:*:*']);
  const { hasAccess: hasRbacAccess } = usePermissions('rbac', ['rbac:*:*']);

  const { input } = useFieldApi(props as { name: string });
  const formOptions = useFormApi();
  const roleType = formOptions.getState().values['role-type'];
  const existingRoleId = formOptions.getState().values['role-uuid'] as string | undefined;
  const copyBaseRole = formOptions.getState().values['copy-base-role'] as { uuid?: string } | undefined;

  // Table state for pagination and filters
  const tableState = useTableState({
    columns: COLUMNS,
    getRowId: (row: Permission) => row.uuid,
    initialPerPage: 20,
    initialFilters: { applications: [] as string[], resources: [] as string[], operations: [] as string[] },
  });

  const filters = tableState.filters as { applications: string[]; resources: string[]; operations: string[] };

  // Check org admin status
  useEffect(() => {
    const setOrgAdminStatus = async () => {
      const userData = await auth.getUser();
      if (userData && 'identity' in userData) {
        setIsOrgAdmin((userData as { identity: { user: { is_org_admin: boolean } } }).identity.user.is_org_admin);
      }
    };
    if (auth) {
      setOrgAdminStatus();
    }
  }, [auth]);

  // Initialize form state
  useEffect(() => {
    formOptions.change('has-cost-resources', false);
  }, []);

  const inventoryAccess = useMemo(() => isOrgAdmin || (hasRbacAccess ?? false), [hasRbacAccess, isOrgAdmin]);

  // ============================================================================
  // TanStack Query Hooks
  // ============================================================================

  // Main permissions query
  const { data: permissionsData, isLoading: isLoadingPermissions } = usePermissionsQuery({
    limit: tableState.perPage,
    offset: (tableState.page - 1) * tableState.perPage,
    application: filters.applications.join(',') || undefined,
    resourceType: filters.resources.join(',') || undefined,
    verb: filters.operations.join(',') || undefined,
    excludeGlobals: true,
    excludeRoles: existingRoleId,
    allowedOnly: true,
  });

  // Filter options queries
  const { data: applicationOptionsData } = usePermissionOptionsQuery({
    field: 'application',
    limit: 50,
    application: filters.applications.join(',') || undefined,
    resourceType: filters.resources.join(',') || undefined,
    verb: filters.operations.join(',') || undefined,
    allowedOnly: true,
  });

  const { data: resourceOptionsData } = usePermissionOptionsQuery({
    field: 'resource_type',
    limit: 50,
    application: filters.applications.join(',') || undefined,
    resourceType: filters.resources.join(',') || undefined,
    verb: filters.operations.join(',') || undefined,
    allowedOnly: true,
  });

  const { data: operationOptionsData } = usePermissionOptionsQuery({
    field: 'verb',
    limit: 50,
    application: filters.applications.join(',') || undefined,
    resourceType: filters.resources.join(',') || undefined,
    verb: filters.operations.join(',') || undefined,
    allowedOnly: true,
  });

  // Cost resource types query (for checking if cost permissions are available)
  const { data: resourceTypesData } = useResourceTypesQuery({ enabled: hasCostAccess ?? false });

  // Base role query (for copy mode)
  const { data: baseRole, isLoading: isLoadingBaseRole } = useRoleQuery(copyBaseRole?.uuid ?? '', {
    enabled: roleType === 'copy' && !!copyBaseRole?.uuid,
  });

  // Expand splats query (for copy mode - expand wildcard permissions)
  const expandSplatsApplications = useMemo(() => {
    if (!baseRole?.access) return '';
    return [...new Set(baseRole.access.map(({ permission }) => permission.split(':')[0]))].join(',');
  }, [baseRole?.access]);

  const { data: expandSplatsData, isLoading: isLoadingExpandSplats } = useExpandSplatsQuery(
    { application: expandSplatsApplications || undefined },
    { enabled: roleType === 'copy' && !!expandSplatsApplications && !basePermissionsLoaded },
  );

  // ============================================================================
  // Derived Data
  // ============================================================================

  const permissions: Permission[] = useMemo(
    () =>
      (permissionsData?.data || []).map(({ application, resource_type, verb, permission, requires }) => ({
        application: application || '',
        resource: resource_type || '',
        operation: verb || '',
        uuid: permission,
        requires,
      })),
    [permissionsData],
  );

  const pagination = {
    count: permissionsData?.meta?.count || 0,
    limit: permissionsData?.meta?.limit || 20,
    offset: permissionsData?.meta?.offset || 0,
  };

  const applicationOptions = useMemo(() => (applicationOptionsData?.data || []).filter((app) => app !== '*'), [applicationOptionsData]);

  const resourceOptions = useMemo(() => (resourceOptionsData?.data || []).filter((res) => res !== '*'), [resourceOptionsData]);

  const operationOptions = useMemo(() => (operationOptionsData?.data || []).filter((op) => op !== '*'), [operationOptionsData]);

  const resourceTypes: ResourceType[] = useMemo(() => (resourceTypesData?.data || []) as ResourceType[], [resourceTypesData]);

  const expandedPermissions = useMemo(() => (expandSplatsData?.data || []).map(({ permission }) => permission), [expandSplatsData]);

  const isLoading = isLoadingPermissions || isLoadingBaseRole;

  const getResourceType = (permission: string) => resourceTypes.find((r) => r.value === permission.split(':')?.[1]);

  // ============================================================================
  // Copy Mode: Auto-select base role permissions
  // ============================================================================

  useEffect(() => {
    if (
      !baseRole ||
      roleType !== 'copy' ||
      basePermissionsLoaded ||
      selectedPermissions.length > 0 ||
      copyBaseRole?.uuid !== baseRole?.uuid ||
      isLoadingExpandSplats ||
      isLoading
    ) {
      return;
    }

    const notAllowed: { permission: string }[] = [];
    const basePermissionsList =
      baseRole?.access?.filter((item) => {
        if (applicationOptions.includes(item?.permission?.split(':')[0])) {
          return true;
        }
        notAllowed.push(item);
        return false;
      }) || [];

    formOptions.change(
      'not-allowed-permissions',
      notAllowed.map(({ permission }) => permission),
    );

    if (expandedPermissions.length > 0) {
      const patterns = basePermissionsList.map(({ permission }) => permission.replace('*', '.*'));
      setSelectedPermissions(() =>
        expandedPermissions
          .filter((p) => p.split(':')[0] !== 'cost-management' || (getResourceType(p)?.count || 0) !== 0)
          .filter((p) => patterns.some((f) => p.match(f)))
          .map((permission) => ({ uuid: permission })),
      );
      setBasePermissionsLoaded(true);
      formOptions.change('base-permissions-loaded', true);
    }
  }, [
    baseRole,
    roleType,
    basePermissionsLoaded,
    selectedPermissions.length,
    copyBaseRole?.uuid,
    isLoadingExpandSplats,
    isLoading,
    expandedPermissions,
    applicationOptions,
    resourceTypes,
  ]);

  // Sync selected permissions to form
  // Note: `input` is intentionally excluded from deps as it's unstable but onChange is stable
  useEffect(() => {
    input.onChange(selectedPermissions);
  }, [selectedPermissions]);

  // ============================================================================
  // Selection Handlers
  // ============================================================================

  const handleSelectRow = (row: Permission, selected: boolean) => {
    const application = row.application;
    const isDisabled =
      (application === 'cost-management' && ((getResourceType(row.uuid)?.count || 0) === 0 || !hasCostAccess)) ||
      (application === 'inventory' && !inventoryAccess);

    if (isDisabled) return;

    if (selected) {
      setSelectedPermissions((prev) => [...prev, { uuid: row.uuid, requires: row.requires }]);
    } else {
      setSelectedPermissions((prev) => prev.filter((p) => p.uuid !== row.uuid));
    }
  };

  const handleSelectAll = (selected: boolean, rows: Permission[]) => {
    if (selected) {
      const newSelected = rows
        .filter((row) => {
          const application = row.application;
          const isDisabled =
            (application === 'cost-management' && ((getResourceType(row.uuid)?.count || 0) === 0 || !hasCostAccess)) ||
            (application === 'inventory' && !inventoryAccess);
          return !isDisabled;
        })
        .map((row) => ({ uuid: row.uuid, requires: row.requires }));

      setSelectedPermissions((prev) => {
        const existingUuids = new Set(prev.map((p) => p.uuid));
        const toAdd = newSelected.filter((p) => !existingUuids.has(p.uuid));
        return [...prev, ...toAdd];
      });
    } else {
      const rowUuids = new Set(rows.map((r) => r.uuid));
      setSelectedPermissions((prev) => prev.filter((p) => !rowUuids.has(p.uuid)));
    }
  };

  const isRowSelectable = (row: Permission) => {
    const application = row.application;
    return !(
      (application === 'cost-management' && ((getResourceType(row.uuid)?.count || 0) === 0 || !hasCostAccess)) ||
      (application === 'inventory' && !inventoryAccess)
    );
  };

  // ============================================================================
  // Filter Handlers
  // ============================================================================

  const handleFiltersChange = (newFilters: Record<string, string | string[]>) => {
    tableState.onFiltersChange(newFilters);
    tableState.onPageChange(1); // Reset to first page on filter change
  };

  const clearAllFilters = () => {
    tableState.clearAllFilters();
    tableState.onPageChange(1);
  };

  // ============================================================================
  // Table Configuration
  // ============================================================================

  const columnConfig: ColumnConfigMap<typeof COLUMNS> = {
    application: { label: intl.formatMessage(messages.application) },
    resourceType: { label: intl.formatMessage(messages.resourceType) },
    operation: { label: intl.formatMessage(messages.operation) },
  };

  const cellRenderers = {
    application: (row: Permission) => row.application,
    resourceType: (row: Permission) => row.resource,
    operation: (row: Permission) => row.operation,
  };

  const filterConfig: FilterConfig[] = [
    {
      type: 'checkbox',
      id: 'applications',
      label: intl.formatMessage(messages.application),
      options: applicationOptions.map((app) => ({ id: app, label: app })),
    },
    {
      type: 'checkbox',
      id: 'resources',
      label: intl.formatMessage(messages.resourceType),
      options: resourceOptions.map((res) => ({ id: res, label: res })),
    },
    {
      type: 'checkbox',
      id: 'operations',
      label: intl.formatMessage(messages.operation),
      options: operationOptions.map((op) => ({ id: op, label: op })),
    },
  ];

  const selectedRowsForTable = useMemo(
    () => permissions.filter((p) => selectedPermissions.some((sp) => sp.uuid === p.uuid)),
    [permissions, selectedPermissions],
  );

  return (
    <div className="rbac-c-permissions-table">
      <TableView
        columns={COLUMNS}
        columnConfig={columnConfig}
        data={isLoading || isLoadingExpandSplats ? undefined : permissions}
        totalCount={pagination.count}
        getRowId={(row) => row.uuid}
        cellRenderers={cellRenderers}
        variant="compact"
        // Pagination
        page={tableState.page}
        perPage={tableState.perPage}
        onPageChange={tableState.onPageChange}
        onPerPageChange={(newPerPage) => {
          tableState.onPerPageChange(newPerPage);
          tableState.onPageChange(1);
        }}
        // Selection
        selectable={true}
        selectedRows={selectedRowsForTable}
        onSelectRow={handleSelectRow}
        onSelectAll={handleSelectAll}
        isRowSelectable={isRowSelectable}
        // Filtering
        filterConfig={filterConfig}
        filters={tableState.filters}
        onFiltersChange={handleFiltersChange}
        clearAllFilters={clearAllFilters}
        // Empty states
        emptyStateNoData={
          <DefaultEmptyStateNoData
            title={intl.formatMessage(messages.noPermissions)}
            body={intl.formatMessage(messages.permissionNotDisplayedDescription)}
          />
        }
        emptyStateNoResults={
          <DefaultEmptyStateNoResults
            title={intl.formatMessage(messages.noMatchingItemsFound, { items: intl.formatMessage(messages.permissions).toLowerCase() })}
            body={intl.formatMessage(messages.tryChangingFilters)}
            onClearFilters={clearAllFilters}
          />
        }
        ouiaId="add-role-permissions"
        ariaLabel={intl.formatMessage(messages.permissions)}
      />
    </div>
  );
};

export default AddPermissionsTable;
