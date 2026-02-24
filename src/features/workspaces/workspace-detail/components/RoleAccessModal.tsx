import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalVariant } from '@patternfly/react-core/dist/dynamic/components/Modal';
import { ActionGroup, ToggleGroup, ToggleGroupItem, Tooltip } from '@patternfly/react-core';
import { Stack, StackItem } from '@patternfly/react-core';
import { TableView, useTableState } from '../../../../components/table-view';
import type { CellRendererMap, ColumnConfigMap, FilterConfig } from '../../../../components/table-view/types';
import { DefaultEmptyStateNoData, DefaultEmptyStateNoResults } from '../../../../components/table-view/components/TableViewEmptyState';
import { formatDistanceToNow } from 'date-fns';
import { type Role, useRolesQuery } from '../../../../data/queries';
import { type Group, useGroupQuery } from '../../../../data/queries/groups';
import { useWorkspaceQuery } from '../../../../data/queries/workspaces';
import { useRoleBindingsQuery, useUpdateRoleBindingsMutation } from '../../../../data/queries/workspaces';
import useAppNavigate from '../../../../hooks/useAppNavigate';
import pathnames from '../../../../utilities/pathnames';
import { getModalContainer } from '../../../../helpers/modal-container';
import messages from '../../../../Messages';

/** When all of group, workspaceId, workspaceName are provided, modal is controlled by parent. Otherwise it runs in route mode (useParams + fetch). */
interface RoleAccessModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  group?: Group;
  workspaceId?: string;
  workspaceName?: string;
  onUpdate?: (selectedRoleIds: string[]) => void;
}

const TOGGLE_ALL = 'all';
const TOGGLE_SELECTED = 'selected';

const columns = ['name', 'description', 'permissions', 'lastModified'] as const;
type SortableColumn = 'name' | 'lastModified';
const sortableColumns: readonly SortableColumn[] = ['name', 'lastModified'];

export const RoleAccessModal: React.FC<RoleAccessModalProps> = ({
  isOpen: isOpenProp,
  onClose: onCloseProp,
  group: groupProp,
  workspaceId: workspaceIdProp,
  workspaceName: workspaceNameProp,
  onUpdate: onUpdateProp,
}) => {
  const navigate = useAppNavigate();
  const { workspaceId: workspaceIdParam, groupId: groupIdParam } = useParams<{ workspaceId: string; groupId: string }>();

  // Route mode: opened via URL .../role-access/:groupId — fetch group and workspace
  const isControlled = groupProp != null && workspaceIdProp != null && workspaceNameProp != null;
  const {
    data: groupData,
    isLoading: isGroupLoading,
    isError: isGroupError,
  } = useGroupQuery(groupIdParam ?? '', {
    enabled: !isControlled && !!groupIdParam,
  });
  const {
    data: workspace,
    isLoading: isWorkspaceLoading,
    isError: isWorkspaceError,
  } = useWorkspaceQuery(workspaceIdParam ?? '', {
    enabled: !isControlled && !!workspaceIdParam,
  });

  const handleRouteClose = useCallback(() => {
    if (workspaceIdParam) {
      navigate(pathnames['workspace-detail'].link(workspaceIdParam));
    }
  }, [navigate, workspaceIdParam]);

  const updateRoleBindings = useUpdateRoleBindingsMutation();

  const handleRouteUpdate = useCallback(
    (selectedRoleIds: string[]) => {
      if (!workspaceIdParam || !groupIdParam) return;
      updateRoleBindings.mutate(
        {
          resourceId: workspaceIdParam,
          resourceType: 'workspace',
          subjectId: groupIdParam,
          subjectType: 'group',
          roleIds: selectedRoleIds,
        },
        { onSuccess: handleRouteClose },
      );
    },
    [updateRoleBindings, workspaceIdParam, groupIdParam, handleRouteClose],
  );

  useEffect(() => {
    if (isControlled) return;
    if (workspaceIdParam && (!groupIdParam || isGroupError || isWorkspaceError)) {
      navigate(pathnames['workspace-detail'].link(workspaceIdParam));
    }
  }, [isControlled, workspaceIdParam, groupIdParam, isGroupError, isWorkspaceError, navigate]);

  const group: Group | undefined = isControlled
    ? groupProp
    : groupData
      ? {
          ...groupData,
          principalCount: groupData.principalCount ?? 0,
          roleCount: (groupData as Group).roleCount,
        }
      : undefined;
  const workspaceId = isControlled ? workspaceIdProp! : (workspaceIdParam ?? undefined);
  const workspaceName = isControlled ? workspaceNameProp! : (workspace?.name ?? '');
  const isOpen = isControlled ? (isOpenProp ?? true) : !!(workspaceId && groupIdParam && group && workspace);
  const onClose = isControlled ? (onCloseProp ?? (() => {})) : handleRouteClose;
  const onUpdate = isControlled ? onUpdateProp : handleRouteUpdate;

  if (!isControlled && (!workspaceIdParam || !groupIdParam)) {
    return null;
  }
  if (!isControlled && (isGroupLoading || isWorkspaceLoading || !group || !workspace)) {
    return null;
  }
  if (!group || workspaceId == null) {
    return null;
  }

  return (
    <RoleAccessModalContent
      isOpen={isOpen}
      onClose={onClose}
      onUpdate={onUpdate}
      group={group}
      workspaceId={workspaceId}
      workspaceName={workspaceName}
    />
  );
};

