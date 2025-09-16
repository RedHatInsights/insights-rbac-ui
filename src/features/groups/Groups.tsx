import React, { Fragment, Suspense, useContext, useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';

// PatternFly imports
import { DataView, DataViewState } from '@patternfly/react-data-view';
import { DataViewToolbar } from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';
import DataViewFilters from '@patternfly/react-data-view/dist/cjs/DataViewFilters';
import { DataViewTextFilter } from '@patternfly/react-data-view';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Stack, StackItem } from '@patternfly/react-core/dist/dynamic/layouts/Stack';
import { Pagination } from '@patternfly/react-core/dist/dynamic/components/Pagination';
import { BulkSelect } from '@patternfly/react-component-groups/dist/dynamic/BulkSelect';
import { Dropdown } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { DropdownList } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { DropdownItem } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { MenuToggle } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import EllipsisVIcon from '@patternfly/react-icons/dist/js/icons/ellipsis-v-icon';

// Red Hat components
import Section from '@redhat-cloud-services/frontend-components/Section';
import { PageLayout, PageTitle } from '../../components/layout/PageLayout';
import { AppLink } from '../../components/navigation/AppLink';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';

// Redux imports
import { fetchGroups } from '../../redux/groups/actions';

// Helper imports
import { defaultAdminSettings, defaultSettings } from '../../helpers/pagination';
import { getBackRoute } from '../../helpers/navigation';

// Context and types
import PermissionsContext from '../../utilities/permissionsContext';
import { PER_PAGE_OPTIONS } from '../../helpers/pagination';
import messages from '../../Messages';
import pathnames from '../../utilities/pathnames';
import type { Group, RBACStore } from './types';
import { GroupsEmptyState } from './components/GroupsEmptyState';
import { GroupsTableContent } from './components/GroupsTableContent';
import { GroupsSkeletonTable } from './components/GroupsSkeletonTable';
// Custom hooks
import { useGroupsHandlers } from './useGroupsHandlers';
import { useUrlPaginationSync } from './useUrlPaginationSync';
import { useUrlFiltersSync } from './useUrlFiltersSync';
import { useInitialGroupsDataLoad } from './useInitialGroupsDataLoad';
import { useRouteStateManagement } from './useRouteStateManagement';
import { useTableColumns } from './useTableColumns';
import './Groups.scss';

// Types
interface GroupsProps {}

