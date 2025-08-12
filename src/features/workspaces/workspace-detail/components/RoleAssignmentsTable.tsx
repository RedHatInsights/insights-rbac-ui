import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useIntl } from 'react-intl';
import { DataViewState, DataViewTextFilter, DataViewTh } from '@patternfly/react-data-view';
import { BulkSelect, BulkSelectValue } from '@patternfly/react-component-groups/dist/dynamic/BulkSelect';
import { DataView } from '@patternfly/react-data-view/dist/dynamic/DataView';
import { DataViewToolbar } from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';
import { DataViewTable } from '@patternfly/react-data-view/dist/dynamic/DataViewTable';
import DataViewFilters from '@patternfly/react-data-view/dist/cjs/DataViewFilters';
import {
  Drawer,
  DrawerActions,
  DrawerCloseButton,
  DrawerContent,
  DrawerContentBody,
  DrawerHead,
  DrawerPanelContent,
  EmptyState,
  EmptyStateBody,
  EmptyStateHeader,
  EmptyStateIcon,
  Pagination,
  Spinner,
  Tab,
  Tabs,
  Title,
  Tooltip,
} from '@patternfly/react-core';
import { ExclamationCircleIcon, KeyIcon, SearchIcon, UsersIcon } from '@patternfly/react-icons';
import { ThProps } from '@patternfly/react-table';
import { SkeletonTableBody, SkeletonTableHead } from '@patternfly/react-component-groups';
import { useDataViewSelection } from '@patternfly/react-data-view/dist/dynamic/Hooks';

import { Group } from '../../../../redux/groups/reducer';
import { fetchMembersForGroup, fetchRolesForGroup } from '../../../../redux/groups/actions';
import { RBACStore } from '../../../../redux/store';
import { extractErrorMessage } from '../../../../utilities/errorUtils';
import { useDispatch, useSelector } from 'react-redux';
import { User } from '../../../../redux/users/reducer';
import { Role } from '../../../../redux/roles/reducer';
import messages from '../../../../Messages';

const EmptyTable: React.FC<{ titleText: string }> = ({ titleText }) => (
  <EmptyState>
    <EmptyStateHeader titleText={titleText} headingLevel="h4" icon={<EmptyStateIcon icon={SearchIcon} />} />
    <EmptyStateBody>No user groups match the filter criteria. Remove all filters or clear all to show results.</EmptyStateBody>
  </EmptyState>
);

interface RoleAssignmentsTableProps {
  // Data props
  groups: Group[];
  totalCount: number;
  isLoading: boolean;
  page: number;
  perPage: number;
  onSetPage: (event: React.MouseEvent | React.KeyboardEvent | MouseEvent, page: number) => void;
  onPerPageSelect: (event: React.MouseEvent | React.KeyboardEvent | MouseEvent, perPage: number) => void;

  // Sorting props
  sortBy?: string;
  direction?: 'asc' | 'desc';
  onSort: (event: React.MouseEvent | React.KeyboardEvent, key: string, direction: 'asc' | 'desc') => void;

  // Filtering props
  filters: { name: string };
  onSetFilters: (filters: Partial<{ name: string }>) => void;
  clearAllFilters: () => void;

  // UI configuration props
  ouiaId?: string;
}

