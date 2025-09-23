import React, { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useIntl } from 'react-intl';
import { DataViewState, DataViewTextFilter, DataViewTh } from '@patternfly/react-data-view';
import { BulkSelect, BulkSelectValue } from '@patternfly/react-component-groups/dist/dynamic/BulkSelect';
import { DataView } from '@patternfly/react-data-view/dist/dynamic/DataView';
import { DataViewToolbar } from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';
import { DataViewTable } from '@patternfly/react-data-view/dist/dynamic/DataViewTable';
import DataViewFilters from '@patternfly/react-data-view/dist/cjs/DataViewFilters';
import { Pagination } from '@patternfly/react-core/dist/dynamic/components/Pagination';
import { Tooltip } from '@patternfly/react-core/dist/dynamic/components/Tooltip';
import EllipsisVIcon from '@patternfly/react-icons/dist/js/icons/ellipsis-v-icon';
import { ThProps } from '@patternfly/react-table';
import { SkeletonTableBody, SkeletonTableHead } from '@patternfly/react-component-groups';
import { UserGroupsEmptyState } from './UserGroupsEmptyState';
import { Dropdown } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { DropdownItem } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { DropdownList } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { MenuToggle } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import { MenuToggleElement } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';

import { Group } from '../../../../../redux/groups/reducer';
import messages from '../../../../../Messages';

// User group row actions component
interface GroupRowActionsProps {
  group: Group;
  onEdit: (group: Group) => void;
  onDelete: (group: Group) => void;
  orgAdmin?: boolean;
  isProd?: boolean;
  ouiaId?: string;
}

const GroupRowActions: React.FC<GroupRowActionsProps> = ({ group, onEdit, onDelete, orgAdmin = true, isProd = false, ouiaId }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const intl = useIntl();

  // Edit actions disabled for system or platform default groups
  const isEditDisabled = group.platform_default || group.system;

  // Delete actions disabled for system/platform groups OR if not org admin OR in production
  const isDeleteDisabled = group.platform_default || group.system || !orgAdmin || isProd;

  return (
    <Dropdown
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          aria-label={`Actions for group ${group.name}`}
          variant="plain"
          onClick={() => setIsOpen(!isOpen)}
          isExpanded={isOpen}
          data-ouia-component-id={`${ouiaId}-menu-toggle`}
        >
          <EllipsisVIcon />
        </MenuToggle>
      )}
      ouiaId={ouiaId}
    >
      <DropdownList>
        <DropdownItem
          key="edit"
          onClick={() => {
            setIsOpen(false);
            onEdit(group);
          }}
          isDisabled={isEditDisabled}
          data-ouia-component-id={`${ouiaId}-edit`}
        >
          {intl.formatMessage(messages['usersAndUserGroupsEditUserGroup'])}
        </DropdownItem>
        <DropdownItem
          key="delete"
          onClick={() => {
            setIsOpen(false);
            onDelete(group);
          }}
          isDisabled={isDeleteDisabled}
          data-ouia-component-id={`${ouiaId}-delete`}
        >
          {intl.formatMessage(messages['usersAndUserGroupsDeleteUserGroup'])}
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );
};

interface UserGroupsTableProps {
  // Data props
  groups: Group[];
  totalCount: number;
  isLoading: boolean;
  focusedGroup?: Group;

  // UI configuration props
  defaultPerPage?: number;
  enableActions?: boolean;
  orgAdmin?: boolean;
  isProd?: boolean;
  ouiaId?: string;

  // Data view state props - managed by container
  sortBy?: string;
  direction?: 'asc' | 'desc';
  onSort: (event: any, key: string, direction: 'asc' | 'desc') => void;
  filters: { name: string };
  onSetFilters: (filters: Partial<{ name: string }>) => void;
  clearAllFilters: () => void;
  page: number;
  perPage: number;
  onSetPage: (event: React.MouseEvent | React.KeyboardEvent | MouseEvent, page: number) => void;
  onPerPageSelect: (event: React.MouseEvent | React.KeyboardEvent | MouseEvent, perPage: number) => void;
  pagination: any; // DataViewPagination hook return type

  // Selection object from useDataViewSelection hook
  selection?: any; // DataView selection object

  // Event handler props
  onRowClick?: (group: Group | undefined) => void;
  onEditGroup?: (group: Group) => void;
  onDeleteGroup?: (group: Group) => void;

  // Children for modals
  children?: React.ReactNode;
}

