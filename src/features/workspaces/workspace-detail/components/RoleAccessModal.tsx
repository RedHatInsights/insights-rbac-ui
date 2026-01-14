import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Modal, ModalVariant } from '@patternfly/react-core/dist/dynamic/components/Modal';
import { Tab, Tabs } from '@patternfly/react-core/dist/dynamic/components/Tabs';
import { Stack, StackItem } from '@patternfly/react-core';
import { DataView, DataViewState } from '@patternfly/react-data-view';
import { DataViewToolbar } from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';
import { DataViewTable } from '@patternfly/react-data-view/dist/dynamic/DataViewTable';
import { SearchInput } from '@patternfly/react-core/dist/dynamic/components/SearchInput';
import { DataViewTh } from '@patternfly/react-data-view';
import { Checkbox } from '@patternfly/react-core/dist/dynamic/components/Checkbox';
import { Pagination } from '@patternfly/react-core/dist/dynamic/components/Pagination';
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

const TAB_KEYS = {
  all: 'all',
  selected: 'selected',
} as const;

export const RoleAccessModal: React.FC<RoleAccessModalProps> = ({ isOpen, onClose, group, workspaceId, workspaceName, onUpdate }) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState<string>(TAB_KEYS.all);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [assignedRoleIds, setAssignedRoleIds] = useState<string[]>([]);
  const [isLoadingAssignedRoles, setIsLoadingAssignedRoles] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<{ index: number; direction: 'asc' | 'desc' }>({ index: 1, direction: 'asc' });

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
    if (isOpen && group?.uuid && workspaceId) {
      setIsLoadingAssignedRoles(true);
      getRoleBindingsForSubject({
        limit: 1000,
        subjectType: 'group',
        subjectId: group.uuid,
        resourceType: 'workspace',
        resourceId: workspaceId,
      })
        .then((result) => {
          const assignedIds = result.data?.flatMap((binding) => binding.roles?.map((role) => role.id).filter((id): id is string => !!id) || []) || [];
          setAssignedRoleIds(assignedIds);
          setSelectedRoleIds(assignedIds);
        })
        .catch((error) => {
          console.error('Error fetching assigned roles:', error);
          setAssignedRoleIds([]);
          setSelectedRoleIds([]);
        })
        .finally(() => {
          setIsLoadingAssignedRoles(false);
        });
    }
  }, [isOpen, group?.uuid, workspaceId]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setActiveTab(TAB_KEYS.all);
      setSearchValue('');
      setPage(1);
      setSelectedRoleIds([]);
      setAssignedRoleIds([]);
    }
  }, [isOpen]);

  // Reset page to 1 when switching tabs to prevent empty pages
  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  // Filter and sort roles
  const { filteredRoles, totalCount } = useMemo(() => {
    let filtered = allRoles;

    // Apply search filter (only by role name)
    if (searchValue) {
      filtered = filtered.filter(
        (role) =>
          (role.display_name || role.name || '').toLowerCase().includes(searchValue.toLowerCase()),
      );
    }

    // Filter by tab
    if (activeTab === TAB_KEYS.selected) {
      filtered = filtered.filter((role) => selectedRoleIds.includes(role.uuid));
    }

    // Sort roles
    const sorted = [...filtered].sort((a, b) => {
      const { index, direction } = sortBy;
      let comparison = 0;

      switch (index) {
        case 1: // Role name
          comparison = (a.display_name || a.name || '').localeCompare(b.display_name || b.name || '');
          break;
        case 4: // Last modified
          comparison = new Date(a.modified || 0).getTime() - new Date(b.modified || 0).getTime();
          break;
        default:
          comparison = 0;
      }

      return direction === 'asc' ? comparison : -comparison;
    });

    // Paginate
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginated = sorted.slice(startIndex, endIndex);

    return {
      filteredRoles: paginated,
      totalCount: sorted.length,
    };
  }, [allRoles, searchValue, activeTab, selectedRoleIds, sortBy, page, perPage]);

  // Handle role selection
  const handleRoleToggle = useCallback((roleId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedRoleIds((prev) => [...prev, roleId]);
    } else {
      setSelectedRoleIds((prev) => prev.filter((id) => id !== roleId));
    }
  }, []);

  // Handle bulk selection
  const handleBulkSelect = useCallback(
    (value: BulkSelectValue) => {
      if (value === BulkSelectValue.none) {
        // Deselect all roles
        setSelectedRoleIds([]);
      } else if (value === BulkSelectValue.page) {
        // Select all roles on current page
        const currentPageRoleIds = filteredRoles.map((role) => role.uuid);
        setSelectedRoleIds((prev) => {
          const newSelection = [...prev];
          currentPageRoleIds.forEach((id) => {
            if (!newSelection.includes(id)) {
              newSelection.push(id);
            }
          });
          return newSelection;
        });
      } else if (value === BulkSelectValue.nonePage) {
        // Deselect all roles on current page
        const currentPageRoleIds = filteredRoles.map((role) => role.uuid);
        setSelectedRoleIds((prev) => prev.filter((id) => !currentPageRoleIds.includes(id)));
      }
    },
    [filteredRoles],
  );

  // Handle update
  const handleUpdate = useCallback(() => {
    onUpdate?.(selectedRoleIds);
    onClose();
  }, [selectedRoleIds, onUpdate, onClose]);

  // Check if there are changes
  const hasChanges = useMemo(() => {
    if (selectedRoleIds.length !== assignedRoleIds.length) return true;
    return !selectedRoleIds.every((id) => assignedRoleIds.includes(id));
  }, [selectedRoleIds, assignedRoleIds]);

  // Build table rows
  const tableRows = useMemo(() => {
    return filteredRoles.map((role) => {
      const isSelected = selectedRoleIds.includes(role.uuid);
      return {
        id: role.uuid,
        row: [
          {
            cell: (
              <Checkbox
                id={`select-${role.uuid}`}
                isChecked={isSelected}
                onChange={(_event, checked) => handleRoleToggle(role.uuid, checked)}
                aria-label={`Select ${role.display_name || role.name}`}
              />
            ),
            props: { className: 'pf-v5-c-table__check' },
          },
          role.display_name || role.name,
          role.description || '—',
          role.accessCount || 0,
          role.modified ? formatDistanceToNow(new Date(role.modified), { addSuffix: true }) : '—',
        ],
      };
    });
  }, [filteredRoles, selectedRoleIds, handleRoleToggle]);

  // Column definitions
  const columns: DataViewTh[] = useMemo(
    () => [
      { cell: '', props: {} }, // Checkbox column
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
            columnIndex: 1,
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
            columnIndex: 4,
          },
        },
      },
    ],
    [intl, sortBy],
  );

  const isLoading = isLoadingRoles || isLoadingAssignedRoles;
  const activeState = isLoading ? DataViewState.loading : totalCount === 0 ? DataViewState.empty : undefined;

  const selectedCount = selectedRoleIds.length;

  // Bulk select component
  const bulkSelectComponent = useMemo(() => {
    const selectedOnPage = filteredRoles.filter((role) => selectedRoleIds.includes(role.uuid)).length;
    const pageSelected = selectedOnPage > 0 && selectedOnPage === filteredRoles.length;
    const pagePartiallySelected = selectedOnPage > 0 && selectedOnPage < filteredRoles.length;

    return (
      <BulkSelect
        isDataPaginated={true}
        selectedCount={selectedCount}
        totalCount={totalCount}
        pageCount={filteredRoles.length}
        pageSelected={pageSelected}
        pagePartiallySelected={pagePartiallySelected}
        onSelect={handleBulkSelect}
      />
    );
  }, [selectedCount, totalCount, filteredRoles, selectedRoleIds, handleBulkSelect]);

  return (
    <Modal
      title={intl.formatMessage(messages.editAccess)}
      variant={ModalVariant.large}
      isOpen={isOpen}
      onClose={onClose}
      appendTo={getModalContainer()}
      actions={[
        <Button key="update" variant="primary" onClick={handleUpdate} isDisabled={!hasChanges}>
          {intl.formatMessage(messages.update)}
        </Button>,
        <Button key="cancel" variant="link" onClick={onClose}>
          {intl.formatMessage(messages.cancel)}
        </Button>,
      ]}
      ouiaId="role-access-modal"
    >
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
        <StackItem>
          <Tabs activeKey={activeTab} onSelect={(_event, tabKey) => setActiveTab(tabKey as string)}>
            <Tab eventKey={TAB_KEYS.all} title={intl.formatMessage(messages.all)} />
            <Tab eventKey={TAB_KEYS.selected} title={`${intl.formatMessage(messages.selected)} (${selectedCount})`} />
          </Tabs>
        </StackItem>
        <StackItem isFilled>
          <DataView activeState={activeState}>
            <DataViewToolbar
              bulkSelect={bulkSelectComponent}
              pagination={
                <Pagination
                  itemCount={totalCount}
                  page={page}
                  perPage={perPage}
                  onSetPage={(_event, newPage) => setPage(newPage)}
                  onPerPageSelect={(_event, newPerPage) => {
                    setPerPage(newPerPage);
                    setPage(1);
                  }}
                  isCompact
                />
              }
              filters={
                <SearchInput
                  placeholder={intl.formatMessage(messages.filterByKey, { key: intl.formatMessage(messages.role) })}
                  value={searchValue}
                  onChange={(_e, value) => {
                    setSearchValue(value);
                    setPage(1);
                  }}
                  onClear={() => {
                    setSearchValue('');
                    setPage(1);
                  }}
                  aria-label={intl.formatMessage(messages.filterByKey, { key: intl.formatMessage(messages.role) })}
                />
              }
            />
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
            <DataViewToolbar
              pagination={
                <Pagination
                  itemCount={totalCount}
                  page={page}
                  perPage={perPage}
                  onSetPage={(_event, newPage) => setPage(newPage)}
                  onPerPageSelect={(_event, newPerPage) => {
                    setPerPage(newPerPage);
                    setPage(1);
                  }}
                />
              }
            />
          </DataView>
        </StackItem>
      </Stack>
    </Modal>
  );
};
