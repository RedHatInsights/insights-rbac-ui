import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';
import { ActionGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalVariant } from '@patternfly/react-core/dist/dynamic/components/Modal';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import { Stack, StackItem } from '@patternfly/react-core/dist/dynamic/layouts/Stack';
import { ToggleGroup, ToggleGroupItem } from '@patternfly/react-core/dist/dynamic/components/ToggleGroup';
import { Tooltip } from '@patternfly/react-core/dist/dynamic/components/Tooltip';
import { formatDistanceToNow } from 'date-fns';
import { TableView, useTableState } from '../../../../../shared/components/table-view';
import type { CellRendererMap, ColumnConfigMap, FilterConfig } from '../../../../../shared/components/table-view/types';
import { DefaultEmptyStateNoData, DefaultEmptyStateNoResults } from '../../../../../shared/components/table-view/components/TableViewEmptyState';
import type { Role } from '../../../../data/api/roles';
import { useAllRolesV2Query } from '../../../../data/queries/roles';
import { useGroupQuery } from '../../../../data/queries/groups';
import { useRoleBindingsQuery, useUpdateGroupRolesMutation, useWorkspaceQuery } from '../../../../data/queries/workspaces';
import { useWorkspacePermissions } from '../../hooks/useWorkspacePermissions';
import useAppNavigate from '../../../../../shared/hooks/useAppNavigate';
import pathnames from '../../../../utilities/pathnames';
import { getModalContainer } from '../../../../../shared/helpers/modal-container';
import messages from '../../../../../Messages';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOGGLE_ALL = 'all';
const TOGGLE_SELECTED = 'selected';

const columns = ['name', 'description', 'permissions', 'lastModified'] as const;
type SortableColumn = 'name' | 'lastModified';
const sortableColumns: readonly SortableColumn[] = ['name', 'lastModified'];

// ---------------------------------------------------------------------------
// RoleAccessModal — route-only wrapper
// ---------------------------------------------------------------------------

/**
 * Route-driven modal for editing which roles a group has in a workspace.
 * Rendered via `<Outlet />` inside WorkspaceDetail at path `role-access/:groupId`.
 *
 * Owns the single `<Modal>` shell so the toolbar context stays mounted across
 * the loading → loaded transition (avoids a PatternFly ToolbarFilter ref bug).
 * Shows a spinner while fetching, then renders `RoleAccessModalContent` inside
 * the same modal body.
 */
export const RoleAccessModal: React.FC = () => {
  const intl = useIntl();
  const navigate = useAppNavigate();
  const { workspaceId, groupId } = useParams<{ workspaceId: string; groupId: string }>();

  const handleClose = useCallback(() => {
    if (workspaceId) {
      navigate(pathnames['workspace-detail'].link(workspaceId));
    }
  }, [navigate, workspaceId]);

  // --- Queries ---
  const { data: group, isLoading: groupLoading } = useGroupQuery(groupId ?? '', {
    enabled: !!groupId,
  });
  const { data: workspace, isLoading: workspaceLoading } = useWorkspaceQuery(workspaceId ?? '', {
    enabled: !!workspaceId,
  });
  const { data: allRoles, isLoading: rolesLoading } = useAllRolesV2Query();
  const { data: bindingsData, isLoading: bindingsLoading } = useRoleBindingsQuery(
    {
      limit: 1000,
      subjectType: 'group',
      subjectId: groupId ?? '',
      resourceType: 'workspace',
      resourceId: workspaceId ?? '',
    },
    { enabled: !!groupId && !!workspaceId },
  );

  // --- Mutation ---
  const updateMutation = useUpdateGroupRolesMutation();

  const handleUpdate = useCallback(
    (selectedRoleIds: string[]) => {
      if (!workspaceId || !groupId) return;
      updateMutation.mutate(
        {
          resourceId: workspaceId,
          resourceType: 'workspace',
          subjectId: groupId,
          subjectType: 'group',
          roleIds: selectedRoleIds,
        },
        { onSuccess: handleClose },
      );
    },
    [updateMutation, workspaceId, groupId, handleClose],
  );

  // --- Kessel permission guard (MVP: workspace `create` relation) ---
  const { hasPermission, isLoading: permissionsLoading } = useWorkspacePermissions(workspace ? [workspace] : []);
  const addNotification = useAddNotification();

  const lacksCreatePermission = !!workspace && !permissionsLoading && !hasPermission(workspace.id ?? '', 'create');

  useEffect(() => {
    if (lacksCreatePermission) {
      addNotification({
        variant: 'danger',
        title: intl.formatMessage(messages.editAccess),
        description: intl.formatMessage(messages.editingWorkspaceNoPermissionDescription),
      });
      handleClose();
    }
  }, [lacksCreatePermission, addNotification, intl, handleClose]);

  // --- Derived ---
  const assignedRoleIds = useMemo(() => {
    if (!bindingsData?.data) return [];
    return bindingsData.data.flatMap((binding) => binding.roles?.map((r) => r.id).filter((id): id is string => !!id) ?? []);
  }, [bindingsData?.data]);

  if (!workspaceId || !groupId) {
    return null;
  }

  if (lacksCreatePermission) {
    return null;
  }

  const isLoading = groupLoading || workspaceLoading || rolesLoading || bindingsLoading || permissionsLoading;
  const dataReady = !isLoading && !!group && !!workspace && !!allRoles;

  return (
    <Modal
      variant={ModalVariant.large}
      isOpen
      onClose={handleClose}
      appendTo={getModalContainer()}
      ouiaId="role-access-modal"
      aria-labelledby="role-access-modal-title"
      aria-describedby="role-access-modal-body"
    >
      <ModalHeader title={dataReady ? intl.formatMessage(messages.editAccess) : ''} labelId="role-access-modal-title" />
      <ModalBody id="role-access-modal-body">
        {!dataReady && (
          <div className="pf-v6-u-text-align-center pf-v6-u-py-2xl">
            <Spinner size="xl" aria-label="Loading role access data" />
          </div>
        )}
        {dataReady && (
          <RoleAccessModalContent
            allRoles={allRoles}
            assignedRoleIds={assignedRoleIds}
            group={{ uuid: group.uuid ?? (groupId as string), name: group.name ?? '' }}
            workspaceName={workspace.name ?? ''}
            onUpdate={handleUpdate}
            onClose={handleClose}
            isUpdating={updateMutation.isPending}
          />
        )}
      </ModalBody>
    </Modal>
  );
};

