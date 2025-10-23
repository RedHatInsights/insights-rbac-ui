import React, { useCallback, useMemo, useState } from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { ButtonVariant } from '@patternfly/react-core';
import { Tooltip } from '@patternfly/react-core/dist/dynamic/components/Tooltip';
import { FormattedMessage, useIntl } from 'react-intl';
import SkeletonTable from '@patternfly/react-component-groups/dist/dynamic/SkeletonTable';
import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';
import { DataView } from '@patternfly/react-data-view';
import { DataViewToolbar } from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';
import { DataViewTable } from '@patternfly/react-data-view/dist/dynamic/DataViewTable';
import { BulkSelect, BulkSelectValue } from '@patternfly/react-component-groups/dist/dynamic/BulkSelect';
import { ResponsiveAction, ResponsiveActions, SkeletonTableBody, SkeletonTableHead } from '@patternfly/react-component-groups';
import { Pagination } from '@patternfly/react-core/dist/dynamic/components/Pagination';
import DataViewFilters from '@patternfly/react-data-view/dist/cjs/DataViewFilters';
import { DataViewCheckboxFilter } from '@patternfly/react-data-view';
import { ActionsColumn, IAction } from '@patternfly/react-table';
import { useDataViewSelection } from '@patternfly/react-data-view/dist/dynamic/Hooks';
import { useDataViewFilters } from '@patternfly/react-data-view';
import { DateFormat } from '@redhat-cloud-services/frontend-components/DateFormat';
import { getDateFormat } from '../../../../helpers/stringUtilities';
import messages from '../../../../Messages';
import '../legacy/role-permissions.scss';

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

