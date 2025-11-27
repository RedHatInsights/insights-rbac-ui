import React, { Fragment, Suspense, useCallback, useMemo, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useIntl } from 'react-intl';
import NotAuthorized from '@patternfly/react-component-groups/dist/dynamic/NotAuthorized';
import { DataView, DataViewState } from '@patternfly/react-data-view';
import { DataViewToolbar } from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';
import DataViewFilters from '@patternfly/react-data-view/dist/cjs/DataViewFilters';
import { DataViewTextFilter } from '@patternfly/react-data-view';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Stack, StackItem } from '@patternfly/react-core/dist/dynamic/layouts/Stack';
import { Pagination } from '@patternfly/react-core/dist/dynamic/components/Pagination';
import { BulkSelect } from '@patternfly/react-component-groups/dist/dynamic/BulkSelect';
import { BulkSelectValue } from '@patternfly/react-component-groups';
import { Dropdown } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { DropdownList } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { DropdownItem } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { MenuToggle } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import { Table } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Thead } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Tr } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Th } from '@patternfly/react-table/dist/dynamic/components/Table';
import EllipsisVIcon from '@patternfly/react-icons/dist/js/icons/ellipsis-v-icon';
import { SkeletonTableBody, SkeletonTableHead } from '@patternfly/react-component-groups';
import Section from '@redhat-cloud-services/frontend-components/Section';
import { PageLayout, PageTitle } from '../../components/layout/PageLayout';
import { AppLink } from '../../components/navigation/AppLink';
import { useAppLink } from '../../hooks/useAppLink';
import { PER_PAGE_OPTIONS } from '../../helpers/pagination';
import { getBackRoute } from '../../helpers/navigation';
import messages from '../../Messages';
import pathnames from '../../utilities/pathnames';
import { useRoles } from './useRoles';
import { useDispatch } from 'react-redux';
import { updateRolesFilters } from '../../redux/roles/actions';
import { RolesEmptyState } from './components/RolesEmptyState';
import { RolesTable } from './components/RolesTable';
import './roles.scss';

