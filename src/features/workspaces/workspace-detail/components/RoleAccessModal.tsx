import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalVariant } from '@patternfly/react-core/dist/dynamic/components/Modal';
import { ActionGroup, Pagination, ToggleGroup, ToggleGroupItem, Tooltip } from '@patternfly/react-core';
import { Stack, StackItem } from '@patternfly/react-core';
import { useDataViewPagination, useDataViewSelection } from '@patternfly/react-data-view/dist/dynamic/Hooks';
import { DataView, DataViewState } from '@patternfly/react-data-view';
import { DataViewToolbar } from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';
import { DataViewTable } from '@patternfly/react-data-view/dist/dynamic/DataViewTable';
import { SearchInput } from '@patternfly/react-core/dist/dynamic/components/SearchInput';
import { DataViewTh } from '@patternfly/react-data-view';
import { SkeletonTableBody, SkeletonTableHead } from '@patternfly/react-component-groups';
import { BulkSelect, BulkSelectValue } from '@patternfly/react-component-groups/dist/dynamic/BulkSelect';
import { formatDistanceToNow } from 'date-fns';
import { fetchRolesWithPolicies } from '../../../../redux/roles/actions';
import { selectIsRolesLoading, selectRoles } from '../../../../redux/roles/selectors';
import { getRoleBindingsForSubject } from '../../../../redux/workspaces/helper';
import { getModalContainer } from '../../../../helpers/modal-container';
import { Group } from '../../../../redux/groups/reducer';
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

const perPageOptions = [
  { title: '5', value: 5 },
  { title: '10', value: 10 },
  { title: '20', value: 20 },
  { title: '50', value: 50 },
];

