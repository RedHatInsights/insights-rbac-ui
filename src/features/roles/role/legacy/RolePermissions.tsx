import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { ButtonVariant } from '@patternfly/react-core';
import { Tooltip } from '@patternfly/react-core/dist/dynamic/components/Tooltip';
import { FormattedMessage, useIntl } from 'react-intl';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import SkeletonTable from '@patternfly/react-component-groups/dist/dynamic/SkeletonTable';
import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';
import { AppLink } from '../../../../components/navigation/AppLink';
import useAppNavigate from '../../../../hooks/useAppNavigate';
import { TableView } from '../../../../components/table-view/TableView';
import { useTableState } from '../../../../components/table-view/hooks/useTableState';
import { DefaultEmptyStateNoData, DefaultEmptyStateNoResults } from '../../../../components/table-view/components/TableViewEmptyState';
import { fetchRole, removeRolePermissions } from '../../../../redux/roles/actions';
import messages from '../../../../Messages';
import pathnames from '../../../../utilities/pathnames';
import './role-permissions.scss';
import type { RBACStore } from '../../../../redux/store.d';
import type { ColumnConfigMap, FilterConfig } from '../../../../components/table-view/types';

interface PermissionData {
  uuid: string;
  permission: string;
  modified: string;
  resourceDefinitions?: { attributeFilter: { value: unknown[] } }[];
}

interface Role {
  uuid: string;
  name: string;
  system?: boolean;
  modified?: string;
  access?: { permission: string; resourceDefinitions?: { attributeFilter: { value: unknown[] } }[] }[];
  applications?: string[];
}

interface PermissionsProps {
  cantAddPermissions?: boolean;
  isLoading?: boolean;
}

interface DeleteInfo {
  title: string;
  text: React.ReactNode;
  confirmButtonLabel: string;
}

const COLUMNS = ['application', 'resourceType', 'operation', 'resourceDefinitions', 'lastModified'] as const;

const removeModalText = (permissions: string | number, role: Role, plural: boolean) => {
  return (
    <FormattedMessage
      {...(plural ? messages.permissionsWillNotBeGrantedThroughRole : messages.permissionWillNotBeGrantedThroughRole)}
      values={{
        b: (text: React.ReactNode) => <b>{text}</b>,
        ...(plural
          ? {
              permissions,
            }
          : {
              permission: permissions,
            }),
        role: role.name,
      }}
    />
  );
};

