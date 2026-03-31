import React, { Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { ButtonVariant, Dropdown, DropdownItem, DropdownList, MenuToggle, MenuToggleElement } from '@patternfly/react-core';
import { Drawer } from '@patternfly/react-core/dist/dynamic/components/Drawer';
import { DrawerContent } from '@patternfly/react-core/dist/dynamic/components/Drawer';
import { DrawerContentBody } from '@patternfly/react-core/dist/dynamic/components/Drawer';
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import EllipsisVIcon from '@patternfly/react-icons/dist/dynamic/icons/ellipsis-v-icon';
import { DateFormat } from '@redhat-cloud-services/frontend-components/DateFormat';
import { useRolesAccess } from '../../hooks/useRbacAccess';

import PageHeader from '@patternfly/react-component-groups/dist/esm/PageHeader';
import { FormattedMessage, useIntl } from 'react-intl';
import messages from '../../../Messages';
import { Outlet } from 'react-router-dom';
import RolesDetails from './RolesWithWorkspacesDetails';
import { ResponsiveAction, ResponsiveActions, WarningModal } from '@patternfly/react-component-groups';
import pathnames from '../../utilities/pathnames';
import useAppNavigate from '../../../shared/hooks/useAppNavigate';
import { type Role, useRoles } from './useRolesWithWorkspaces';
import { useBatchDeleteRolesV2Mutation } from '../../data/queries/roles';
import { useRolePermissions } from './hooks/useRolePermissions';
import { RolesEmptyState } from './components/RolesEmptyState';
// eslint-disable-next-line rbac-local/require-use-table-state -- tableState received from useRolesWithWorkspaces hook
import { TableView } from '../../../shared/components/table-view/TableView';
import type { CellRendererMap, ColumnConfigMap, FilterConfig } from '../../../shared/components/table-view/types';
import { getDateFormat } from '../../../shared/helpers/stringUtilities';

const ouiaId = 'RolesTable';

const columns = ['name', 'description', 'permissions', 'last_modified'] as const;
type SortableColumn = 'name' | 'last_modified';
const sortableColumns = ['name', 'last_modified'] as const;

interface RolesTableProps {
  selectedRole?: Role;
  onRoleClick: (role: Role | undefined) => void;
}

const RolesTable: React.FunctionComponent<RolesTableProps> = ({ selectedRole, onRoleClick }) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentRoles, setCurrentRoles] = useState<Role[]>([]);
  const [actionsDropdownOpen, setActionsDropdownOpen] = useState<string | null>(null);

  const { canCreate: canCreateRole } = useRolesAccess();

  // Use the custom hook for all Roles business logic (includes tableState)
  const { roles, isLoading, hasNextPage, hasPreviousPage, tableState } = useRoles({
    enableAdminFeatures: true,
  });

  const { canEdit: canEditRole, canDelete: canDeleteRole } = useRolePermissions(roles);

  const intl = useIntl();
  const navigate = useAppNavigate();
  const batchDeleteMutation = useBatchDeleteRolesV2Mutation();

  const handleModalToggle = (rolesToDelete: Role[]) => {
    setCurrentRoles(rolesToDelete);
    setIsDeleteModalOpen(!isDeleteModalOpen);
  };

  const handleEditRole = useCallback(
    (role: Role) => {
      if (!role?.id) {
        return;
      }
      navigate(pathnames['access-management-edit-role'].link(role.id));
    },
    [navigate],
  );

  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      name: { label: intl.formatMessage(messages.name), sortable: true },
      description: { label: intl.formatMessage(messages.description) },
      permissions: { label: intl.formatMessage(messages.permissions), width: 20 },
      last_modified: { label: intl.formatMessage(messages.lastModified), sortable: true },
    }),
    [intl],
  );

  const cellRenderers: CellRendererMap<typeof columns, Role> = useMemo(
    () => ({
      name: (row) => row.name,
      description: (row) => row.description || '—',
      permissions: (row) => row.permissions_count ?? row.permissions?.length ?? '—',
      last_modified: (row) => (row.last_modified ? <DateFormat date={row.last_modified} type={getDateFormat(row.last_modified)} /> : '—'),
    }),
    [],
  );

  const filterConfig: FilterConfig[] = useMemo(
    () => [
      {
        type: 'search',
        id: 'name',
        placeholder: intl.formatMessage(messages.nameFilterPlaceholder),
      },
    ],
    [intl],
  );

  const renderActions = useCallback(
    (row: Role) => {
      const editable = row.id ? canEditRole(row.id) : false;
      const deletable = row.id ? canDeleteRole(row.id) : false;
      if (!editable && !deletable) return null;

      return (
        <Dropdown
          isOpen={actionsDropdownOpen === row.id}
          onOpenChange={(isOpen) => setActionsDropdownOpen(isOpen ? (row.id ?? null) : null)}
          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
            <MenuToggle
              ref={toggleRef}
              aria-label={`Actions for role ${row.name}`}
              variant="plain"
              onClick={() => setActionsDropdownOpen(actionsDropdownOpen === row.id ? null : (row.id ?? null))}
            >
              <EllipsisVIcon />
            </MenuToggle>
          )}
          popperProps={{ position: 'right' }}
        >
          <DropdownList>
            {editable && <DropdownItem onClick={() => handleEditRole(row)}>{intl.formatMessage(messages.edit)}</DropdownItem>}
            {deletable && <DropdownItem onClick={() => handleModalToggle([row])}>{intl.formatMessage(messages.delete)}</DropdownItem>}
          </DropdownList>
        </Dropdown>
      );
    },
    [handleEditRole, actionsDropdownOpen, intl, canEditRole, canDeleteRole],
  );

  const selectedCount = tableState.selectedRows.length;

  // Per UX design: toolbar has "Create role" (pinned button) + kebab with "Edit role" / "Delete role".
  // "Edit role" is enabled when exactly 1 role is selected; disabled otherwise.
  // "Delete role" is enabled when 1+ roles are selected.
  const toolbarActions = useMemo(
    () =>
      canCreateRole ? (
        <ResponsiveActions breakpoint="lg" ouiaId={`${ouiaId}-actions-dropdown`}>
          <ResponsiveAction ouiaId="add-role-button" onClick={() => navigate(pathnames['access-management-add-role'].link())} isPinned>
            {intl.formatMessage(messages.createRole)}
          </ResponsiveAction>
          <ResponsiveAction
            ouiaId="edit-role-button"
            isDisabled={selectedCount !== 1}
            onClick={() => {
              const role = tableState.selectedRows[0];
              if (role) handleEditRole(role);
            }}
          >
            {intl.formatMessage(messages.editRole)}
          </ResponsiveAction>
          <ResponsiveAction ouiaId="delete-role-button" isDisabled={selectedCount === 0} onClick={() => handleModalToggle(tableState.selectedRows)}>
            {intl.formatMessage(messages.deleteRole)}
          </ResponsiveAction>
        </ResponsiveActions>
      ) : undefined,
    [navigate, intl, canCreateRole, selectedCount, tableState.selectedRows, handleEditRole],
  );

  const isRowDeletable = useCallback((role: Role) => (role.id ? canDeleteRole(role.id) : false), [canDeleteRole]);

  const handleRowClick = useCallback(
    (role: Role) => {
      onRoleClick(selectedRole?.id === role.id ? undefined : role);
    },
    [selectedRole, onRoleClick],
  );

  return (
    <React.Fragment>
      <PageHeader title="Roles" subtitle="" />
      <PageSection hasBodyWrapper={false}>
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
                const ids = currentRoles.map((role) => role.id).filter((id): id is string => Boolean(id));
                await batchDeleteMutation.mutateAsync({ ids });
              } catch (error) {
                console.error('Failed to remove roles:', error);
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
                name: currentRoles[0]?.name,
              }}
            />
          </WarningModal>
        )}
        <TableView<typeof columns, Role, SortableColumn>
          columns={columns}
          columnConfig={columnConfig}
          sortableColumns={sortableColumns}
          data={isLoading ? undefined : roles}
          totalCount={undefined}
          getRowId={(row) => row.id!}
          cellRenderers={cellRenderers}
          // Sort — from useTableState
          sort={tableState.sort}
          onSortChange={tableState.onSortChange}
          // Pagination — cursor-based, from useTableState
          page={tableState.page}
          perPage={tableState.perPage}
          perPageOptions={tableState.perPageOptions}
          onPageChange={tableState.onPageChange}
          onPerPageChange={tableState.onPerPageChange}
          hasNextPage={hasNextPage}
          hasPreviousPage={hasPreviousPage}
          // Selection — from useTableState, per-role permission gating
          selectable
          isRowSelectable={isRowDeletable}
          selectedRows={tableState.selectedRows}
          onSelectRow={tableState.onSelectRow}
          onSelectAll={tableState.onSelectAll}
          // Filters — from useTableState
          filterConfig={filterConfig}
          filters={tableState.filters}
          onFiltersChange={tableState.onFiltersChange}
          clearAllFilters={tableState.clearAllFilters}
          // Toolbar
          toolbarActions={toolbarActions}
          renderActions={renderActions}
          onRowClick={handleRowClick}
          isRowClickable={() => true}
          variant="compact"
          ariaLabel={intl.formatMessage(messages.roles)}
          ouiaId={ouiaId}
          emptyStateNoData={<RolesEmptyState hasActiveFilters={false} addRoleLink={pathnames['access-management-add-role'].link()} />}
          emptyStateNoResults={<RolesEmptyState hasActiveFilters={true} addRoleLink={pathnames['access-management-add-role'].link()} />}
        />
        <Suspense>
          <Outlet
            context={{
              [pathnames['access-management-add-role'].path]: {
                cancelRoute: pathnames['access-management-roles'].link(),
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