interface RoleAccessModalContentProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (selectedRoleIds: string[]) => void;
  group: Group;
  workspaceId: string;
  workspaceName: string;
}

const RoleAccessModalContent: React.FC<RoleAccessModalContentProps> = ({ isOpen, onClose, group, workspaceId, workspaceName, onUpdate }) => {
  const intl = useIntl();
  const [selectedToggle, setSelectedToggle] = useState(TOGGLE_ALL);

  // Fetch all roles using React Query
  const { data: rolesData, isLoading: isLoadingRoles } = useRolesQuery(
    {
      limit: 1000,
      offset: 0,
      addFields: ['access'],
    },
    { enabled: isOpen },
  );

  const allRoles = (rolesData?.data as Role[] | undefined) || [];

  // Fetch role bindings for this group in this workspace
  const { data: roleBindingsData, isLoading: isLoadingAssignedRoles } = useRoleBindingsQuery(
    {
      limit: 1000,
      subjectType: 'group',
      subjectId: group?.uuid || '',
      resourceType: 'workspace',
      resourceId: workspaceId,
    },
    { enabled: isOpen && !!group?.uuid && !!workspaceId },
  );

  // Purely derived from server state — no useState needed
  const assignedRoleIds = useMemo(() => {
    if (!roleBindingsData?.data) return [];
    return roleBindingsData.data.flatMap((binding) => binding.roles?.map((r) => r.id).filter((id): id is string => !!id) ?? []);
  }, [roleBindingsData?.data]);

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
        type: 'text',
        id: 'name',
        label: intl.formatMessage(messages.role),
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
    getRowId: (role) => role.uuid,
    initialFilters: { name: '' },
    initialSelectedRows: allRoles.filter((r) => assignedRoleIds.includes(r.uuid)),
  });

  const { clearSelection, clearAllFilters, onPageChange } = tableState;

  // Toggle is a display filter: show all roles or only selected
  const displayedRoles = useMemo(
    () => (selectedToggle === TOGGLE_SELECTED ? allRoles.filter((r) => tableState.isRowSelected(r)) : allRoles),
    [selectedToggle, allRoles, tableState.isRowSelected, tableState.selectedRows],
  );

  useEffect(() => {
    if (!isOpen) {
      setSelectedToggle(TOGGLE_ALL);
      clearAllFilters();
      onPageChange(1);
      clearSelection();
    }
  }, [isOpen, clearAllFilters, onPageChange, clearSelection]);

  const { filteredRoles, totalCount } = useMemo(() => {
    let filtered = displayedRoles;

    const searchValue = (tableState.filters.name as string) || '';
    if (searchValue) {
      filtered = filtered.filter((role) => (role.display_name || role.name || '').toLowerCase().includes(searchValue.toLowerCase()));
    }

    const sorted = [...filtered].sort((a, b) => {
      if (!tableState.sort) return 0;

      const { column, direction } = tableState.sort;
      let comparison = 0;

      if (column === 'name') {
        comparison = (a.display_name || a.name || '').localeCompare(b.display_name || b.name || '');
      } else if (column === 'lastModified') {
        comparison = new Date(a.modified || 0).getTime() - new Date(b.modified || 0).getTime();
      }

      return direction === 'asc' ? comparison : -comparison;
    });

    return {
      filteredRoles: sorted,
      totalCount: sorted.length,
    };
  }, [displayedRoles, tableState.filters, tableState.sort]);

  const pageRows = useMemo(() => {
    const startIndex = (tableState.page - 1) * tableState.perPage;
    const endIndex = startIndex + tableState.perPage;
    return filteredRoles.slice(startIndex, endIndex);
  }, [filteredRoles, tableState.page, tableState.perPage]);

  const cellRenderers: CellRendererMap<typeof columns, Role> = useMemo(
    () => ({
      name: (role) => role.display_name || role.name,
      description: (role) => role.description || '—',
      permissions: (role) => role.accessCount || 0,
      lastModified: (role) => (role.modified ? formatDistanceToNow(new Date(role.modified), { addSuffix: true }) : '—'),
    }),
    [],
  );

  const handleUpdate = useCallback(() => {
    const selectedIds = tableState.selectedRows.map((role) => role.uuid);
    if (onUpdate) {
      onUpdate(selectedIds);
    } else {
      onClose();
    }
  }, [tableState.selectedRows, onUpdate, onClose]);

  const hasChanges = useMemo(() => {
    const selectedIds = tableState.selectedRows.map((role) => role.uuid);
    if (selectedIds.length !== assignedRoleIds.length) return true;
    return !selectedIds.every((id) => assignedRoleIds.includes(id));
  }, [tableState.selectedRows, assignedRoleIds]);

  const isLoading = isLoadingRoles || isLoadingAssignedRoles;
  const selectedCount = tableState.selectedRows.length;

  const handleItemClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent | MouseEvent) => {
      const target = event.currentTarget as HTMLButtonElement;
      if (!target) return;
      const id = target.id;

      if (id === TOGGLE_SELECTED && tableState.selectedRows.length === 0) {
        return;
      }

      if (selectedToggle !== id) {
        setSelectedToggle(id);
        onPageChange(1);
      }
    },
    [selectedToggle, tableState.selectedRows.length, onPageChange],
  );

  const modalTitleId = 'role-access-modal-title';
  const modalBodyId = 'role-access-modal-body';

  return (
    <Modal
      variant={ModalVariant.large}
      isOpen={isOpen}
      onClose={onClose}
      appendTo={getModalContainer()}
      ouiaId="role-access-modal"
      aria-labelledby={modalTitleId}
      aria-describedby={modalBodyId}
    >
      <ModalHeader title={intl.formatMessage(messages.editAccess)} labelId={modalTitleId} />
      <ModalBody id={modalBodyId}>
        <Stack hasGutter>
          <StackItem>
            <p className="pf-v5-u-color-200">
              <FormattedMessage
                {...messages.grantOrRemoveAccess}
                values={{
                  b: (text: React.ReactNode) => <b>{text}</b>,
                  groupName: group?.name || '',
                  workspaceName: workspaceName,
                }}
              />
            </p>
          </StackItem>
          <StackItem isFilled>
            <TableView<typeof columns, Role, SortableColumn>
              columns={columns}
              columnConfig={columnConfig}
              sortableColumns={sortableColumns}
              data={isLoading ? undefined : pageRows}
              totalCount={totalCount}
              getRowId={(role) => role.uuid}
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
                      onChange={handleItemClick}
                    />
                    <ToggleGroupItem
                      id="selected-row-switch"
                      text={`${intl.formatMessage(messages.selected)} (${selectedCount})`}
                      buttonId={TOGGLE_SELECTED}
                      isSelected={selectedToggle === TOGGLE_SELECTED}
                      onChange={handleItemClick}
                      aria-disabled={tableState.selectedRows.length === 0}
                    />
                  </ToggleGroup>
                  {tableState.selectedRows.length === 0 && (
                    <Tooltip
                      id="selected-row-switch-tooltip"
                      content={intl.formatMessage(messages.selectAtLeastOneRowToFilter)}
                      triggerRef={() => document.getElementById('selected-row-switch') as HTMLButtonElement}
                    />
                  )}
                </>
              }
              {...tableState}
            />
          </StackItem>
        </Stack>
      </ModalBody>
      <ModalFooter>
        <ActionGroup>
          <Button variant="primary" onClick={handleUpdate} isDisabled={!hasChanges}>
            {intl.formatMessage(messages.update)}
          </Button>
          <Button variant="link" onClick={onClose}>
            {intl.formatMessage(messages.cancel)}
          </Button>
        </ActionGroup>
      </ModalFooter>
    </Modal>
  );
};