const Permissions: React.FC<PermissionsProps> = ({ cantAddPermissions, isLoading }) => {
  const intl = useIntl();
  const { role, isRecordLoading } = useSelector(
    (state: RBACStore) => ({
      role: state.roleReducer.selectedRole as Role | undefined,
      isRecordLoading: state.roleReducer.isRecordLoading,
    }),
    shallowEqual,
  );

  const dispatch = useDispatch();
  const navigate = useAppNavigate();

  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [deleteInfo, setDeleteInfo] = useState<DeleteInfo>({ title: '', text: '', confirmButtonLabel: '' });
  const [confirmDelete, setConfirmDelete] = useState<() => Promise<void>>(() => Promise.resolve);
  const [showResourceDefinitions, setShowResourceDefinitions] = useState(true);

  // Extract filter options from role data
  const { resourceOptions, operationOptions } = useMemo(() => {
    if (!role?.access) return { resourceOptions: [], operationOptions: [] };

    const resources = new Set<string>();
    const operations = new Set<string>();

    role.access.forEach(({ permission }) => {
      const [, resource, operation] = permission.split(':');
      if (resource) resources.add(resource);
      if (operation) operations.add(operation);
    });

    return {
      resourceOptions: Array.from(resources).map((r) => ({ id: r, label: r })),
      operationOptions: Array.from(operations).map((o) => ({ id: o, label: o })),
    };
  }, [role?.access]);

  const applicationOptions = useMemo(() => {
    return (role?.applications || []).map((app) => ({ id: app, label: app }));
  }, [role?.applications]);

  // Table state
  const tableState = useTableState({
    columns: COLUMNS,
    getRowId: (row: PermissionData) => row.uuid,
    initialPerPage: 20,
    initialFilters: { applications: [] as string[], resources: [] as string[], operations: [] as string[] },
  });

  // Process permissions data
  const allPermissions = useMemo<PermissionData[]>(() => {
    if (!role?.access) return [];
    return role.access.map((acc) => ({
      uuid: acc.permission,
      permission: acc.permission,
      modified: role.modified || '',
      resourceDefinitions: acc.resourceDefinitions,
    }));
  }, [role]);

  // Filter permissions
  const filteredPermissions = useMemo(() => {
    const { applications, resources, operations } = tableState.filters as {
      applications: string[];
      resources: string[];
      operations: string[];
    };

    return allPermissions.filter(({ permission }) => {
      const [application, resource, operation] = permission.split(':');
      return (
        (applications.length === 0 || applications.includes(application)) &&
        (resources.length === 0 || resources.includes(resource)) &&
        (operations.length === 0 || operations.includes(operation))
      );
    });
  }, [allPermissions, tableState.filters]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const start = (tableState.page - 1) * tableState.perPage;
    return filteredPermissions.slice(start, start + tableState.perPage);
  }, [filteredPermissions, tableState.page, tableState.perPage]);

  useEffect(() => {
    if (role?.access) {
      setShowResourceDefinitions(Boolean(role.access.find((a) => a.permission.includes('cost-management') || a.permission.includes('inventory'))));
    }
  }, [role]);

  const removePermissions = (permissionIds: string[]) => {
    return (
      dispatch(
        removeRolePermissions(role as unknown as Parameters<typeof removeRolePermissions>[0], permissionIds) as unknown as { type: string },
      ) as unknown as Promise<void>
    ).then(() => {
      dispatch(fetchRole(role!.uuid) as unknown as { type: string });
      tableState.clearSelection();
    });
  };

  const initiateRemove = (permissionIds: string[]) => {
    const isMultiple = permissionIds.length > 1;
    setDeleteInfo({
      title: intl.formatMessage(isMultiple ? messages.removePermissionsQuestion : messages.removePermissionQuestion),
      text: removeModalText(isMultiple ? permissionIds.length : permissionIds[0], role as Role, isMultiple),
      confirmButtonLabel: intl.formatMessage(isMultiple ? messages.removePermissions : messages.removePermission),
    });
    setConfirmDelete(() => () => removePermissions(permissionIds));
    setShowRemoveModal(true);
  };

  // Column config - conditionally show resource definitions column
  const visibleColumns = (showResourceDefinitions ? COLUMNS : COLUMNS.filter((c) => c !== 'resourceDefinitions')) as typeof COLUMNS;

  const columnConfig: ColumnConfigMap<typeof COLUMNS> = {
    application: { label: intl.formatMessage(messages.application) },
    resourceType: { label: intl.formatMessage(messages.resourceType) },
    operation: { label: intl.formatMessage(messages.operation) },
    resourceDefinitions: { label: intl.formatMessage(messages.resourceDefinitions) },
    lastModified: { label: intl.formatMessage(messages.lastModified), width: '15%' },
  };

  // Cell renderers
  const cellRenderers = {
    application: (row: PermissionData) => row.permission.split(':')[0],
    resourceType: (row: PermissionData) => row.permission.split(':')[1],
    operation: (row: PermissionData) => row.permission.split(':')[2],
    resourceDefinitions: (row: PermissionData) => {
      const resourceDefs = row.resourceDefinitions;
      const isCostOrInventory = row.permission.includes('cost-management') || row.permission.includes('inventory');
      if (!isCostOrInventory || !resourceDefs || resourceDefs.length === 0) {
        return <span className="rbac-c-text__disabled">{intl.formatMessage(messages.notApplicable)}</span>;
      }
      // Flatten all values across all resource definitions
      const count = resourceDefs.reduce((acc, def) => acc + (def?.attributeFilter?.value?.length || 0), 0);
      return (
        <AppLink to={pathnames['role-detail-permission'].link.replace(':roleId', role?.uuid || '').replace(':permissionId', row.permission)}>
          {count}
        </AppLink>
      );
    },
    lastModified: (row: PermissionData) => row.modified,
  };

  // Row actions
  const renderActions = (row: PermissionData) => (
    <Button variant="link" onClick={() => initiateRemove([row.uuid])}>
      {intl.formatMessage(messages.remove)}
    </Button>
  );

  // Filter config
  const filterConfig: FilterConfig[] = [
    {
      type: 'checkbox',
      id: 'applications',
      label: intl.formatMessage(messages.application),
      options: applicationOptions,
    },
    {
      type: 'checkbox',
      id: 'resources',
      label: intl.formatMessage(messages.resourceType),
      options: resourceOptions,
    },
    {
      type: 'checkbox',
      id: 'operations',
      label: intl.formatMessage(messages.operation),
      options: operationOptions,
    },
  ];

  // Toolbar actions
  const toolbarActions = (
    <>
      {/* Desktop version - hidden on small screens */}
      {cantAddPermissions ? (
        <Tooltip content={intl.formatMessage(messages.systemRolesCantBeModified)} key="role-add-permission">
          <Button variant="primary" aria-label="Add Permission" isAriaDisabled={true} className="rbac-m-hide-on-sm">
            {intl.formatMessage(messages.addPermissions)}
          </Button>
        </Tooltip>
      ) : (
        <AppLink
          to={pathnames['role-add-permission'].link.replace(':roleId', role?.uuid || '')}
          key="role-add-permission"
          className="rbac-m-hide-on-sm"
        >
          <Button variant="primary" aria-label="Add Permission">
            {intl.formatMessage(messages.addPermissions)}
          </Button>
        </AppLink>
      )}
      {/* Mobile version - shown only on small screens */}
      {cantAddPermissions ? (
        <Tooltip content={intl.formatMessage(messages.systemRolesCantBeModified)} key="role-add-permission-mobile">
          <Button variant="primary" aria-label="Add Permission" isAriaDisabled={true} className="rbac-m-hide-on-md">
            {intl.formatMessage(messages.addPermission)}
          </Button>
        </Tooltip>
      ) : (
        <Button
          variant="primary"
          aria-label="Add Permission"
          className="rbac-m-hide-on-md"
          onClick={() => navigate(pathnames['role-add-permission'].link.replace(':roleId', role?.uuid || ''))}
        >
          {intl.formatMessage(messages.addPermission)}
        </Button>
      )}
    </>
  );

  // Bulk actions when items are selected
  const bulkActions =
    tableState.selectedRows.length > 0 ? (
      <Button variant="secondary" onClick={() => initiateRemove(tableState.selectedRows.map((r) => r.uuid))}>
        {intl.formatMessage(messages.remove)} ({tableState.selectedRows.length})
      </Button>
    ) : null;

  const emptyPropsDescription = cantAddPermissions ? '' : intl.formatMessage(messages.toConfigureUserAccess);

  return (
    <section className="pf-v5-c-page__main-section rbac-c-role__permissions">
      <WarningModal
        title={deleteInfo.title || ''}
        isOpen={showRemoveModal}
        confirmButtonLabel={deleteInfo.confirmButtonLabel}
        confirmButtonVariant={ButtonVariant.danger}
        onClose={() => setShowRemoveModal(false)}
        onConfirm={() => {
          confirmDelete();
          setShowRemoveModal(false);
        }}
        aria-label="Remove role permissions modal"
      >
        {deleteInfo.text}
      </WarningModal>

      {isLoading ? (
        <SkeletonTable rows={tableState.perPage} columns={visibleColumns.map((col) => columnConfig[col].label)} />
      ) : (
        <TableView
          columns={visibleColumns}
          columnConfig={columnConfig}
          data={isRecordLoading ? undefined : paginatedData}
          totalCount={filteredPermissions.length}
          getRowId={(row) => row.uuid}
          cellRenderers={cellRenderers}
          // Pagination
          page={tableState.page}
          perPage={tableState.perPage}
          onPageChange={tableState.onPageChange}
          onPerPageChange={tableState.onPerPageChange}
          // Selection (only for non-system roles)
          selectable={!role?.system}
          selectedRows={tableState.selectedRows}
          onSelectRow={tableState.onSelectRow}
          onSelectAll={tableState.onSelectAll}
          // Filtering
          filterConfig={filterConfig}
          filters={tableState.filters}
          onFiltersChange={tableState.onFiltersChange}
          clearAllFilters={tableState.clearAllFilters}
          hasActiveFilters={tableState.hasActiveFilters}
          // Row actions (only for non-system roles)
          renderActions={role?.system ? undefined : renderActions}
          // Toolbar
          toolbarActions={toolbarActions}
          bulkActions={bulkActions}
          // Empty states
          emptyStateNoData={<DefaultEmptyStateNoData title={intl.formatMessage(messages.noRolePermissions)} body={emptyPropsDescription} />}
          emptyStateNoResults={
            <DefaultEmptyStateNoResults
              title={intl.formatMessage(messages.noMatchingItemsFound, { items: intl.formatMessage(messages.permissions).toLowerCase() })}
              body={intl.formatMessage(messages.tryChangingFilters)}
              onClearFilters={tableState.clearAllFilters}
            />
          }
          ouiaId="role-permissions-table"
          ariaLabel={intl.formatMessage(messages.permissions)}
        />
      )}
    </section>
  );
};

export default Permissions;
