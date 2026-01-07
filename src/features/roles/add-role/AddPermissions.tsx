import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import useFieldApi from '@data-driven-forms/react-form-renderer/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { debounceAsync } from '../../../utilities/debounce';
import usePermissions from '@redhat-cloud-services/frontend-components-utilities/RBACHook';
import { TableView } from '../../../components/table-view/TableView';
import { useTableState } from '../../../components/table-view/hooks/useTableState';
import { DefaultEmptyStateNoData, DefaultEmptyStateNoResults } from '../../../components/table-view/components/TableViewEmptyState';
import { expandSplats, listPermissionOptions, listPermissions, resetExpandSplats } from '../../../redux/permissions/actions';
import { fetchResourceDefinitions } from '../../../redux/cost-management/actions';
import { fetchRole } from '../../../redux/roles/actions';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';
import type { RBACStore } from '../../../redux/store.d';
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
  count: number;
}

interface AddPermissionsTableProps {
  selectedPermissions: SelectedPermission[];
  setSelectedPermissions: (fn: (prev: SelectedPermission[]) => SelectedPermission[] | SelectedPermission[]) => void;
  name: string;
  [key: string]: unknown;
}

const COLUMNS = ['application', 'resourceType', 'operation'] as const;

// Input selectors - extract raw data from store
const selectPermissionData = (state: RBACStore) => state.permissionReducer.permission;
const selectIsLoading = (state: RBACStore) => state.permissionReducer.isLoading;
const selectApplicationOptions = (state: RBACStore) => state.permissionReducer.options.application;
const selectResourceOptions = (state: RBACStore) => state.permissionReducer.options.resource;
const selectOperationOptions = (state: RBACStore) => state.permissionReducer.options.operation;
const selectExpandSplatsData = (state: RBACStore) => state.permissionReducer.expandSplats;
const selectIsLoadingExpandSplats = (state: RBACStore) => state.permissionReducer.isLoadingExpandSplats;
const selectIsRecordLoading = (state: RBACStore) => state.roleReducer.isRecordLoading;
const selectSelectedRole = (state: RBACStore) => state.roleReducer.selectedRole;
const selectResourceTypes = (state: RBACStore) => state.costReducer.resourceTypes;

// Memoized selector - only recomputes when inputs change
const selector = createSelector(
  [
    selectPermissionData,
    selectIsLoading,
    selectApplicationOptions,
    selectResourceOptions,
    selectOperationOptions,
    selectExpandSplatsData,
    selectIsLoadingExpandSplats,
    selectIsRecordLoading,
    selectSelectedRole,
    selectResourceTypes,
  ],
  (
    permission,
    isLoading,
    application,
    resource,
    operation,
    expandSplatsData,
    isLoadingExpandSplats,
    isRecordLoading,
    selectedRole,
    resourceTypes,
  ) => ({
    permissions: (
      (permission as { data?: { application?: string; resource_type?: string; verb?: string; permission?: string; requires?: string[] }[] })?.data ||
      []
    ).map(({ application, resource_type: resource, verb, permission: perm, requires } = {}) => ({
      application: application || '',
      resource: resource || '',
      operation: verb || '',
      uuid: perm || '',
      requires,
    })) as Permission[],
    pagination: (permission as { meta?: { count?: number; limit?: number; offset?: number } })?.meta || { count: 0, limit: 20, offset: 0 },
    isLoading: isLoading || isRecordLoading,
    baseRole: selectedRole as { uuid?: string; access?: { permission: string }[] } | undefined,
    applicationOptions: ((application as { data?: string[] })?.data || []).filter((app: string) => app !== '*'),
    resourceOptions: ((resource as { data?: string[] })?.data || []).filter((app: string) => app !== '*'),
    operationOptions: ((operation as { data?: string[] })?.data || []).filter((app: string) => app !== '*'),
    expandedPermissions: ((expandSplatsData as { data?: { permission: string }[] })?.data || []).map(({ permission }) => permission),
    isLoadingExpandSplats,
    resourceTypes: ((resourceTypes as unknown as { data?: ResourceType[] })?.data || []) as ResourceType[],
  }),
);

