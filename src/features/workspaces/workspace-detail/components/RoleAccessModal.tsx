import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalVariant } from '@patternfly/react-core/dist/dynamic/components/Modal';
import { ActionGroup, ToggleGroup, ToggleGroupItem, Tooltip } from '@patternfly/react-core';
import { Stack, StackItem } from '@patternfly/react-core';
import { TableView, useTableState } from '../../../../components/table-view';
import type { CellRendererMap, ColumnConfigMap, FilterConfig } from '../../../../components/table-view/types';
import { DefaultEmptyStateNoData, DefaultEmptyStateNoResults } from '../../../../components/table-view/components/TableViewEmptyState';
import { formatDistanceToNow } from 'date-fns';
import { fetchRolesWithPolicies } from '../../../../redux/roles/actions';
import { selectIsRolesLoading, selectRoles } from '../../../../redux/roles/selectors';
import { getRoleBindingsForSubject } from '../../../../redux/workspaces/helper';
import { getModalContainer } from '../../../../helpers/modal-container';
import { Group } from '../../../../redux/groups/reducer';
import { Role } from '../../../../redux/roles/reducer';
import messages from '../../../../Messages';

interface RoleAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  workspaceId: string;
  workspaceName: string;
  onUpdate?: (selectedRoleIds: string[]) => void;
}

const TOGGLE_ALL = 'all';
const TOGGLE_SELECTED = 'selected';

const columns = ['name', 'description', 'permissions', 'lastModified'] as const;
type SortableColumn = 'name' | 'lastModified';
const sortableColumns: readonly SortableColumn[] = ['name', 'lastModified'];

export const RoleAccessModal: React.FC<RoleAccessModalProps> = ({ isOpen, onClose, group, workspaceId, workspaceName, onUpdate }) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const [selectedToggle, setSelectedToggle] = useState(TOGGLE_ALL);
  const [assignedRoleIds, setAssignedRoleIds] = useState<string[]>([]);
  const [isLoadingAssignedRoles, setIsLoadingAssignedRoles] = useState(false);

  const allRoles = useSelector(selectRoles);
  const isLoadingRoles = useSelector(selectIsRolesLoading);

  const columnConfig: ColumnConfigMap<typeof columns> = useMemo(
    () => ({
      name: { label: intl.formatMessage(messages.role).charAt(0).toUpperCase() + intl.formatMessage(messages.role).slice(1), sortable: true },
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
  });

  useEffect(() => {
    if (isOpen) {
      dispatch(
        fetchRolesWithPolicies({
          limit: 1000,
          offset: 0,
        }),
      );
    }
  }, [isOpen, dispatch]);

  useEffect(() => {
    if (isOpen && group?.uuid && workspaceId && allRoles.length > 0) {
      setIsLoadingAssignedRoles(true);
      getRoleBindingsForSubject({
        limit: 1000,
        subjectType: 'group',
        subjectId: group.uuid,
        resourceType: 'workspace',
        resourceId: workspaceId,
      })
        .then((result) => {
          interface RoleBinding {
            roles?: Array<{ id: string }>;
          }
          const assignedIds =
            result.data?.flatMap((binding: RoleBinding) => binding.roles?.map((role) => role.id).filter((id): id is string => !!id) || []) || [];
          setAssignedRoleIds(assignedIds);
          const assignedRoles = allRoles.filter((role) => assignedIds.includes(role.uuid));
          tableState.clearSelection();
          assignedRoles.forEach((role) => {
            tableState.onSelectRow(role, true);
          });
        })
        .catch((error) => {
          console.error('Error fetching assigned roles:', error);
          setAssignedRoleIds([]);
          tableState.clearSelection();
        })
        .finally(() => {
          setIsLoadingAssignedRoles(false);
        });
    }
  }, [isOpen, group?.uuid, workspaceId, allRoles]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedToggle(TOGGLE_ALL);
      tableState.onFiltersChange({ name: '' });
      tableState.onPageChange(1);
      tableState.clearSelection();
      setAssignedRoleIds([]);
    }
  }, [isOpen]);

  useEffect(() => {
    tableState.onPageChange(1);
  }, [selectedToggle, tableState.onPageChange]);

  useEffect(() => {
    if (tableState.selectedRows.length === 0) {
      setSelectedToggle(TOGGLE_ALL);
    }
  }, [tableState.selectedRows]);

  const { filteredRoles, totalCount } = useMemo(() => {
    let filtered = allRoles;

    const searchValue = (tableState.filters.name as string) || '';
    if (searchValue) {
      filtered = filtered.filter((role) => (role.display_name || role.name || '').toLowerCase().includes(searchValue.toLowerCase()));
    }

    if (selectedToggle === TOGGLE_SELECTED) {
      const selectedIds = new Set(tableState.selectedRows.map((role) => role.uuid));
      filtered = filtered.filter((role) => selectedIds.has(role.uuid));
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
  }, [allRoles, tableState.filters, selectedToggle, tableState.selectedRows, tableState.sort]);

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
    onUpdate?.(selectedIds);
    onClose();
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
        tableState.onPageChange(1);
      }
    },
    [selectedToggle, tableState.selectedRows.length, tableState.onPageChange],
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
                      content="Select at least one row to enable this filter"
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