export const Groups: React.FC<GroupsProps> = () => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const chrome = useChrome();
  const fetchData = (options: { limit?: number; offset?: number; filters?: Record<string, unknown>; sortBy?: string; orderBy?: string }) => {
    // Convert orderBy string to enum if needed
    const { orderBy, ...restOptions } = options;
    const fetchOptions = {
      ...restOptions,
      usesMetaInURL: true,
      chrome,
      platformDefault: false,
      adminDefault: false,
      ...(orderBy && { orderBy: orderBy as any }), // Cast to any since @redhat-cloud-services/rbac-client has broken enum types
    };
    return dispatch(fetchGroups(fetchOptions));
  };

  // User permission context for admin/user access control
  const { orgAdmin, userAccessAdministrator } = useContext(PermissionsContext);
  const isAdmin = orgAdmin || userAccessAdministrator;

  // Table column definitions
  const columns = useTableColumns();

  // Component state for table sorting and row selection
  const [sortByState, setSortByState] = useState({ index: Number(isAdmin), direction: 'asc' as 'asc' | 'desc' });
  const [selectedRows, setSelectedRows] = useState<Group[]>([]);
  const [removeGroupsList, setRemoveGroupsList] = useState<Group[]>([]);
  const [expanded, setExpanded] = useState<Record<string, number | boolean>>({});
  const [isBulkActionsOpen, setIsBulkActionsOpen] = useState(false);

  const orderBy = `${sortByState?.direction === 'desc' ? '-' : ''}${columns[sortByState?.index - Number(isAdmin)]?.key || 'name'}`;

  // Redux state selectors for groups data and loading state
  const { groups, pagination, filters, isLoading } = useSelector(
    ({
      groupReducer: {
        groups: { data, filters, pagination },
        isLoading,
        adminGroup,
        systemGroup,
      },
    }: RBACStore) => ({
      groups: [
        ...(adminGroup?.name?.match(new RegExp(filters?.name || '', 'i')) ? [adminGroup] : []),
        ...(systemGroup?.name?.match(new RegExp(filters?.name || '', 'i')) ? [systemGroup] : []),
        ...(data?.filter(
          ({ platform_default, admin_default }: { platform_default?: boolean; admin_default?: boolean } = {}) => !(platform_default || admin_default),
        ) || []),
      ],
      pagination: {
        limit: pagination?.limit ?? (orgAdmin ? defaultAdminSettings : defaultSettings).limit,
        offset: pagination?.offset ?? (orgAdmin ? defaultAdminSettings : defaultSettings).offset,
        count: pagination?.count,
        redirected: pagination?.redirected,
      },
      filters: filters,
      isLoading,
    }),
    shallowEqual,
  );

  const [filterValue, setFilterValue] = useState(filters?.name || '');

  // URL and route state management hooks
  useUrlPaginationSync(pagination.limit, pagination.offset, pagination.count, pagination.redirected);
  useUrlFiltersSync(filterValue);
  useInitialGroupsDataLoad({
    pagination,
    filterValue,
    onFilterValueChange: setFilterValue,
    fetchData,
  });
  useRouteStateManagement(pagination, filterValue);

  // Data transformation: merge admin/system groups for admin users, standard groups for others
  const data = useMemo(
    () =>
      groups.map((group: Group) =>
        group.platform_default || group.admin_default ? { ...group, principalCount: `All${group.admin_default ? ' org admins' : ''}` } : group,
      ),
    [groups],
  );

  // Computed values that handlers need
  const selectableItemsCount = data.filter((item) => !(item.platform_default || item.admin_default)).length;
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
  const totalCount = pagination.count || data.length;
  const hasActiveFilters = filterValue !== '';

  // Use handlers hook
  const {
    onExpand,
    handleSort,
    handleBulkSelect,
    handleEdit,
    handleDelete,
    handlePageChange,
    handlePerPageChange,
    handleFiltersChange,
    handleClearAllFilters,
  } = useGroupsHandlers({
    isAdmin,
    columns,
    expanded,
    onExpandedChange: setExpanded,
    onSelectedRowsChange: setSelectedRows,
    onRemoveGroupsChange: setRemoveGroupsList,
    onSortChange: setSortByState,
    onFilterValueChange: setFilterValue,
    data,
    pagination,
    orderBy,
    totalCount,
    filterValue,
    fetchData,
  });

  // Bulk deletion state: determines if all rows are being removed to manage filter reset behavior
  const removingAllRows = pagination.count === removeGroupsList.length;

  const activeState = isLoading ? DataViewState.loading : data.length === 0 ? DataViewState.empty : undefined;

  return (
    <Fragment>
      <Stack className="rbac-c-groups">
        <StackItem>
          <PageLayout>
            <PageTitle title={intl.formatMessage(messages.groups)} />
          </PageLayout>
        </StackItem>
        <StackItem>
          <Section type="content" id="tab-groups">
            <DataView activeState={activeState}>
              <DataViewToolbar
                bulkSelect={
                  isAdmin && data.length > 0 ? (
                    <BulkSelect selectedCount={selectedRows.length} totalCount={selectableItemsCount} onSelect={handleBulkSelect} />
                  ) : undefined
                }
                actions={
                  isAdmin && selectedRows.length > 0 ? (
                    <Dropdown
                      isOpen={isBulkActionsOpen}
                      onOpenChange={setIsBulkActionsOpen}
                      toggle={(toggleRef) => (
                        <MenuToggle
                          ref={toggleRef}
                          aria-label="bulk actions toggle"
                          variant="plain"
                          onClick={() => setIsBulkActionsOpen(!isBulkActionsOpen)}
                        >
                          <EllipsisVIcon />
                        </MenuToggle>
                      )}
                    >
                      <DropdownList>
                        <DropdownItem
                          onClick={() => {
                            if (selectedRows.length === 1) {
                              handleEdit(selectedRows[0].uuid);
                            }
                            setIsBulkActionsOpen(false);
                          }}
                          isDisabled={selectedRows.length !== 1}
                        >
                          {intl.formatMessage(messages.edit)}
                        </DropdownItem>
                        <DropdownItem
                          onClick={() => {
                            handleDelete(selectedRows);
                            setIsBulkActionsOpen(false);
                          }}
                          isDisabled={selectedRows.length === 0}
                        >
                          {intl.formatMessage(messages.delete)}
                        </DropdownItem>
                      </DropdownList>
                    </Dropdown>
                  ) : isAdmin ? (
                    <AppLink to={pathnames['add-group'].link}>
                      <Button ouiaId="create-group-button" variant="primary">
                        {intl.formatMessage(messages.createGroup)}
                      </Button>
                    </AppLink>
                  ) : undefined
                }
                pagination={
                  totalCount > 0 ? (
                    <Pagination
                      perPageOptions={PER_PAGE_OPTIONS}
                      itemCount={totalCount}
                      page={currentPage}
                      perPage={pagination.limit}
                      onSetPage={(_event, page) => handlePageChange(page)}
                      onPerPageSelect={(_event, perPage) => handlePerPageChange(perPage)}
                    />
                  ) : undefined
                }
                filters={
                  <DataViewFilters onChange={(_event, values) => handleFiltersChange(values)} values={{ name: filterValue }}>
                    <DataViewTextFilter
                      filterId="name"
                      title={intl.formatMessage(messages.name)}
                      placeholder={`Filter by ${intl.formatMessage(messages.name).toLowerCase()}`}
                    />
                  </DataViewFilters>
                }
                clearAllFilters={handleClearAllFilters}
              />

              {/* Manual state handling for compound expansion */}
              {isLoading ? (
                <GroupsSkeletonTable isAdmin={isAdmin} rowsCount={10} />
              ) : data.length === 0 ? (
                <GroupsEmptyState
                  hasActiveFilters={hasActiveFilters}
                  titleText={`Configure ${intl.formatMessage(messages.groups).toLowerCase()}`}
                  isAdmin={isAdmin}
                />
              ) : (
                <GroupsTableContent
                  data={data}
                  isAdmin={isAdmin}
                  sortByState={sortByState}
                  selectedRows={selectedRows}
                  selectableItemsCount={selectableItemsCount}
                  expanded={expanded}
                  onExpandedChange={setExpanded}
                  onSelectedRowsChange={setSelectedRows}
                  onRemoveGroupsChange={setRemoveGroupsList}
                  handleBulkSelect={handleBulkSelect}
                  handleSort={handleSort}
                  onExpand={onExpand}
                />
              )}

              <DataViewToolbar
                pagination={
                  totalCount > 0 ? (
                    <Pagination
                      perPageOptions={PER_PAGE_OPTIONS}
                      itemCount={totalCount}
                      page={currentPage}
                      perPage={pagination.limit}
                      onSetPage={(_event, page) => handlePageChange(page)}
                      onPerPageSelect={(_event, perPage) => handlePerPageChange(perPage)}
                    />
                  ) : undefined
                }
              />
            </DataView>

            <Suspense fallback={<div>Loading...</div>}>
              <Outlet
                context={{
                  pagination,
                  filters,
                  [pathnames['add-group'].path]: {
                    orderBy,
                    postMethod: (config: Record<string, unknown>) => {
                      setFilterValue('');
                      fetchData(config);
                    },
                  },
                  [pathnames['edit-group'].path]: {
                    postMethod: (config: Record<string, unknown>) => {
                      setFilterValue('');
                      fetchData({ ...config, orderBy });
                    },
                    cancelRoute: getBackRoute(pathnames['groups'].link, pagination, filters),
                    submitRoute: getBackRoute(pathnames['groups'].link, { ...pagination, offset: 0 }, filters),
                  },
                  [pathnames['remove-group'].path]: {
                    postMethod: (ids: string[], config: Record<string, unknown>) => {
                      fetchData({ ...config, filters: { name: removingAllRows ? '' : filterValue }, orderBy });
                      removingAllRows && setFilterValue('');
                      setSelectedRows(selectedRows.filter((row) => !ids.includes(row.uuid)));
                    },
                    cancelRoute: getBackRoute(pathnames['groups'].link, pagination, filters),
                    submitRoute: getBackRoute(pathnames['groups'].link, { ...pagination, offset: 0 }, removingAllRows ? {} : filters),
                  },
                }}
              />
            </Suspense>
          </Section>
        </StackItem>
      </Stack>
    </Fragment>
  );
};

// Default export for routing
export default Groups;