export const RolePermissions: React.FC<RolePermissionsProps> = ({
  cantAddPermissions,
  isLoading,
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

  // Use DataView filters hook
  const filterState = useDataViewFilters<{ applications: string[]; resources: string[]; operations: string[] }>({
    initialFilters: currentFilters,
  });

  // Sync local filters with parent when they change
  React.useEffect(() => {
    const localFilters = filterState.filters;
    if (JSON.stringify(localFilters) !== JSON.stringify(currentFilters)) {
      onFiltersChange?.(localFilters);
    }
  }, [filterState.filters, currentFilters, onFiltersChange]);

  // Update local filters when parent filters change (for clear)
  React.useEffect(() => {
    if (JSON.stringify(filterState.filters) !== JSON.stringify(currentFilters)) {
      filterState.onSetFilters(currentFilters);
    }
  }, [currentFilters]);

  // Filter change handler
  const handleFilterChange = React.useCallback(
    (_event: any, newFilters: Partial<{ applications: string[]; resources: string[]; operations: string[] }>) => {
      filterState.onSetFilters(newFilters);
    },
    [filterState],
  );

  // Clear all filters handler
  const handleClearAllFilters = React.useCallback(() => {
    const emptyFilters = { applications: [], resources: [], operations: [] };
    filterState.onSetFilters(emptyFilters);
    onFiltersChange?.(emptyFilters);
  }, [filterState, onFiltersChange]);

  // Local state for UI
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<() => void>(() => {});
  const [deleteInfo, setDeleteInfo] = useState({ title: '', text: '', confirmButtonLabel: '' });

  // Selection hook
  const selection = useDataViewSelection({
    matchOption: (a: any, b: any) => a.id === b.id,
  });

  // Calculate paginated data
  const offset = (page - 1) * perPage;
  const paginatedPermissions = useMemo(() => {
    return filteredPermissions.slice(offset, offset + perPage);
  }, [filteredPermissions, offset, perPage]);

  // Handle permission removal
  const removePermissions = useCallback(
    async (permissions: Array<{ uuid: string }>) => {
      await onRemovePermissions(permissions);
      selection.onSelect(false);
    },
    [onRemovePermissions, selection],
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

  // Columns definition
  const columns = useMemo(() => {
    const cols = [
      { cell: intl.formatMessage(messages.application) },
      { cell: intl.formatMessage(messages.resourceType) },
      { cell: intl.formatMessage(messages.operation) },
    ];

    if (showResourceDefinitions) {
      cols.push({
        cell: intl.formatMessage(messages.resourceDefinitions),
      });
    }

    cols.push({ cell: intl.formatMessage(messages.lastModified) });

    if (!isSystemRole) {
      cols.push({ cell: '' }); // Actions column
    }

    return cols;
  }, [intl, showResourceDefinitions, isSystemRole]);

  // Create table rows
  const tableRows = useMemo(() => {
    return paginatedPermissions.map((permission) => {
      const [application, resourceType, operation] = permission.permission.split(':');
      const resourceDefinitionsCount = permission.resourceDefinitions?.length || 0;
      const resourceDefinitionsLabel =
        (permission.permission.includes('cost-management') || permission.permission.includes('inventory')) && resourceDefinitionsCount > 0
          ? resourceDefinitionsCount.toString()
          : intl.formatMessage(messages.notApplicable);

      const cells: any[] = [application, resourceType, operation];

      if (showResourceDefinitions) {
        cells.push(resourceDefinitionsLabel);
      }

      // Add formatted date
      cells.push({
        cell: <DateFormat date={permission.modified} type={getDateFormat(permission.modified)} />,
      });

      // Add actions column if not system role
      if (!isSystemRole) {
        cells.push({
          cell: <ActionsColumn items={rowActions(permission)} />,
          props: { isActionCell: true },
        });
      }

      return {
        id: permission.uuid,
        row: cells,
      };
    });
  }, [paginatedPermissions, showResourceDefinitions, intl, isSystemRole, rowActions]);

  // Bulk select handler
  const handleBulkSelect = useCallback(
    (value: BulkSelectValue) => {
      if (value === BulkSelectValue.none) {
        selection.onSelect(false);
      } else if (value === BulkSelectValue.page) {
        selection.onSelect(true, tableRows);
      } else if (value === BulkSelectValue.nonePage) {
        selection.onSelect(false, tableRows);
      }
    },
    [selection, tableRows],
  );

  // Bulk select component
  const bulkSelectComponent = useMemo(() => {
    if (isSystemRole || cantAddPermissions) return undefined;

    const selectedCount = selection.selected?.length || 0;
    const currentPageCount = paginatedPermissions.length;
    const totalCount = filteredPermissions.length;

    const selectedOnPage = tableRows.filter((row) => selection.selected?.some((sel: any) => sel.id === row.id)).length;
    const pageSelected = selectedOnPage > 0 && selectedOnPage === currentPageCount;
    const pagePartiallySelected = selectedOnPage > 0 && selectedOnPage < currentPageCount;

    return (
      <BulkSelect
        isDataPaginated={true}
        selectedCount={selectedCount}
        totalCount={totalCount}
        pageCount={currentPageCount}
        pageSelected={pageSelected}
        pagePartiallySelected={pagePartiallySelected}
        onSelect={handleBulkSelect}
      />
    );
  }, [isSystemRole, cantAddPermissions, selection.selected, paginatedPermissions.length, filteredPermissions.length, tableRows, handleBulkSelect]);

  // Actions
  const actions = useMemo(() => {
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
        <ResponsiveAction
          isDisabled={!selection.selected || selection.selected.length === 0}
          onClick={() => {
            // Map selected table rows back to permissions
            const selectedPermissions = (selection.selected || [])
              .map((row: any) => filteredPermissions.find((p) => p.uuid === row.id))
              .filter(Boolean) as FilteredPermission[];

            const multiplePermissionsSelected = selectedPermissions.length > 1;
            initiateRemove(
              selectedPermissions,
              intl.formatMessage(multiplePermissionsSelected ? messages.removePermissionsQuestion : messages.removePermissionQuestion),
              removeModalText(
                multiplePermissionsSelected ? selectedPermissions.length : selectedPermissions[0].uuid,
                roleName,
                multiplePermissionsSelected || false,
              ),
              intl.formatMessage(multiplePermissionsSelected ? messages.removePermissions : messages.removePermission),
            );
          }}
        >
          {intl.formatMessage(messages.remove)}
        </ResponsiveAction>
      </ResponsiveActions>
    );
  }, [cantAddPermissions, intl, onNavigateToAddPermissions, selection.selected, initiateRemove, roleName, filteredPermissions]);

  // Pagination component
  const paginationComponent = useMemo(
    () => (
      <Pagination
        itemCount={filteredPermissions.length}
        page={page}
        perPage={perPage}
        onSetPage={(_event, newPage) => setPage(newPage)}
        onPerPageSelect={(_event, newPerPage) => {
          setPerPage(newPerPage);
          setPage(1);
        }}
        variant="top"
        isCompact
      />
    ),
    [filteredPermissions.length, page, perPage],
  );

  const footerPaginationComponent = useMemo(
    () => (
      <Pagination
        itemCount={filteredPermissions.length}
        page={page}
        perPage={perPage}
        onSetPage={(_event, newPage) => setPage(newPage)}
        onPerPageSelect={(_event, newPerPage) => {
          setPerPage(newPerPage);
          setPage(1);
        }}
        variant="bottom"
      />
    ),
    [filteredPermissions.length, page, perPage],
  );

  // Empty state
  const emptyPropsDescription = cantAddPermissions
    ? ['']
    : ['To configure user access to applications,', 'add at least one permission to this role.', ''];

  const emptyState = useMemo(
    () => (
      <tbody>
        <tr>
          <td colSpan={columns.length}>
            <div className="pf-v5-u-text-align-center pf-v5-u-py-xl">
              <h3>{intl.formatMessage(messages.noRolePermissions)}</h3>
              {emptyPropsDescription.map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          </td>
        </tr>
      </tbody>
    ),
    [columns.length, intl, emptyPropsDescription],
  );

  // Loading states
  const loadingHeader = <SkeletonTableHead columns={columns.map((col) => col.cell)} />;
  const loadingBody = <SkeletonTableBody rowsCount={perPage} columnsCount={columns.length} />;

  return (
    <section className="pf-v5-c-page__main-section rbac-c-role__permissions">
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

      {isLoading ? (
        <SkeletonTable rows={perPage} columns={columns.map((col) => col.cell)} />
      ) : (
        <DataView selection={isSystemRole || cantAddPermissions ? undefined : selection}>
          <DataViewToolbar
            bulkSelect={bulkSelectComponent}
            pagination={paginationComponent}
            actions={actions}
            filters={
              <DataViewFilters onChange={handleFilterChange} values={filterState.filters}>
                <DataViewCheckboxFilter
                  filterId="applications"
                  title="Applications"
                  placeholder="Filter by application"
                  options={applications.map((app) => ({ label: app, value: app }))}
                />
                <DataViewCheckboxFilter
                  filterId="resources"
                  title={intl.formatMessage(messages.resourceType)}
                  placeholder={intl.formatMessage(messages.filterByKey, { key: intl.formatMessage(messages.resourceType).toLowerCase() })}
                  options={resources}
                />
                <DataViewCheckboxFilter
                  filterId="operations"
                  title={intl.formatMessage(messages.operation)}
                  placeholder={intl.formatMessage(messages.filterByKey, { key: intl.formatMessage(messages.operation).toLowerCase() })}
                  options={operations}
                />
              </DataViewFilters>
            }
            clearAllFilters={handleClearAllFilters}
          />
          <DataViewTable
            aria-label={intl.formatMessage(messages.permissions)}
            variant="compact"
            columns={columns}
            rows={tableRows}
            headStates={{ loading: loadingHeader }}
            bodyStates={{
              loading: loadingBody,
              empty: emptyState,
            }}
          />
          <DataViewToolbar pagination={footerPaginationComponent} />
        </DataView>
      )}
    </section>
  );
};