const AddPermissionsTable: React.FC<AddPermissionsTableProps> = ({ selectedPermissions, setSelectedPermissions, ...props }) => {
  const [isOrgAdmin, setIsOrgAdmin] = useState<boolean | null>(null);
  const { auth } = useChrome();
  const dispatch = useDispatch();
  const intl = useIntl();
  const { hasAccess: hasCostAccess } = usePermissions('cost-management', ['cost-management:*:*']);
  const { hasAccess: hasRbacAccess } = usePermissions('rbac', ['rbac:*:*']);

  useEffect(() => {
    const setOrgAdmin = async () => {
      const userData = await auth.getUser();
      if (userData && 'identity' in userData) {
        setIsOrgAdmin((userData as { identity: { user: { is_org_admin: boolean } } }).identity.user.is_org_admin);
      }
    };
    if (auth) {
      setOrgAdmin();
    }
  }, [auth]);

  const {
    permissions,
    isLoading,
    pagination,
    baseRole,
    applicationOptions,
    resourceOptions,
    operationOptions,
    expandedPermissions,
    isLoadingExpandSplats,
    resourceTypes,
  } = useSelector(selector);
  const { input } = useFieldApi(props as { name: string });
  const formOptions = useFormApi();
  const roleType = formOptions.getState().values['role-type'];
  const existingRoleId = formOptions.getState().values['role-uuid'] as string | undefined;

  const inventoryAccess = useMemo(() => isOrgAdmin || (hasRbacAccess ?? false), [hasRbacAccess, isOrgAdmin]);

  const getResourceType = (permission: string) => resourceTypes.find((r) => r.value === permission.split(':')?.[1]);

  const fetchData = (apiProps: Record<string, unknown>) =>
    dispatch(
      listPermissions({
        ...apiProps,
        ...(existingRoleId ? { exclude_roles: existingRoleId } : {}),
        allowed_only: true,
      }) as unknown as { type: string },
    );
  const fetchOptions = (apiProps: Record<string, unknown>) =>
    dispatch(
      listPermissionOptions({ field: 'application', ...apiProps, allowedOnly: true } as unknown as Parameters<
        typeof listPermissionOptions
      >[0]) as unknown as { type: string },
    );

  // Table state
  const tableState = useTableState({
    columns: COLUMNS,
    getRowId: (row: Permission) => row.uuid,
    initialPerPage: 20,
    initialFilters: { applications: [] as string[], resources: [] as string[], operations: [] as string[] },
  });

  const debouncedGetApplicationOptions = useCallback(
    debounceAsync(
      ({ applications, resources, operations }: { applications: string[]; resources: string[]; operations: string[] }) =>
        fetchOptions({
          field: 'application',
          limit: 50,
          application: applications.join(),
          resourceType: resources.join(),
          verb: operations.join(),
        }) as unknown as Promise<unknown>,
    ),
    [],
  );
  const debouncedGetResourceOptions = useCallback(
    debounceAsync(
      ({ applications, resources, operations }: { applications: string[]; resources: string[]; operations: string[] }) =>
        fetchOptions({
          field: 'resource_type',
          limit: 50,
          application: applications.join(),
          resourceType: resources.join(),
          verb: operations.join(),
        }) as unknown as Promise<unknown>,
    ),
    [],
  );
  const debouncedGetOperationOptions = useCallback(
    debounceAsync(
      ({ applications, resources, operations }: { applications: string[]; resources: string[]; operations: string[] }) =>
        fetchOptions({
          field: 'verb',
          limit: 50,
          application: applications.join(),
          resourceType: resources.join(),
          verb: operations.join(),
        }) as unknown as Promise<unknown>,
    ),
    [],
  );

  useEffect(() => {
    const baseRoleUuid = (formOptions.getState().values['copy-base-role'] as { uuid?: string })?.uuid;
    if (roleType === 'copy' && baseRoleUuid) {
      dispatch(fetchRole(baseRoleUuid) as unknown as { type: string });
    }

    formOptions.change('has-cost-resources', false);
    fetchData(pagination);
    fetchOptions({ field: 'application', limit: 50 });
    fetchOptions({ field: 'resource_type', limit: 50 });
    fetchOptions({ field: 'verb', limit: 50 });

    return () => {
      dispatch(resetExpandSplats() as unknown as { type: string });
    };
  }, []);

  useEffect(() => {
    hasCostAccess && dispatch(fetchResourceDefinitions({}) as unknown as { type: string });
  }, [hasCostAccess]);

  const filters = tableState.filters as { applications: string[]; resources: string[]; operations: string[] };

  useEffect(() => {
    debouncedGetResourceOptions(filters);
    debouncedGetOperationOptions(filters);
  }, [filters.applications]);

  useEffect(() => {
    debouncedGetApplicationOptions(filters);
    debouncedGetOperationOptions(filters);
  }, [filters.resources]);

  useEffect(() => {
    debouncedGetApplicationOptions(filters);
    debouncedGetResourceOptions(filters);
  }, [filters.operations]);

  useEffect(() => {
    input.onChange(selectedPermissions);
  }, [selectedPermissions]);

  useEffect(() => {
    if (
      !baseRole ||
      roleType !== 'copy' ||
      formOptions.getState().values['base-permissions-loaded'] ||
      selectedPermissions.length > 0 ||
      (formOptions.getState().values['copy-base-role'] as { uuid?: string })?.uuid !== baseRole?.uuid ||
      isLoadingExpandSplats ||
      isLoading
    ) {
      return;
    }

    const notAllowed: { permission: string }[] = [];

    const basePermissions =
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
    if (expandedPermissions.length === 0 && typeof isLoadingExpandSplats === 'undefined') {
      const applications = [...new Set(basePermissions.map(({ permission }) => permission.split(':')[0]))];
      dispatch(expandSplats({ application: applications.join() }) as unknown as { type: string });
    } else {
      const patterns = basePermissions.map(({ permission }) => permission.replace('*', '.*'));
      setSelectedPermissions(() =>
        expandedPermissions
          .filter((p) => p.split(':')[0] !== 'cost-management' || (getResourceType(p) || { count: 0 }).count !== 0)
          .filter((p) => patterns.some((f) => p.match(f)))
          .map((permission) => ({ uuid: permission })),
      );
      formOptions.change('base-permissions-loaded', true);
    }
  }, [permissions, baseRole]);

  // Handle selection change
  const handleSelectRow = (row: Permission, selected: boolean) => {
    // Check if this permission can be selected
    const application = row.application;
    const isDisabled =
      (application === 'cost-management' && ((getResourceType(row.uuid) || { count: 0 }).count === 0 || !hasCostAccess)) ||
      (application === 'inventory' && !inventoryAccess);

    if (isDisabled) return;

    if (selected) {
      const newSelected = [...selectedPermissions, { uuid: row.uuid, requires: row.requires }];
      setSelectedPermissions(() => newSelected);
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
            (application === 'cost-management' && ((getResourceType(row.uuid) || { count: 0 }).count === 0 || !hasCostAccess)) ||
            (application === 'inventory' && !inventoryAccess);
          return !isDisabled;
        })
        .map((row) => ({ uuid: row.uuid, requires: row.requires }));

      // Merge with existing selections, avoiding duplicates
      setSelectedPermissions((prev) => {
        const existingUuids = new Set(prev.map((p) => p.uuid));
        const toAdd = newSelected.filter((p) => !existingUuids.has(p.uuid));
        return [...prev, ...toAdd];
      });
    } else {
      // Remove all rows on current page from selection
      const rowUuids = new Set(rows.map((r) => r.uuid));
      setSelectedPermissions((prev) => prev.filter((p) => !rowUuids.has(p.uuid)));
    }
  };

  // Check if row is selectable
  const isRowSelectable = (row: Permission) => {
    const application = row.application;
    return !(
      (application === 'cost-management' && ((getResourceType(row.uuid) || { count: 0 }).count === 0 || !hasCostAccess)) ||
      (application === 'inventory' && !inventoryAccess)
    );
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters: Record<string, string | string[]>) => {
    tableState.onFiltersChange(newFilters);

    const nextApplications = (newFilters.applications as string[]) || [];
    const nextResources = (newFilters.resources as string[]) || [];
    const nextOperations = (newFilters.operations as string[]) || [];

    fetchData({
      limit: pagination.limit,
      offset: 0,
      application: nextApplications.join(),
      resourceType: nextResources.join(),
      verb: nextOperations.join(),
    });
  };

  // Column config
  const columnConfig: ColumnConfigMap<typeof COLUMNS> = {
    application: { label: intl.formatMessage(messages.application) },
    resourceType: { label: intl.formatMessage(messages.resourceType) },
    operation: { label: intl.formatMessage(messages.operation) },
  };

  // Cell renderers
  const cellRenderers = {
    application: (row: Permission) => row.application,
    resourceType: (row: Permission) => row.resource,
    operation: (row: Permission) => row.operation,
  };

  // Filter config
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

  // Create "selected" rows for TableView from selectedPermissions
  const selectedRowsForTable = useMemo(() => {
    return permissions.filter((p) => selectedPermissions.some((sp) => sp.uuid === p.uuid));
  }, [permissions, selectedPermissions]);

  return (
    <div className="rbac-c-permissions-table">
      <TableView
        columns={COLUMNS}
        columnConfig={columnConfig}
        data={isLoading || isLoadingExpandSplats ? undefined : permissions}
        totalCount={pagination.count || 0}
        getRowId={(row) => row.uuid}
        cellRenderers={cellRenderers}
        variant="compact"
        // Pagination
        page={tableState.page}
        perPage={tableState.perPage}
        onPageChange={(newPage) => {
          tableState.onPageChange(newPage);
          fetchData({
            limit: tableState.perPage,
            offset: (newPage - 1) * tableState.perPage,
            application: filters.applications.join(),
            resourceType: filters.resources.join(),
            verb: filters.operations.join(),
          });
        }}
        onPerPageChange={(newPerPage) => {
          tableState.onPerPageChange(newPerPage);
          fetchData({
            limit: newPerPage,
            offset: 0,
            application: filters.applications.join(),
            resourceType: filters.resources.join(),
            verb: filters.operations.join(),
          });
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
        clearAllFilters={() => {
          tableState.clearAllFilters();
          fetchData({
            limit: pagination.limit,
            offset: 0,
            application: '',
            resourceType: '',
            verb: '',
          });
        }}
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
            onClearFilters={() => {
              tableState.clearAllFilters();
              fetchData({
                limit: pagination.limit,
                offset: 0,
                application: '',
                resourceType: '',
                verb: '',
              });
            }}
          />
        }
        ouiaId="add-role-permissions"
        ariaLabel={intl.formatMessage(messages.permissions)}
      />
    </div>
  );
};

export default AddPermissionsTable;