export const UserGroupsTable: React.FC<UserGroupsTableProps> = ({
  groups,
  totalCount,
  isLoading,
  focusedGroup,

  enableActions = true,
  orgAdmin = true,
  isProd = false,
  ouiaId = 'iam-user-groups-table',
  sortBy,
  direction,
  onSort,
  filters,
  onSetFilters,
  clearAllFilters,
  page,
  perPage,
  onSetPage,
  onPerPageSelect,

  selection,
  onRowClick,
  onEditGroup,
  onDeleteGroup,
  children,
}) => {
  const intl = useIntl();

  // Define columns - selection is handled automatically by DataView
  const columns = useMemo(() => {
    const baseColumns = [
      { label: intl.formatMessage(messages.name), key: 'name', sort: true },
      { label: intl.formatMessage(messages.description), key: 'description', sort: false },
      { label: intl.formatMessage(messages.users), key: 'principalCount', sort: true },
      { label: intl.formatMessage(messages.serviceAccounts), key: 'serviceAccountCount', sort: false },
      { label: intl.formatMessage(messages.roles), key: 'roleCount', sort: false },
      { label: intl.formatMessage(messages.workspaces), key: 'workspaceCount', sort: false },
      { label: intl.formatMessage(messages.lastModified), key: 'modified', sort: true },
      { label: 'Actions', key: 'actions', sort: false },
    ];

    return baseColumns.map((col, index) => ({ ...col, index }));
  }, [intl]);

  // All data view state is now managed by container - just compute derived values

  const sortByIndex = useMemo(() => {
    const columnIndex = columns.findIndex((column) => column.key === (sortBy || 'name'));
    return columnIndex;
  }, [sortBy, columns]);

  const getSortParams = (columnIndex: number): ThProps['sort'] => ({
    sortBy: {
      index: sortByIndex,
      direction: direction || 'asc',
      defaultDirection: 'asc',
    },
    onSort: (_event, index, direction) => onSort(_event, columns[index].key, direction),
    columnIndex,
  });

  const sortableColumns: DataViewTh[] = columns.map((column, index) => ({
    cell: column.label,
    props: {
      ...(column.sort ? { sort: getSortParams(index) } : {}),
      ...((column as any).screenReaderText ? { screenReaderText: (column as any).screenReaderText } : {}),
    },
  }));

  // Filtering and pagination state now comes from props (container manages it)

  // Selection is now managed by container - no hooks needed

  // Transform groups into table rows
  const rows = useMemo(() => {
    const handleRowClick = (event: any, group: Group | undefined) => {
      if (event.target.matches('td') || event.target.matches('tr')) {
        onRowClick?.(group);
      }
    };

    return groups.map((group: Group) => ({
      id: group.uuid,
      row: [
        group.name,
        group.description ? (
          <Tooltip isContentLeftAligned content={group.description}>
            <span>{group.description.length > 23 ? `${group.description.slice(0, 20)}...` : group.description}</span>
          </Tooltip>
        ) : (
          <div className="pf-v5-u-color-400">{intl.formatMessage(messages['usersAndUserGroupsNoDescription'])}</div>
        ),
        group.principalCount,
        '?', // not currently in API
        group.roleCount,
        '?', // not currently in API
        group.modified ? formatDistanceToNow(new Date(group.modified), { addSuffix: true }) : '',
        enableActions && (
          <GroupRowActions
            key={`${group.uuid}-actions`}
            group={group}
            onEdit={onEditGroup || (() => {})}
            onDelete={onDeleteGroup || (() => {})}
            orgAdmin={orgAdmin}
            isProd={isProd}
            ouiaId={`${ouiaId}-${group.uuid}-actions`}
          />
        ),
      ],
      props: {
        isClickable: true,
        onRowClick: (event: any) => handleRowClick(event, focusedGroup?.uuid === group.uuid ? undefined : group),
        isRowSelected: false, // TODO: fix selection detection
      },
    }));
  }, [groups, focusedGroup, intl, enableActions, onRowClick, onEditGroup, onDeleteGroup, ouiaId]);

  // Selection is now handled by DataView via the selection prop

  // Selection is now purely handled via props - no automatic effects

  // const pageSelected = rows.length > 0 && rows.every((row) => selected.some((sel) => sel.id === row.id));
  // const pagePartiallySelected = !pageSelected && rows.some((row) => selected.some((sel) => sel.id === row.id));

  const loadingHeader = <SkeletonTableHead columns={columns.map((column) => column.label)} />;
  const loadingBody = <SkeletonTableBody rowsCount={10} columnsCount={columns.length} />;

  const activeState = isLoading ? DataViewState.loading : groups.length === 0 ? DataViewState.empty : undefined;

  return (
    <>
      <DataView activeState={activeState} selection={selection}>
        <DataViewToolbar
          bulkSelect={
            enableActions && selection ? (
              <BulkSelect
                isDataPaginated
                pageCount={groups.length}
                selectedCount={selection.selected?.length || 0}
                totalCount={totalCount}
                onSelect={(value) => {
                  if (value === BulkSelectValue.none) {
                    selection.onSelect?.(false);
                  } else if (value === BulkSelectValue.page) {
                    selection.onSelect?.(true, rows);
                  } else if (value === BulkSelectValue.nonePage) {
                    selection.onSelect?.(false, rows);
                  }
                }}
              />
            ) : undefined
          }
          pagination={
            <Pagination perPage={perPage} page={page} itemCount={totalCount} onSetPage={onSetPage} onPerPageSelect={onPerPageSelect} isCompact />
          }
          filters={
            <DataViewFilters onChange={(_e, values) => onSetFilters(values)} values={filters}>
              <DataViewTextFilter filterId="name" title="Name" placeholder="Filter by name" />
            </DataViewFilters>
          }
          clearAllFilters={clearAllFilters}
        />
        <DataViewTable
          variant="compact"
          aria-label="User Groups Table"
          ouiaId={`${ouiaId}-table`}
          columns={sortableColumns}
          rows={rows}
          headStates={{ loading: loadingHeader }}
          bodyStates={{
            loading: loadingBody,
            empty: <UserGroupsEmptyState colSpan={6} />,
          }}
        />
        <DataViewToolbar
          ouiaId={`${ouiaId}-footer-toolbar`}
          pagination={<Pagination perPage={perPage} page={page} itemCount={totalCount} onSetPage={onSetPage} onPerPageSelect={onPerPageSelect} />}
        />
      </DataView>
      {children}
    </>
  );
};