export const RoleAssignmentsTable: React.FC<RoleAssignmentsTableProps> = ({
  groups,
  totalCount,
  isLoading,
  page,
  perPage,
  onSetPage,
  onPerPageSelect,
  sortBy = 'name',
  direction = 'asc',
  onSort,
  filters,
  onSetFilters,
  clearAllFilters,
  ouiaId = 'iam-role-assignments-table',
}) => {
  const intl = useIntl();
  const dispatch = useDispatch();

  // Local state for drawer only
  const [focusedGroup, setFocusedGroup] = useState<Group | undefined>();
  const [activeDrawerTab, setActiveDrawerTab] = useState<string | number>(0);

  // Selection hook
  const selection = useDataViewSelection({ matchOption: (a, b) => a.id === b.id });

  // Redux state for focused group data
  const members = useSelector((state: RBACStore) => state.groupReducer?.selectedGroup?.members?.data || []);
  const membersLoading = useSelector((state: RBACStore) => (state.groupReducer?.selectedGroup?.members as any)?.isLoading || false);
  const membersError = useSelector(
    (state: RBACStore) => state.groupReducer?.selectedGroup?.error || (state.groupReducer?.selectedGroup?.members as any)?.error,
  );

  const roles = useSelector((state: RBACStore) => state.groupReducer?.selectedGroup?.roles?.data || []);
  const rolesLoading = useSelector((state: RBACStore) => state.groupReducer?.selectedGroup?.roles?.isLoading || false);
  const rolesError = useSelector(
    (state: RBACStore) => state.groupReducer?.selectedGroup?.error || (state.groupReducer?.selectedGroup?.roles as any)?.error,
  );

  // Define columns - matching the required columns from the spec
  const columns = useMemo(() => {
    const baseColumns = [
      { label: intl.formatMessage(messages.userGroup), key: 'name', sort: true },
      { label: intl.formatMessage(messages.description), key: 'description', sort: false },
      { label: intl.formatMessage(messages.users), key: 'principalCount', sort: true },
      { label: intl.formatMessage(messages.roles), key: 'roleCount', sort: true },
      { label: intl.formatMessage(messages.lastModified), key: 'modified', sort: true },
    ];

    return baseColumns.map((col, index) => ({ ...col, index }));
  }, [intl]);

  // Drawer handlers
  const onRowClick = useCallback((group: Group | undefined) => {
    setFocusedGroup(group);
  }, []);

  const onCloseDrawer = useCallback(() => {
    setFocusedGroup(undefined);
  }, []);

  // Fetch data when focused group changes
  useEffect(() => {
    if (focusedGroup) {
      // Reset to first tab when opening drawer
      setActiveDrawerTab(0);
      // Fetch members and roles data
      dispatch(fetchMembersForGroup(focusedGroup.uuid, undefined, { limit: 1000 }));
      dispatch(fetchRolesForGroup(focusedGroup.uuid, { limit: 1000 }));
    }
  }, [dispatch, focusedGroup]);

  // Calculate sortable columns
  const sortByIndex = useMemo(() => {
    return columns.findIndex((column) => column.key === sortBy);
  }, [sortBy, columns]);

  const getSortParams = (columnIndex: number): ThProps['sort'] => ({
    sortBy: {
      index: sortByIndex,
      direction,
      defaultDirection: 'asc',
    },
    onSort: (_event, index, direction) => onSort(_event, columns[index].key, direction),
    columnIndex,
  });

  const sortableColumns: DataViewTh[] = columns.map((column, index) => ({
    cell: column.label,
    props: {
      ...(column.sort ? { sort: getSortParams(index) } : {}),
    },
  }));

  // Transform groups into table rows
  const rows = useMemo(() => {
    const handleRowClick = (event: any, group: Group | undefined) => {
      if (event.target.matches('td') || event.target.matches('tr')) {
        onRowClick(group);
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
        group.roleCount,
        group.modified ? formatDistanceToNow(new Date(group.modified), { addSuffix: true }) : '',
      ],
      props: {
        isClickable: true,
        onRowClick: (event: any) => handleRowClick(event, focusedGroup?.uuid === group.uuid ? undefined : group),
        isRowSelected: false,
      },
    }));
  }, [groups, focusedGroup, intl, onRowClick]);

  const activeState = isLoading ? DataViewState.loading : groups.length === 0 ? DataViewState.empty : undefined;

  // Users tab columns
  const GROUP_USERS_COLUMNS: string[] = [
    intl.formatMessage(messages.username),
    intl.formatMessage(messages.firstName),
    intl.formatMessage(messages.lastName),
  ];

  // Roles tab columns
  const GROUP_ROLES_COLUMNS: string[] = [intl.formatMessage(messages.roles)];

  // Drawer render functions
  const renderUsersTab = () => {
    // Show loading state
    if (membersLoading) {
      return (
        <div className="pf-v5-u-pt-md pf-v5-u-text-align-center">
          <Spinner size="lg" aria-label="Loading group members" />
        </div>
      );
    }

    // Show error state
    if (membersError) {
      return (
        <div className="pf-v5-u-pt-md">
          <EmptyState variant="sm">
            <EmptyStateHeader titleText="Unable to load users" icon={<EmptyStateIcon icon={ExclamationCircleIcon} />} headingLevel="h4" />
            <EmptyStateBody>{extractErrorMessage(membersError)}</EmptyStateBody>
          </EmptyState>
        </div>
      );
    }

    // Show empty state when no users
    if (members.length === 0) {
      return (
        <div className="pf-v5-u-pt-md">
          <EmptyState variant="sm">
            <EmptyStateHeader
              titleText={intl.formatMessage(messages.usersEmptyStateTitle)}
              icon={<EmptyStateIcon icon={UsersIcon} />}
              headingLevel="h4"
            />
            <EmptyStateBody>{intl.formatMessage(messages.groupNoUsersAssigned)}</EmptyStateBody>
          </EmptyState>
        </div>
      );
    }

    const userRows = members.map((user: User) => ({
      row: [user.username, user.first_name, user.last_name],
    }));

    return (
      <div className="pf-v5-u-pt-md">
        <DataView ouiaId={`${ouiaId}-users-view`}>
          <DataViewTable
            variant="compact"
            aria-label="Group Users Table"
            ouiaId={`${ouiaId}-users-table`}
            columns={GROUP_USERS_COLUMNS}
            rows={userRows}
          />
        </DataView>
      </div>
    );
  };

  const renderRolesTab = () => {
    // Show loading state
    if (rolesLoading) {
      return (
        <div className="pf-v5-u-pt-md pf-v5-u-text-align-center">
          <Spinner size="lg" aria-label="Loading roles" />
        </div>
      );
    }

    // Show error state
    if (rolesError) {
      return (
        <div className="pf-v5-u-pt-md">
          <EmptyState variant="sm">
            <EmptyStateHeader titleText="Unable to load roles" icon={<EmptyStateIcon icon={ExclamationCircleIcon} />} headingLevel="h4" />
            <EmptyStateBody>{extractErrorMessage(rolesError)}</EmptyStateBody>
          </EmptyState>
        </div>
      );
    }

    // Show empty state when no roles
    if (roles.length === 0) {
      return (
        <div className="pf-v5-u-pt-md">
          <EmptyState variant="sm">
            <EmptyStateHeader
              titleText={intl.formatMessage(messages.rolesEmptyStateTitle)}
              icon={<EmptyStateIcon icon={KeyIcon} />}
              headingLevel="h4"
            />
            <EmptyStateBody>{intl.formatMessage(messages.groupNoRolesAssigned)}</EmptyStateBody>
          </EmptyState>
        </div>
      );
    }

    const roleRows = roles.map((role: Role) => ({
      row: [role.display_name],
    }));

    return (
      <div className="pf-v5-u-pt-md">
        <DataView ouiaId={`${ouiaId}-roles-view`}>
          <DataViewTable
            variant="compact"
            aria-label="Group Roles Table"
            ouiaId={`${ouiaId}-roles-table`}
            columns={GROUP_ROLES_COLUMNS}
            rows={roleRows}
          />
        </DataView>
      </div>
    );
  };

  return (
    <Drawer isExpanded={!!focusedGroup}>
      <DrawerContent
        panelContent={
          focusedGroup ? (
            <DrawerPanelContent>
              <DrawerHead>
                <Title headingLevel="h2" size="lg">
                  {focusedGroup.name}
                </Title>
                <DrawerActions>
                  <DrawerCloseButton onClick={onCloseDrawer} />
                </DrawerActions>
              </DrawerHead>
              <Tabs activeKey={activeDrawerTab} onSelect={(_, tabIndex) => setActiveDrawerTab(tabIndex)} isFilled>
                <Tab eventKey={0} title={intl.formatMessage(messages.roles)}>
                  <div className="pf-v5-u-p-md">{activeDrawerTab === 0 && renderRolesTab()}</div>
                </Tab>
                <Tab eventKey={1} title={intl.formatMessage(messages.users)}>
                  <div className="pf-v5-u-p-md">{activeDrawerTab === 1 && renderUsersTab()}</div>
                </Tab>
              </Tabs>
            </DrawerPanelContent>
          ) : null
        }
      >
        <DrawerContentBody>
          <DataView activeState={activeState} selection={selection}>
            <DataViewToolbar
              bulkSelect={
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
              }
              pagination={
                <Pagination perPage={perPage} page={page} itemCount={totalCount} onSetPage={onSetPage} onPerPageSelect={onPerPageSelect} isCompact />
              }
              filters={
                <DataViewFilters onChange={(_e, values) => onSetFilters(values)} values={filters}>
                  <DataViewTextFilter filterId="name" title="User group" placeholder="Filter by user group" />
                </DataViewFilters>
              }
              clearAllFilters={clearAllFilters}
            />
            <DataViewTable
              variant="compact"
              aria-label="Role Assignments Table"
              ouiaId={`${ouiaId}-table`}
              columns={sortableColumns}
              rows={rows}
              headStates={{ loading: <SkeletonTableHead columns={columns.map((column) => column.label)} /> }}
              bodyStates={{
                loading: <SkeletonTableBody rowsCount={10} columnsCount={columns.length} />,
                empty: <EmptyTable titleText={intl.formatMessage(messages.userGroupsEmptyStateTitle)} />,
              }}
            />
            <DataViewToolbar
              ouiaId={`${ouiaId}-footer-toolbar`}
              pagination={<Pagination perPage={perPage} page={page} itemCount={totalCount} onSetPage={onSetPage} onPerPageSelect={onPerPageSelect} />}
            />
          </DataView>
        </DrawerContentBody>
      </DrawerContent>
    </Drawer>
  );
};