export default RoleAccessModal;

// ---------------------------------------------------------------------------
// RoleAccessModalContent — pure UI
// ---------------------------------------------------------------------------

export interface RoleAccessModalContentProps {
  allRoles: Role[];
  assignedRoleIds: string[];
  group: { uuid: string; name: string };
  workspaceName: string;
  onUpdate: (selectedRoleIds: string[]) => void;
  onClose: () => void;
  isUpdating?: boolean;
}

/**
 * Pure UI content for the role-access editing modal.
 * Receives all data as props — no queries, no routing, no `<Modal>` shell.
 * The parent (`RoleAccessModal`) owns the single `<Modal>` instance.
 *
 * Uses `useTableState` for selection, filtering, sorting, and pagination
 * over the full in-memory roles list (client-side).
 */
export const RoleAccessModalContent: React.FC<RoleAccessModalContentProps> = ({
  allRoles,
  assignedRoleIds,
  group,
  workspaceName,
  onUpdate,
  onClose,
  isUpdating = false,
}) => {
  const intl = useIntl();
  const [selectedToggle, setSelectedToggle] = useState(TOGGLE_ALL);
  const selectedToggleRef = useRef<HTMLDivElement>(null);

  // ---- Table state ----

  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      name: { label: intl.formatMessage(messages.role), sortable: true },
      description: { label: intl.formatMessage(messages.description) },
      permissions: { label: intl.formatMessage(messages.permissions) },
      lastModified: { label: intl.formatMessage(messages.lastModified), sortable: true },
    }),
    [intl],
  );

  const filterConfig: FilterConfig[] = useMemo(
    () => [
      {
        type: 'search',
        id: 'name',
        placeholder: intl.formatMessage(messages.filterByKey, { key: intl.formatMessage(messages.role) }),
      },
    ],
    [intl],
  );

  const tableState = useTableState<typeof columns, Role, SortableColumn>({
    columns,
    sortableColumns,
    initialSort: { column: 'name', direction: 'asc' },
    initialPerPage: 10,
    perPageOptions: [5, 10, 20, 50],
    getRowId: (role) => role.id!,
    initialFilters: { name: '' },
    initialSelectedRows: allRoles.filter((r) => assignedRoleIds.includes(r.id!)),
  });

  // ---- Client-side data pipeline (single memo) ----

  const { pageData, totalCount } = useMemo(() => {
    const selectedIds = new Set(tableState.selectedRows.map((r) => r.id));

    let data = selectedToggle === TOGGLE_SELECTED ? allRoles.filter((r) => selectedIds.has(r.id)) : allRoles;

    const nameFilter = (tableState.filters.name as string) || '';
    if (nameFilter) {
      const term = nameFilter.toLowerCase();
      data = data.filter((r) => (r.name || '').toLowerCase().includes(term));
    }

    if (tableState.sort) {
      const { column, direction } = tableState.sort;
      data = [...data].sort((a, b) => {
        let cmp = 0;
        if (column === 'name') {
          cmp = (a.name || '').localeCompare(b.name || '');
        } else if (column === 'lastModified') {
          cmp = new Date(a.last_modified || 0).getTime() - new Date(b.last_modified || 0).getTime();
        }
        return direction === 'asc' ? cmp : -cmp;
      });
    }

    const total = data.length;
    const start = (tableState.page - 1) * tableState.perPage;
    return { pageData: data.slice(start, start + tableState.perPage), totalCount: total };
  }, [allRoles, selectedToggle, tableState.selectedRows, tableState.filters, tableState.sort, tableState.page, tableState.perPage]);

  // ---- Derived state ----

  const cellRenderers: CellRendererMap<typeof columns, Role> = useMemo(
    () => ({
      name: (role) => role.name || '',
      description: (role) => role.description || '—',
      permissions: (role) => role.permissions_count || 0,
      lastModified: (role) => (role.last_modified ? formatDistanceToNow(new Date(role.last_modified), { addSuffix: true }) : '—'),
    }),
    [],
  );

  const hasChanges = useMemo(() => {
    const selectedIds = tableState.selectedRows.map((r) => r.id!);
    if (selectedIds.length !== assignedRoleIds.length) return true;
    return !selectedIds.every((id) => assignedRoleIds.includes(id));
  }, [tableState.selectedRows, assignedRoleIds]);

  const selectedCount = tableState.selectedRows.length;

  // ---- Handlers ----

  const handleUpdate = useCallback(() => {
    onUpdate(tableState.selectedRows.map((r) => r.id!));
  }, [tableState.selectedRows, onUpdate]);

  const handleToggleClick = useCallback(
    (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, isSelected: boolean) => {
      const target = _event.currentTarget as HTMLElement;
      const id = target.id;

      if (id === TOGGLE_SELECTED && selectedCount === 0) return;

      if (isSelected || selectedToggle !== id) {
        setSelectedToggle(id);
        tableState.onPageChange(1);
      }
    },
    [selectedToggle, selectedCount, tableState.onPageChange],
  );

  // ---- Render ----

  return (
    <>
      <Stack hasGutter>
        <StackItem>
          <p className="pf-v6-u-color-200">
            <FormattedMessage
              {...messages.grantOrRemoveAccess}
              values={{
                b: (text: React.ReactNode) => <b>{text}</b>,
                groupName: group.name,
                workspaceName,
              }}
            />
          </p>
        </StackItem>
        <StackItem isFilled>
          <TableView<typeof columns, Role, SortableColumn>
            columns={columns}
            columnConfig={columnConfig}
            sortableColumns={sortableColumns}
            data={pageData}
            totalCount={totalCount}
            getRowId={(role) => role.id!}
            cellRenderers={cellRenderers}
            filterConfig={filterConfig}
            selectable
            emptyStateNoData={<DefaultEmptyStateNoData title={intl.formatMessage(messages.noRolesFound)} />}
            emptyStateNoResults={
              <DefaultEmptyStateNoResults title={intl.formatMessage(messages.noRolesFound)} onClearFilters={tableState.clearAllFilters} />
            }
            variant="compact"
            ariaLabel="Roles selection table"
            ouiaId="role-access-modal-table"
            toolbarActions={
              <>
                <ToggleGroup aria-label="Toggle group to switch between all / selected table rows">
                  <ToggleGroupItem
                    text={intl.formatMessage(messages.all)}
                    buttonId={TOGGLE_ALL}
                    isSelected={selectedToggle === TOGGLE_ALL}
                    onChange={handleToggleClick}
                  />
                  <span ref={selectedToggleRef}>
                    <ToggleGroupItem
                      id="selected-row-switch"
                      text={`${intl.formatMessage(messages.selected)} (${selectedCount})`}
                      buttonId={TOGGLE_SELECTED}
                      isSelected={selectedToggle === TOGGLE_SELECTED}
                      onChange={handleToggleClick}
                      aria-disabled={selectedCount === 0}
                    />
                  </span>
                </ToggleGroup>
                {selectedCount === 0 && (
                  <Tooltip
                    id="selected-row-switch-tooltip"
                    content={intl.formatMessage(messages.selectAtLeastOneRowToFilter)}
                    triggerRef={selectedToggleRef}
                  />
                )}
              </>
            }
            {...tableState}
          />
        </StackItem>
      </Stack>
      <ModalFooter>
        <ActionGroup>
          <Button variant="primary" onClick={handleUpdate} isDisabled={!hasChanges} isLoading={isUpdating}>
            {intl.formatMessage(messages.update)}
          </Button>
          <Button variant="link" onClick={onClose}>
            {intl.formatMessage(messages.cancel)}
          </Button>
        </ActionGroup>
      </ModalFooter>
    </>
  );
};
