import React, { Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { ButtonVariant, Dropdown, DropdownItem, DropdownList, MenuToggle, MenuToggleElement } from '@patternfly/react-core';
import { Drawer } from '@patternfly/react-core/dist/dynamic/components/Drawer';
import { DrawerContent } from '@patternfly/react-core/dist/dynamic/components/Drawer';
import { DrawerContentBody } from '@patternfly/react-core/dist/dynamic/components/Drawer';
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import EllipsisVIcon from '@patternfly/react-icons/dist/dynamic/icons/ellipsis-v-icon';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';

import PageHeader from '@patternfly/react-component-groups/dist/esm/PageHeader';
import { removeRole } from '../../redux/roles/actions';
import { FormattedMessage, useIntl } from 'react-intl';
import messages from '../../Messages';
import { Role } from '../../redux/roles/reducer';
import { Outlet } from 'react-router-dom';
import paths from '../../utilities/pathnames';
import RolesDetails from './RolesWithWorkspacesDetails';
import { ResponsiveAction, ResponsiveActions, WarningModal } from '@patternfly/react-component-groups';
import { PER_PAGE_OPTIONS } from '../../helpers/pagination';
import pathnames from '../../utilities/pathnames';
import useAppNavigate from '../../hooks/useAppNavigate';
import { useRoles } from './useRolesWithWorkspaces';
import { RolesEmptyState } from './components/RolesEmptyState';
import { TableView } from '../../components/table-view/TableView';
import type { CellRendererMap, ColumnConfigMap, FilterConfig, SortDirection } from '../../components/table-view/types';

const ouiaId = 'RolesTable';

// Column definition
const columns = ['display_name', 'description', 'accessCount', 'workspaces', 'user_groups', 'modified'] as const;
type SortableColumn = 'display_name' | 'modified';
const sortableColumns = ['display_name', 'modified'] as const;

interface RolesTableProps {
  selectedRole?: Role;
  onRoleClick: (role: Role | undefined) => void;
}

const RolesTable: React.FunctionComponent<RolesTableProps> = ({ selectedRole, onRoleClick }) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentRoles, setCurrentRoles] = useState<Role[]>([]);
  const [actionsDropdownOpen, setActionsDropdownOpen] = useState<string | null>(null);

  // Use the custom hook for all Roles business logic
  const { roles, isLoading, totalCount, filters, sortBy, direction, onSort, pagination, selection, clearAllFilters, onSetFilters } = useRoles({
    enableAdminFeatures: true,
  });

  const intl = useIntl();
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const addNotification = useAddNotification();
  const { page, perPage, onSetPage, onPerPageSelect } = pagination;
  const { selected, onSelect } = selection;

  const handleModalToggle = (rolesToDelete: Role[]) => {
    setCurrentRoles(rolesToDelete);
    setIsDeleteModalOpen(!isDeleteModalOpen);
  };

  const handleEditRole = useCallback(
    (role: Role) => {
      if (!role) {
        return;
      }
      navigate(paths['edit-role'].link.replace(':roleId', role.uuid));
    },
    [navigate],
  );

  // Column configuration
  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      display_name: { label: intl.formatMessage(messages.name), sortable: true },
      description: { label: intl.formatMessage(messages.description) },
      accessCount: { label: intl.formatMessage(messages.permissions) },
      workspaces: { label: intl.formatMessage(messages.workspaces) },
      user_groups: { label: intl.formatMessage(messages.userGroups) },
      modified: { label: intl.formatMessage(messages.lastModified), sortable: true },
    }),
    [intl],
  );

  // Cell renderers
  const cellRenderers: CellRendererMap<typeof columns, Role> = useMemo(
    () => ({
      display_name: (row) => row.display_name,
      description: (row) => row.description,
      accessCount: (row) => row.accessCount,
      workspaces: () => '',
      user_groups: () => '',
      modified: (row) => row.modified,
    }),
    [],
  );

  // Filter configuration
  const filterConfig: FilterConfig[] = useMemo(
    () => [
      {
        type: 'search',
        id: 'display_name',
        placeholder: intl.formatMessage(messages.nameFilterPlaceholder),
      },
    ],
    [intl],
  );

  // Sort handling
  const currentSort = useMemo(
    () =>
      sortBy
        ? {
            column: sortBy as SortableColumn,
            direction: direction as SortDirection,
          }
        : null,
    [sortBy, direction],
  );

  const handleSortChange = useCallback(
    (column: SortableColumn, newDirection: SortDirection) => {
      onSort(undefined, column, newDirection);
      onSetPage(undefined, 1);
    },
    [onSort, onSetPage],
  );

  // Handle filter change
  const handleFilterChange = useCallback(
    (newFilters: Record<string, string | string[]>) => {
      onSetFilters({ display_name: newFilters.display_name as string });
      onSetPage(undefined, 1);
    },
    [onSetFilters, onSetPage],
  );

  // Selection handlers
  const handleSelectRow = useCallback(
    (row: Role, isRowSelected: boolean) => {
      const rowObj = { id: row.uuid, row: [] };
      if (isRowSelected) {
        onSelect(true, [rowObj]);
      } else {
        onSelect(false, [rowObj]);
      }
    },
    [onSelect],
  );

  const handleSelectAll = useCallback(
    (isAllSelected: boolean, currentRows: Role[]) => {
      const rowObjs = currentRows.map((r) => ({ id: r.uuid, row: [] }));
      onSelect(isAllSelected, rowObjs);
    },
    [onSelect],
  );

  // Map selected objects to Role objects
  const selectedRows = useMemo(() => {
    return roles.filter((role: Role) => selected.some((sel: any) => sel.id === role.uuid));
  }, [roles, selected]);

  // Check if role is system or platform default
  const isRowSystemOrPlatformDefault = (role: Role) => {
    return role?.platform_default || role?.system;
  };

  // Render actions
  const renderActions = useCallback(
    (row: Role) => (
      <Dropdown
        isOpen={actionsDropdownOpen === row.uuid}
        onOpenChange={(isOpen) => setActionsDropdownOpen(isOpen ? row.uuid : null)}
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
          <MenuToggle
            ref={toggleRef}
            aria-label={`Actions for role ${row.display_name}`}
            variant="plain"
            onClick={() => setActionsDropdownOpen(actionsDropdownOpen === row.uuid ? null : row.uuid)}
          >
            <EllipsisVIcon />
          </MenuToggle>
        )}
        popperProps={{ position: 'right' }}
      >
        <DropdownList>
          <DropdownItem onClick={() => handleEditRole(row)}>{intl.formatMessage(messages.edit)}</DropdownItem>
          <DropdownItem isDisabled={row.system} onClick={() => handleModalToggle([row])}>
            {intl.formatMessage(messages.delete)}
          </DropdownItem>
        </DropdownList>
      </Dropdown>
    ),
    [handleEditRole, actionsDropdownOpen, intl],
  );

  // Toolbar actions
  const toolbarActions = useMemo(
    () => (
      <ResponsiveActions breakpoint="lg" ouiaId={`${ouiaId}-actions-dropdown`}>
        <ResponsiveAction ouiaId="add-role-button" onClick={() => navigate(`roles/${paths['add-role'].path}`)} isPinned>
          {intl.formatMessage(messages.createRole)}
        </ResponsiveAction>
      </ResponsiveActions>
    ),
    [navigate, intl],
  );

  // Bulk actions
  const bulkActions = useMemo(
    () => (
      <ResponsiveAction
        isDisabled={selectedRows.length === 0 || selectedRows.some(isRowSystemOrPlatformDefault)}
        onClick={() => {
          handleModalToggle(selectedRows);
        }}
      >
        {intl.formatMessage(messages.deleteRolesAction)}
      </ResponsiveAction>
    ),
    [selectedRows, intl],
  );

  // Handle row click for drawer
  const handleRowClick = useCallback(
    (role: Role) => {
      onRoleClick(selectedRole?.uuid === role.uuid ? undefined : role);
    },
    [selectedRole, onRoleClick],
  );

  return (
    <React.Fragment>
      <PageHeader title="Roles" subtitle="" />
      <PageSection hasBodyWrapper isWidthLimited>
        {isDeleteModalOpen && (
          <WarningModal
            ouiaId={`${ouiaId}-remove-role-modal`}
            isOpen={isDeleteModalOpen}
            title={intl.formatMessage(messages.deleteCustomRoleModalHeader)}
            confirmButtonLabel={intl.formatMessage(messages.deleteRoleConfirm)}
            confirmButtonVariant={ButtonVariant.danger}
            withCheckbox
            checkboxLabel={intl.formatMessage(messages.understandActionIrreversible)}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={async () => {
              try {
                await Promise.all(currentRoles.map((role) => dispatch(removeRole(role.uuid))));
                addNotification({
                  variant: 'success',
                  title: intl.formatMessage(messages.removeRoleSuccessTitle),
                  description: intl.formatMessage(messages.removeRoleSuccessDescription),
                });
              } catch (error) {
                console.error('Failed to remove roles:', error);
                addNotification({
                  variant: 'danger',
                  title: intl.formatMessage(messages.removeRoleErrorTitle),
                  description: intl.formatMessage(messages.removeRoleErrorDescription),
                });
              }
              setIsDeleteModalOpen(false);
            }}
          >
            <FormattedMessage
              {...messages.deleteCustomRoleModalBody}
              values={{
                b: (text) => <b>{text}</b>,
                count: currentRoles.length,
                plural: currentRoles.length > 1 ? intl.formatMessage(messages.roles) : intl.formatMessage(messages.role),
                name: currentRoles[0]?.display_name,
              }}
            />
          </WarningModal>
        )}
        <TableView<typeof columns, Role, SortableColumn>
          columns={columns}
          columnConfig={columnConfig}
          sortableColumns={sortableColumns}
          data={isLoading ? undefined : roles}
          totalCount={totalCount}
          getRowId={(row) => row.uuid}
          cellRenderers={cellRenderers}
          sort={currentSort}
          onSortChange={handleSortChange}
          page={page}
          perPage={perPage}
          perPageOptions={PER_PAGE_OPTIONS.map((opt) => opt.value)}
          onPageChange={(newPage) => onSetPage(undefined, newPage)}
          onPerPageChange={(newPerPage) => {
            onPerPageSelect(undefined, newPerPage);
            onSetPage(undefined, 1);
          }}
          selectable={true}
          selectedRows={selectedRows}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          filterConfig={filterConfig}
          filters={{ display_name: filters.display_name || '' }}
          onFiltersChange={handleFilterChange}
          clearAllFilters={clearAllFilters}
          toolbarActions={toolbarActions}
          bulkActions={bulkActions}
          renderActions={renderActions}
          onRowClick={handleRowClick}
          isRowClickable={() => true}
          variant="compact"
          ariaLabel={intl.formatMessage(messages.roles)}
          ouiaId={ouiaId}
          emptyStateNoData={<RolesEmptyState hasActiveFilters={false} />}
          emptyStateNoResults={<RolesEmptyState hasActiveFilters={true} />}
        />
        <Suspense>
          <Outlet
            context={{
              [pathnames['add-role'].path]: {
                pagination,
                filters: { display_name: filters.display_name },
              },
            }}
          />
        </Suspense>
      </PageSection>
    </React.Fragment>
  );
};

export const RolesPage: React.FunctionComponent = () => {
  const [selectedRole, setSelectedRole] = useState<Role>();
  const drawerRef = useRef<HTMLDivElement>(null);

  return (
    <Drawer isExpanded={Boolean(selectedRole)} onExpand={() => drawerRef.current?.focus()} data-ouia-component-id={`${ouiaId}-detail-drawer`}>
      <DrawerContent panelContent={<RolesDetails selectedRole={selectedRole} setSelectedRole={setSelectedRole} />}>
        <DrawerContentBody>
          <RolesTable selectedRole={selectedRole} onRoleClick={setSelectedRole} />
        </DrawerContentBody>
      </DrawerContent>
    </Drawer>
  );
};

export default RolesPage;