export const RoleAccessModal: React.FC<RoleAccessModalProps> = ({ isOpen, onClose, group, workspaceId, workspaceName, onUpdate }) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const [selectedToggle, setSelectedToggle] = useState(TOGGLE_ALL);
  const [assignedRoleIds, setAssignedRoleIds] = useState<string[]>([]);
  const [isLoadingAssignedRoles, setIsLoadingAssignedRoles] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [sortBy, setSortBy] = useState<{ index: number; direction: 'asc' | 'desc' }>({ index: 0, direction: 'asc' });

  // DataView hooks
  const pagination = useDataViewPagination({ perPage: 10 });
  const selection = useDataViewSelection({
    matchOption: (a, b) => a.id === b.id,
  });

  const { selected, onSelect } = selection;
  const { page, perPage, onSetPage } = pagination;

  // Use refs to store callbacks to avoid infinite loops in useEffect dependencies
  const onSelectRef = useRef(onSelect);
  const onSetPageRef = useRef(onSetPage);

  // Update refs when callbacks change
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    onSetPageRef.current = onSetPage;
  }, [onSetPage]);

  // Redux selectors
  const allRoles = useSelector(selectRoles);
  const isLoadingRoles = useSelector(selectIsRolesLoading);

  // Fetch all available roles
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

  // Fetch currently assigned roles for the group in this workspace
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
          // Set initial selection based on assigned roles
          const assignedRoles = allRoles.filter((role) => assignedIds.includes(role.uuid));
          onSelectRef.current(
            true,
            assignedRoles.map((role) => ({ id: role.uuid })),
          );
        })
        .catch((error) => {
          console.error('Error fetching assigned roles:', error);
          setAssignedRoleIds([]);
          onSelectRef.current(false);
        })
        .finally(() => {
          setIsLoadingAssignedRoles(false);
        });
    }
  }, [isOpen, group?.uuid, workspaceId, allRoles]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedToggle(TOGGLE_ALL);
      setSearchValue('');
      onSetPageRef.current(undefined, 1);
      onSelectRef.current(false);
      setAssignedRoleIds([]);
    }
  }, [isOpen]);

  // Reset page to 1 when switching toggles to prevent empty pages
  useEffect(() => {
    onSetPageRef.current(undefined, 1);
  }, [selectedToggle]);

  // Reset toggle to all when selection is cleared
  useEffect(() => {
    if (selected.length === 0) {
      setSelectedToggle(TOGGLE_ALL);
    }
  }, [selected]);

  // Filter and sort roles
  const { filteredRoles, totalCount } = useMemo(() => {
    let filtered = allRoles;

    // Apply search filter (only by role name)
    if (searchValue) {
      filtered = filtered.filter((role) => (role.display_name || role.name || '').toLowerCase().includes(searchValue.toLowerCase()));
    }

    // Filter by toggle
    if (selectedToggle === TOGGLE_SELECTED) {
      const selectedIds = selected.map((sel) => sel.id);
      filtered = filtered.filter((role) => selectedIds.includes(role.uuid));
    }

    // Sort roles
    const sorted = [...filtered].sort((a, b) => {
      const { index, direction } = sortBy;
      let comparison = 0;

      switch (index) {
        case 0: // Role name
          comparison = (a.display_name || a.name || '').localeCompare(b.display_name || b.name || '');
          break;
        case 3: // Last modified
          comparison = new Date(a.modified || 0).getTime() - new Date(b.modified || 0).getTime();
          break;
        default:
          comparison = 0;
      }

      return direction === 'asc' ? comparison : -comparison;
    });

    return {
      filteredRoles: sorted,
      totalCount: sorted.length,
    };
  }, [allRoles, searchValue, selectedToggle, selected, sortBy]);

  // Paginate filtered roles
  const pageRows = useMemo(() => {
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    return filteredRoles.slice(startIndex, endIndex);
  }, [filteredRoles, page, perPage]);

  // Handle bulk selection
  const handleBulkSelect = useCallback(
    (value: BulkSelectValue) => {
      if (value === BulkSelectValue.none) {
        onSelect(false);
      } else if (value === BulkSelectValue.page) {
        // Select all roles on current page
        onSelect(
          true,
          pageRows.map((role) => ({ id: role.uuid })),
        );
      } else if (value === BulkSelectValue.nonePage) {
        // Deselect all roles on current page
        const pageRowIds = pageRows.map((role) => role.uuid);
        const remainingSelected = selected.filter((sel) => !pageRowIds.includes(sel.id));
        onSelect(true, remainingSelected);
      }
    },
    [pageRows, selected, onSelect],
  );

  // Handle update
  const handleUpdate = useCallback(() => {
    const selectedIds = selected.map((sel) => sel.id);
    onUpdate?.(selectedIds);
    onClose();
  }, [selected, onUpdate, onClose]);

  // Check if there are changes
  const hasChanges = useMemo(() => {
    const selectedIds = selected.map((sel) => sel.id);
    if (selectedIds.length !== assignedRoleIds.length) return true;
    return !selectedIds.every((id) => assignedRoleIds.includes(id));
  }, [selected, assignedRoleIds]);

  // Build table rows
  const tableRows = useMemo(() => {
    return pageRows.map((role) => ({
      id: role.uuid,
      row: [
        role.display_name || role.name,
        role.description || '—',
        role.accessCount || 0,
        role.modified ? formatDistanceToNow(new Date(role.modified), { addSuffix: true }) : '—',
      ],
    }));
  }, [pageRows]);

  // Column definitions
  const columns: DataViewTh[] = useMemo(
    () => [
      {
        cell: (() => {
          const roleText = intl.formatMessage(messages.role);
          return roleText.charAt(0).toUpperCase() + roleText.slice(1);
        })(),
        props: {
          sort: {
            sortBy: {
              index: sortBy.index,
              direction: sortBy.direction,
              defaultDirection: 'asc',
            },
            onSort: (_event: React.MouseEvent, index: number, direction: 'asc' | 'desc') => {
              setSortBy({ index, direction });
            },
            columnIndex: 0,
          },
        },
      },
      {
        cell: intl.formatMessage(messages.description),
        props: {},
      },
      {
        cell: intl.formatMessage(messages.permissions),
        props: {},
      },
      {
        cell: intl.formatMessage(messages.lastModified),
        props: {
          sort: {
            sortBy: {
              index: sortBy.index,
              direction: sortBy.direction,
              defaultDirection: 'asc',
            },
            onSort: (_event: React.MouseEvent, index: number, direction: 'asc' | 'desc') => {
              setSortBy({ index, direction });
            },
            columnIndex: 3,
          },
        },
      },
    ],
    [intl, sortBy],
  );

  const isLoading = isLoadingRoles || isLoadingAssignedRoles;
  const activeState = isLoading ? DataViewState.loading : totalCount === 0 ? DataViewState.empty : undefined;

  const selectedCount = selected.length;

  // Bulk select component
  const bulkSelectComponent = useMemo(() => {
    const selectedOnPage = pageRows.filter((role) => selected.some((sel) => sel.id === role.uuid)).length;
    const pageSelected = selectedOnPage > 0 && selectedOnPage === pageRows.length;
    const pagePartiallySelected = selectedOnPage > 0 && selectedOnPage < pageRows.length;

    return (
      <BulkSelect
        isDataPaginated={true}
        selectedCount={selectedCount}
        totalCount={totalCount}
        pageCount={pageRows.length}
        pageSelected={pageSelected}
        pagePartiallySelected={pagePartiallySelected}
        onSelect={handleBulkSelect}
      />
    );
  }, [selectedCount, totalCount, pageRows, selected, handleBulkSelect]);

  // Handle toggle item click
  const handleItemClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent | MouseEvent) => {
      const target = event.currentTarget as HTMLButtonElement;
      if (!target) return;
      const id = target.id;

      if (id === TOGGLE_SELECTED && selected.length === 0) {
        return;
      }

      if (selectedToggle !== id) {
        setSelectedToggle(id);
        onSetPage(undefined, 1);
      }
    },
    [selectedToggle, selected.length, onSetPage],
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
            <DataView activeState={activeState} selection={selection}>
              <DataViewToolbar
                bulkSelect={bulkSelectComponent}
                toggleGroup={
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
                      aria-disabled={selected.length === 0}
                    />
                  </ToggleGroup>
                }
                pagination={<Pagination perPageOptions={perPageOptions} itemCount={totalCount} {...pagination} />}
                filters={
                  <SearchInput
                    placeholder={intl.formatMessage(messages.filterByKey, { key: intl.formatMessage(messages.role) })}
                    value={searchValue}
                    onChange={(_e, value) => {
                      setSearchValue(value);
                      onSetPage(undefined, 1);
                    }}
                    onClear={() => {
                      setSearchValue('');
                      onSetPage(undefined, 1);
                    }}
                    aria-label={intl.formatMessage(messages.filterByKey, { key: intl.formatMessage(messages.role) })}
                  />
                }
              />
              {selected.length === 0 && (
                <Tooltip
                  id="selected-row-switch-tooltip"
                  content="Select at least one row to enable this filter"
                  triggerRef={() => document.getElementById('selected-row-switch') as HTMLButtonElement}
                />
              )}
              <DataViewTable
                variant="compact"
                aria-label="Roles selection table"
                columns={columns}
                rows={tableRows}
                headStates={{
                  loading: (
                    <SkeletonTableHead
                      columns={columns.map((col) => {
                        const cellValue = (col as { cell?: string | React.ReactNode }).cell;
                        return typeof cellValue === 'string' ? cellValue : '';
                      })}
                    />
                  ),
                }}
                bodyStates={{
                  loading: <SkeletonTableBody rowsCount={10} columnsCount={columns.length} />,
                  empty: <div className="pf-v5-u-p-md">{intl.formatMessage(messages.noRolesFound)}</div>,
                }}
              />
              <DataViewToolbar pagination={<Pagination perPageOptions={perPageOptions} itemCount={totalCount} {...pagination} />} />
            </DataView>
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
