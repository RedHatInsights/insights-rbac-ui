import React, { useCallback, useMemo, useState } from 'react';
import { Button, ButtonVariant, PageSection, Tooltip } from '@patternfly/react-core';
import { FormattedMessage, useIntl } from 'react-intl';
import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';
import { ResponsiveAction, ResponsiveActions } from '@patternfly/react-component-groups';
import { ActionsColumn, IAction } from '@patternfly/react-table';
import { DateFormat } from '@redhat-cloud-services/frontend-components/DateFormat';
import { AppLink } from '../../../../components/navigation/AppLink';
import { getDateFormat } from '../../../../helpers/stringUtilities';
import { TableView } from '../../../../components/table-view/TableView';
import { DefaultEmptyStateNoData, DefaultEmptyStateNoResults } from '../../../../components/table-view/components/TableViewEmptyState';
import type { CellRendererMap, ColumnConfigMap, FilterConfig } from '../../../../components/table-view/types';
import messages from '../../../../Messages';
import pathnames from '../../../../utilities/pathnames';

interface FilteredPermission {
  uuid: string;
  permission: string;
  resourceDefinitions: any[];
  modified: string;
}

interface RolePermissionsProps {
  cantAddPermissions: boolean;
  isLoading: boolean;
  isRecordLoading: boolean;
  roleUuid?: string;
  roleName?: string;
  isSystemRole: boolean;
  filteredPermissions: FilteredPermission[];
  applications: string[];
  resources: Array<{ label: string; value: string }>;
  operations: Array<{ label: string; value: string }>;
  showResourceDefinitions: boolean;
  onRemovePermissions: (permissions: Array<{ uuid: string }>) => Promise<void>;
  onNavigateToAddPermissions: () => void;
  onFiltersChange?: (filters: { applications: string[]; resources: string[]; operations: string[] }) => void;
  currentFilters?: { applications: string[]; resources: string[]; operations: string[] };
}

const removeModalText = (permissions: string | number, roleName: string, plural: boolean) => {
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
        role: roleName,
      }}
    />
  );
};

// Columns definition - with and without resource definitions
const columnsWithResourceDefs = ['application', 'resourceType', 'operation', 'resourceDefinitions', 'lastModified'] as const;
const columnsWithoutResourceDefs = ['application', 'resourceType', 'operation', 'lastModified'] as const;

// Helper to parse permission string
const parsePermission = (permission: string) => {
  const [application, resourceType, operation] = permission.split(':');
  return { application, resourceType, operation };
};