export const Roles: React.FC = () => {
  const intl = useIntl();
  const navigate = useNavigate();
  const toAppLink = useAppLink();
  const dispatch = useDispatch();

  // Get all data and handlers from custom hook
  const {
    roles,
    isLoading,
    totalCount,
    isAdmin,
    filterValue,
    setFilterValue,
    hasActiveFilters,
    page,
    perPage,
    setPage,
    setPerPage,
    sortByState,
    setSortByState,
    expandedCells,
    setExpandedCells,
    selectedRows,
    setSelectedRows,
    columns,
    isSelectable,
    fetchData,
    handleClearFilters,
    adminGroup,
  } = useRoles();

  // Local state for UI
  const [isBulkActionsOpen, setIsBulkActionsOpen] = useState(false);
  const [removeRolesList, setRemoveRolesList] = useState<Array<{ uuid: string; label: string }>>([]);

  // Show NotAuthorized component for users without proper permissions
  if (!isAdmin) {
    return (
      <NotAuthorized
        serviceName="User Access Administration"
        description="You need User Access Administrator or Organization Administrator permissions to view roles."
      />
    );
  }

  // Filter change handler with debounce
  const handleFilterChange = useCallback(
    (_key: string, newFilters: Partial<{ display_name: string }>) => {
      const newFilterValue = newFilters.display_name || '';
      // Update redux filters immediately to guard against stale request races in reducer
      dispatch(updateRolesFilters({ display_name: newFilterValue }));
      setFilterValue(newFilterValue);

      // Fetch with new filter and reset to page 1
      fetchData({ filters: { display_name: newFilterValue }, offset: 0 });
      // Update URL to page 1 without triggering a second fetch that could use stale filters
      setPage(1, { skipFetch: true });
    },
    [dispatch, setFilterValue, fetchData, setPage],
  );

  // Sort handler
  const handleSort = useCallback(
    (_event: React.MouseEvent, index: number, direction: 'asc' | 'desc') => {
      setSortByState({ index, direction });

      // Calculate orderBy from sort state
      const columnIndex = index - Number(isSelectable);
      const column = columns[columnIndex];
      const newOrderBy = `${direction === 'desc' ? '-' : ''}${column?.key || 'display_name'}`;

      // Fetch with new sort
      fetchData({ orderBy: newOrderBy, offset: 0 });
    },
    [setSortByState, columns, isSelectable, fetchData],
  );

  // Expansion handler
  const handleExpansion = useCallback(
    (roleUuid: string, columnKey: 'groups' | 'permissions', isExpanding: boolean) => {
      const newExpandedCells = { ...expandedCells };
      if (isExpanding) {
        newExpandedCells[roleUuid] = columnKey;
      } else {
        delete newExpandedCells[roleUuid];
      }
      setExpandedCells(newExpandedCells);
    },
    [expandedCells, setExpandedCells],
  );

  // Bulk select handler
  const handleBulkSelect = useCallback(
    (value: BulkSelectValue) => {
      if (value === BulkSelectValue.none) {
        setSelectedRows([]);
      } else if (value === BulkSelectValue.page) {
        // Select all selectable roles on current page
        const selectableRoles = roles
          .filter((role) => !(role.platform_default || role.admin_default || role.system))
          .map((role) => ({ uuid: role.uuid, label: role.name }));
        setSelectedRows(selectableRoles);
      } else if (value === BulkSelectValue.nonePage) {
        setSelectedRows([]);
      }
    },
    [roles, setSelectedRows],
  );

  // Navigation handlers
  const handleEditRole = useCallback(
    (roleId: string) => {
      navigate(toAppLink(pathnames['edit-role'].link.replace(':roleId', roleId)));
    },
    [navigate, toAppLink],
  );

  const handleDeleteRole = useCallback(
    (roleIds: string[]) => {
      const rolesToDelete = roles.filter((role) => roleIds.includes(role.uuid)).map((role) => ({ uuid: role.uuid, label: role.name }));
      setRemoveRolesList(rolesToDelete);
      navigate(toAppLink(pathnames['remove-role'].link.replace(':roleId', roleIds.join(','))));
    },
    [roles, navigate, toAppLink],
  );

  // Pagination handlers
  const handleSetPage = useCallback(
    (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, newPage: number) => {
      setPage(newPage);
    },
    [setPage],
  );

  const handlePerPageSelect = useCallback(
    (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, newPerPage: number) => {
      setPerPage(newPerPage);
    },
    [setPerPage],
  );

  // Computed values
  const selectableItemsCount = roles.filter((role) => !(role.platform_default || role.admin_default || role.system)).length;
  const removingAllRows = totalCount === removeRolesList.length;

  // Pagination component
  const paginationComponent = useMemo(
    () =>
      totalCount > 0 ? (
        <Pagination
          perPageOptions={PER_PAGE_OPTIONS}
          itemCount={totalCount}
          page={page}
          perPage={perPage}
          onSetPage={handleSetPage}
          onPerPageSelect={handlePerPageSelect}
        />
      ) : undefined,
    [totalCount, page, perPage, handleSetPage, handlePerPageSelect],
  );

  // Bulk select component
  const bulkSelectComponent = useMemo(() => {
    if (!isAdmin || roles.length === 0) {
      return undefined;
    }

    return <BulkSelect selectedCount={selectedRows.length} totalCount={selectableItemsCount} onSelect={handleBulkSelect} />;
  }, [isAdmin, roles.length, selectedRows.length, selectableItemsCount, handleBulkSelect]);

  // Loading states
  const loadingHeader = <SkeletonTableHead columns={columns.map((col) => col.title)} />;
  const loadingBody = <SkeletonTableBody rowsCount={10} columnsCount={columns.length + (isAdmin ? 2 : 0)} />;

  // Empty state
  const emptyState = (
    <RolesEmptyState
      colSpan={columns.length + (isAdmin ? 2 : 0)}
      hasActiveFilters={hasActiveFilters}
      isAdmin={isAdmin}
      onClearFilters={handleClearFilters}
    />
  );

  // Determine active state
  const activeState = isLoading ? DataViewState.loading : roles.length === 0 ? DataViewState.empty : undefined;

  return (
    <Fragment>
      <Stack className="rbac-c-roles">
        <StackItem>
          <PageLayout>
            <PageTitle title={intl.formatMessage(messages.roles)} />
          </PageLayout>
        </StackItem>
        <StackItem>
          <Section type="content" id="tab-roles">
            <DataView activeState={activeState}>
              <DataViewToolbar
                bulkSelect={bulkSelectComponent}
                actions={
                  isAdmin ? (
                    <Fragment>
                      {selectedRows.length > 0 ? (
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
                              isDisabled={selectedRows.length !== 1}
                              onClick={() => {
                                if (selectedRows.length === 1) {
                                  handleEditRole(selectedRows[0].uuid);
                                }
                              }}
                            >
                              {intl.formatMessage(messages.edit)}
                            </DropdownItem>
                            <DropdownItem
                              onClick={() => {
                                handleDeleteRole(selectedRows.map((row) => row.uuid));
                              }}
                            >
                              {intl.formatMessage(messages.delete)}
                            </DropdownItem>
                          </DropdownList>
                        </Dropdown>
                      ) : (
                        <AppLink to={pathnames['add-role'].link}>
                          <Button ouiaId="create-role-button" variant="primary" aria-label="Create role">
                            {intl.formatMessage(messages.createRole)}
                          </Button>
                        </AppLink>
                      )}
                    </Fragment>
                  ) : undefined
                }
                pagination={paginationComponent}
                filters={
                  <DataViewFilters onChange={handleFilterChange} values={{ display_name: filterValue }}>
                    <DataViewTextFilter filterId="display_name" title="Name" placeholder="Filter by name" />
                  </DataViewFilters>
                }
                clearAllFilters={handleClearFilters}
              />

              {/* Custom table for compound expandable rows */}
              {isLoading ? (
                <Table aria-label="Loading roles">
                  {loadingHeader}
                  {loadingBody}
                </Table>
              ) : roles.length === 0 ? (
                <Table aria-label="Empty roles">
                  <Thead>
                    <Tr>
                      {isAdmin && <Th />}
                      {columns.map((column, index) => (
                        <Th key={index}>{column.title}</Th>
                      ))}
                      {isAdmin && <Th />}
                    </Tr>
                  </Thead>
                  {emptyState}
                </Table>
              ) : (
                <RolesTable
                  roles={roles}
                  isAdmin={isAdmin}
                  isSelectable={isSelectable}
                  selectedRows={selectedRows}
                  expandedCells={expandedCells}
                  sortByState={sortByState}
                  onRowSelection={setSelectedRows}
                  onExpansion={handleExpansion}
                  onSort={handleSort}
                  onEditRole={handleEditRole}
                  onDeleteRole={handleDeleteRole}
                  adminGroup={adminGroup}
                />
              )}

              <DataViewToolbar pagination={paginationComponent} />
            </DataView>

            <Suspense>
              <Outlet
                context={{
                  [pathnames['add-role'].path]: {
                    pagination: { limit: perPage, offset: (page - 1) * perPage, count: totalCount },
                    filters: { display_name: filterValue },
                  },
                  [pathnames['remove-role'].path]: {
                    isLoading,
                    cancelRoute: getBackRoute(pathnames.roles.link, { limit: perPage, offset: (page - 1) * perPage }, { display_name: filterValue }),
                    submitRoute: getBackRoute(
                      pathnames.roles.link,
                      { limit: perPage, offset: 0 },
                      removingAllRows ? {} : { display_name: filterValue },
                    ),
                    afterSubmit: () => {
                      fetchData({ ...{ limit: perPage, offset: 0 }, filters: removingAllRows ? {} : { display_name: filterValue } });
                      removingAllRows && setFilterValue('');
                      setSelectedRows([]);
                    },
                    setFilterValue,
                  },
                  [pathnames['edit-role'].path]: {
                    isLoading,
                    cancelRoute: getBackRoute(pathnames.roles.link, { limit: perPage, offset: (page - 1) * perPage }, { display_name: filterValue }),
                    afterSubmit: () => {
                      fetchData({ offset: 0, filters: { display_name: filterValue } });
                      setSelectedRows([]);
                    },
                  },
                  [pathnames['roles-add-group-roles'].path]: {
                    closeUrl: getBackRoute(pathnames.roles.link, { limit: perPage, offset: (page - 1) * perPage }, { display_name: filterValue }),
                    afterSubmit: () => {
                      fetchData({ offset: 0, filters: { display_name: filterValue } });
                    },
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

// Feature container - both named AND default export
export default Roles;