export const RolePermissions: React.FC<RolePermissionsProps> = ({
  cantAddPermissions,
  isLoading,
  roleUuid = '',
  roleName = '',
  isSystemRole,
  filteredPermissions,
  applications,
  resources,
  operations,
  showResourceDefinitions,
  onRemovePermissions,
  onNavigateToAddPermissions,
  onFiltersChange,
  currentFilters = { applications: [], resources: [], operations: [] },
}) => {
  const intl = useIntl();

  // Local state for UI
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<() => void>(() => {});
  const [deleteInfo, setDeleteInfo] = useState({ title: '', text: '', confirmButtonLabel: '' });
  const [selectedRows, setSelectedRows] = useState<FilteredPermission[]>([]);

  // Calculate paginated data
  const offset = (page - 1) * perPage;
  const paginatedPermissions = useMemo(() => {
    return filteredPermissions.slice(offset, offset + perPage);
  }, [filteredPermissions, offset, perPage]);

  // Handle permission removal
  const removePermissions = useCallback(
    async (permissions: Array<{ uuid: string }>) => {
      await onRemovePermissions(permissions);
      setSelectedRows([]);
    },
    [onRemovePermissions],
  );

  const initiateRemove = useCallback(
    (permissionsToRemove: FilteredPermission[], title: string, text: string | React.ReactNode, confirmButtonLabel: string) => {
      setDeleteInfo({ title, text: text as any, confirmButtonLabel });
      setConfirmDelete(() => () => removePermissions(permissionsToRemove.map((p) => ({ uuid: p.uuid }))));
      setShowRemoveModal(true);
    },
    [removePermissions],
  );

  // Actions for individual rows
  const rowActions = useCallback(
    (permission: FilteredPermission): IAction[] => {
      if (isSystemRole) return [];

      return [
        {
          title: intl.formatMessage(messages.remove),
          onClick: () => {
            initiateRemove(
              [permission],
              intl.formatMessage(messages.removePermissionQuestion),
              removeModalText(permission.permission, roleName, false),
              intl.formatMessage(messages.removePermission),
            );
          },
        } as IAction,
      ];
    },
    [isSystemRole, intl, initiateRemove, roleName],
  );

  // Column configuration for columns with resource definitions
  const columnConfigWithResourceDefs: ColumnConfigMap<typeof columnsWithResourceDefs> = useMemo(
    () => ({
      application: { label: intl.formatMessage(messages.application) },
      resourceType: { label: intl.formatMessage(messages.resourceType) },
      operation: { label: intl.formatMessage(messages.operation) },
      resourceDefinitions: { label: intl.formatMessage(messages.resourceDefinitions) },
      lastModified: { label: intl.formatMessage(messages.lastModified) },
    }),
    [intl],
  );

  // Column configuration for columns without resource definitions
  const columnConfigWithoutResourceDefs: ColumnConfigMap<typeof columnsWithoutResourceDefs> = useMemo(
    () => ({
      application: { label: intl.formatMessage(messages.application) },
      resourceType: { label: intl.formatMessage(messages.resourceType) },
      operation: { label: intl.formatMessage(messages.operation) },
      lastModified: { label: intl.formatMessage(messages.lastModified) },
    }),
    [intl],
  );

  // Cell renderers for columns with resource definitions
  const cellRenderersWithResourceDefs: CellRendererMap<typeof columnsWithResourceDefs, FilteredPermission> = useMemo(
    () => ({
      application: (row) => parsePermission(row.permission).application,
      resourceType: (row) => parsePermission(row.permission).resourceType,
      operation: (row) => parsePermission(row.permission).operation,
      resourceDefinitions: (row) => {
        const resourceDefinitionsCount = row.resourceDefinitions?.length || 0;
        const hasResourceDefinitions =
          (row.permission.includes('cost-management') || row.permission.includes('inventory')) && resourceDefinitionsCount > 0;

        if (hasResourceDefinitions) {
          return (
            <AppLink to={pathnames['role-detail-permission'].link.replace(':roleId', roleUuid).replace(':permissionId', row.permission)}>
              {resourceDefinitionsCount}
            </AppLink>
          );
        }
        return <span className="rbac-c-text__disabled">{intl.formatMessage(messages.notApplicable)}</span>;
      },
      lastModified: (row) => <DateFormat date={row.modified} type={getDateFormat(row.modified)} />,
    }),
    [intl, roleUuid],
  );

  // Cell renderers for columns without resource definitions
  const cellRenderersWithoutResourceDefs: CellRendererMap<typeof columnsWithoutResourceDefs, FilteredPermission> = useMemo(
    () => ({
      application: (row) => parsePermission(row.permission).application,
      resourceType: (row) => parsePermission(row.permission).resourceType,
      operation: (row) => parsePermission(row.permission).operation,
      lastModified: (row) => <DateFormat date={row.modified} type={getDateFormat(row.modified)} />,
    }),
    [],
  );

  // Filter configuration
  const filterConfig: FilterConfig[] = useMemo(
    () => [
      {
        type: 'checkbox',
        id: 'applications',
        label: 'Applications',
        options: applications.map((app) => ({ id: app, label: app })),
      },
      {
        type: 'checkbox',
        id: 'resources',
        label: intl.formatMessage(messages.resourceType),
        options: resources.map((r) => ({ id: r.value, label: r.label })),
      },
      {
        type: 'checkbox',
        id: 'operations',
        label: intl.formatMessage(messages.operation),
        options: operations.map((o) => ({ id: o.value, label: o.label })),
      },
    ],
    [applications, resources, operations, intl],
  );

  // Handle filter change
  const handleFilterChange = useCallback(
    (newFilters: Record<string, string | string[]>) => {
      const typedFilters = {
        applications: (newFilters.applications as string[]) || [],
        resources: (newFilters.resources as string[]) || [],
        operations: (newFilters.operations as string[]) || [],
      };
      onFiltersChange?.(typedFilters);
    },
    [onFiltersChange],
  );

  // Clear all filters handler
  const handleClearAllFilters = useCallback(() => {
    const emptyFilters = { applications: [], resources: [], operations: [] };
    onFiltersChange?.(emptyFilters);
  }, [onFiltersChange]);

  // Selection handlers
  const handleSelectRow = useCallback((row: FilteredPermission, isSelected: boolean) => {
    setSelectedRows((prev) => {
      if (isSelected) {
        return [...prev, row];
      }
      return prev.filter((r) => r.uuid !== row.uuid);
    });
  }, []);

  const handleSelectAll = useCallback((isSelected: boolean, rows: FilteredPermission[]) => {
    if (isSelected) {
      setSelectedRows((prev) => {
        const existingIds = new Set(prev.map((r) => r.uuid));
        const newRows = rows.filter((r) => !existingIds.has(r.uuid));
        return [...prev, ...newRows];
      });
    } else {
      const rowIds = new Set(rows.map((r) => r.uuid));
      setSelectedRows((prev) => prev.filter((r) => !rowIds.has(r.uuid)));
    }
  }, []);

  // Actions
  const toolbarActions = useMemo(() => {
    return (
      <ResponsiveActions breakpoint="lg">
        {cantAddPermissions ? (
          <Tooltip content={intl.formatMessage(messages.systemRolesCantBeModified)} key="role-add-permission">
            <Button variant="primary" aria-label="Add Permission" isAriaDisabled={true} className="rbac-m-hide-on-sm">
              {intl.formatMessage(messages.addPermissions)}
            </Button>
          </Tooltip>
        ) : (
          <ResponsiveAction isPinned onClick={onNavigateToAddPermissions} key="role-add-permission">
            {intl.formatMessage(messages.addPermissions)}
          </ResponsiveAction>
        )}
      </ResponsiveActions>
    );
  }, [cantAddPermissions, intl, onNavigateToAddPermissions]);

  // Bulk actions
  const bulkActions = useMemo(() => {
    return (
      <ResponsiveAction
        isDisabled={selectedRows.length === 0}
        onClick={() => {
          const multiplePermissionsSelected = selectedRows.length > 1;
          initiateRemove(
            selectedRows,
            intl.formatMessage(multiplePermissionsSelected ? messages.removePermissionsQuestion : messages.removePermissionQuestion),
            removeModalText(
              multiplePermissionsSelected ? selectedRows.length : selectedRows[0]?.uuid,
              roleName,
              multiplePermissionsSelected || false,
            ),
            intl.formatMessage(multiplePermissionsSelected ? messages.removePermissions : messages.removePermission),
          );
        }}
      >
        {intl.formatMessage(messages.remove)}
      </ResponsiveAction>
    );
  }, [selectedRows, initiateRemove, intl, roleName]);

  // Empty state descriptions
  const emptyPropsDescription = cantAddPermissions ? '' : 'To configure user access to applications, add at least one permission to this role.';

  // Render actions column for rows
  const renderActions = useCallback(
    (row: FilteredPermission) => {
      const actions = rowActions(row);
      if (actions.length === 0) return null;
      return <ActionsColumn items={actions} />;
    },
    [rowActions],
  );

  // Determine if selection and actions should be enabled
  const enableSelection = !isSystemRole && !cantAddPermissions;

  return (
    <PageSection hasBodyWrapper={false}>
      <WarningModal
        title={deleteInfo.title}
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

      {showResourceDefinitions ? (
        <TableView<typeof columnsWithResourceDefs, FilteredPermission>
          columns={columnsWithResourceDefs}
          columnConfig={columnConfigWithResourceDefs}
          data={isLoading ? undefined : paginatedPermissions}
          totalCount={filteredPermissions.length}
          getRowId={(row) => row.uuid}
          cellRenderers={cellRenderersWithResourceDefs}
          page={page}
          perPage={perPage}
          onPageChange={(newPage) => setPage(newPage)}
          onPerPageChange={(newPerPage) => {
            setPerPage(newPerPage);
            setPage(1);
          }}
          selectable={enableSelection}
          selectedRows={selectedRows}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          filterConfig={filterConfig}
          filters={currentFilters}
          onFiltersChange={handleFilterChange}
          clearAllFilters={handleClearAllFilters}
          toolbarActions={toolbarActions}
          bulkActions={enableSelection ? bulkActions : undefined}
          renderActions={!isSystemRole ? renderActions : undefined}
          variant="compact"
          ariaLabel={intl.formatMessage(messages.permissions)}
          ouiaId="role-permissions-table"
          emptyStateNoData={<DefaultEmptyStateNoData title={intl.formatMessage(messages.noRolePermissions)} body={emptyPropsDescription} />}
          emptyStateNoResults={
            <DefaultEmptyStateNoResults title={intl.formatMessage(messages.noRolePermissions)} onClearFilters={handleClearAllFilters} />
          }
        />
      ) : (
        <TableView<typeof columnsWithoutResourceDefs, FilteredPermission>
          columns={columnsWithoutResourceDefs}
          columnConfig={columnConfigWithoutResourceDefs}
          data={isLoading ? undefined : paginatedPermissions}
          totalCount={filteredPermissions.length}
          getRowId={(row) => row.uuid}
          cellRenderers={cellRenderersWithoutResourceDefs}
          page={page}
          perPage={perPage}
          onPageChange={(newPage) => setPage(newPage)}
          onPerPageChange={(newPerPage) => {
            setPerPage(newPerPage);
            setPage(1);
          }}
          selectable={enableSelection}
          selectedRows={selectedRows}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          filterConfig={filterConfig}
          filters={currentFilters}
          onFiltersChange={handleFilterChange}
          clearAllFilters={handleClearAllFilters}
          toolbarActions={toolbarActions}
          bulkActions={enableSelection ? bulkActions : undefined}
          renderActions={!isSystemRole ? renderActions : undefined}
          variant="compact"
          ariaLabel={intl.formatMessage(messages.permissions)}
          ouiaId="role-permissions-table"
          emptyStateNoData={<DefaultEmptyStateNoData title={intl.formatMessage(messages.noRolePermissions)} body={emptyPropsDescription} />}
          emptyStateNoResults={
            <DefaultEmptyStateNoResults title={intl.formatMessage(messages.noRolePermissions)} onClearFilters={handleClearAllFilters} />
          }
        />
      )}
    </PageSection>
  );
};
