import React, { Fragment, Suspense, useCallback, useMemo } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
import Section from '@redhat-cloud-services/frontend-components/Section';

// DataView imports
import { DataView, DataViewState } from '@patternfly/react-data-view';
import { DataViewToolbar } from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';
import { DataViewTable } from '@patternfly/react-data-view/dist/dynamic/DataViewTable';
import { DataViewTextFilter } from '@patternfly/react-data-view';
import DataViewFilters from '@patternfly/react-data-view/dist/cjs/DataViewFilters';
import { SkeletonTableBody, SkeletonTableHead } from '@patternfly/react-component-groups';
import { BulkSelect, BulkSelectValue } from '@patternfly/react-component-groups/dist/dynamic/BulkSelect';
import { Pagination } from '@patternfly/react-core/dist/dynamic/components/Pagination';

// Component imports
import { GroupServiceAccountsEmptyState } from './components/GroupServiceAccountsEmptyState';
import { useGroupServiceAccounts } from './hooks/useGroupServiceAccounts';
import { AppLink } from '../../../../components/navigation/AppLink';
import { DefaultServiceAccountsCard } from '../../components/DefaultServiceAccountsCard';
import useAppNavigate from '../../../../hooks/useAppNavigate';
import messages from '../../../../Messages';
import pathnames from '../../../../utilities/pathnames';
import type { GroupServiceAccountsProps } from './types';
import './group-service-accounts.scss';
import { useIntl } from 'react-intl';
import { fetchGroup } from '../../../../redux/groups/actions';

export const GroupServiceAccounts: React.FC<GroupServiceAccountsProps> = (props) => {
  const intl = useIntl();
  const navigate = useAppNavigate();
  const dispatch = useDispatch();
  const { groupId } = useParams<{ groupId: string }>();

  // Use custom hook for ALL business logic
  const {
    serviceAccounts,
    isLoading,
    filters,
    selection,
    tableRows,
    columns,
    hasPermissions,
    isAdminDefault,
    isPlatformDefault,
    isChanged,
    systemGroupUuid,
    fetchData,
    emptyStateProps,
    toolbarButtons,
    group,
    pagination,
    onDefaultGroupChanged,
  } = useGroupServiceAccounts(props);

  // Filter change handler
  const handleFilterChange = useCallback(
    (key: string, newValues: Partial<{ clientId: string; name: string; description: string }>) => {
      const newFilters = { ...filters.filters, ...newValues };
      filters.onSetFilters(newFilters);
      fetchData({
        clientId: newFilters.clientId,
        name: newFilters.name,
        description: newFilters.description,
        offset: 0,
      });
    },
    [filters.onSetFilters, filters.filters, fetchData],
  );

  // Wrap clearAllFilters to also trigger API call
  const clearAllFilters = useCallback(() => {
    filters.clearAllFilters();
    fetchData({ clientId: '', name: '', description: '', offset: 0 });
  }, [filters.clearAllFilters, fetchData]);

  // Bulk select handler
  const handleBulkSelect = useCallback(
    (value: BulkSelectValue) => {
      if (value === BulkSelectValue.none) {
        selection.onSelect(false);
      } else if (value === BulkSelectValue.page) {
        selection.onSelect(true, tableRows);
      } else if (value === BulkSelectValue.nonePage) {
        selection.onSelect(false, tableRows);
      }
    },
    [selection, tableRows],
  );

  // Skeleton states
  const loadingHeader = useMemo(() => <SkeletonTableHead columns={columns.map((col) => col.cell)} />, [columns]);

  const loadingBody = useMemo(() => <SkeletonTableBody rowsCount={10} columnsCount={columns.length} />, [columns.length]);

  // Empty state component
  const emptyState = useMemo(() => <GroupServiceAccountsEmptyState {...emptyStateProps} />, [emptyStateProps]);

  // Pagination handlers
  const handleSetPage = useCallback(
    (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, newPage: number) => {
      const offset = (newPage - 1) * pagination.limit;
      fetchData({ offset, limit: pagination.limit });
    },
    [fetchData, pagination.limit],
  );

  const handlePerPageSelect = useCallback(
    (_event: React.MouseEvent | React.KeyboardEvent | MouseEvent, newPerPage: number) => {
      fetchData({ offset: 0, limit: newPerPage });
    },
    [fetchData],
  );

  // Pagination component
  const paginationComponent = useMemo(() => {
    const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
    return (
      <Pagination
        itemCount={pagination.count || 0}
        perPage={pagination.limit}
        page={currentPage}
        onSetPage={handleSetPage}
        onPerPageSelect={handlePerPageSelect}
        isCompact
      />
    );
  }, [pagination.count, pagination.limit, pagination.offset, handleSetPage, handlePerPageSelect]);

  // Bulk select component
  const bulkSelectComponent = useMemo(() => {
    if (!hasPermissions || isAdminDefault || isPlatformDefault) {
      return undefined;
    }

    const selectedCount = selection.selected?.length || 0;
    const totalCount = pagination.count || 0;
    const currentPageCount = serviceAccounts.length;

    // Calculate if all/some items on current page are selected
    const selectedOnPage = tableRows.filter((row) => selection.selected?.some((sel: any) => sel.id === row.id)).length;
    const pageSelected = selectedOnPage > 0 && selectedOnPage === currentPageCount;
    const pagePartiallySelected = selectedOnPage > 0 && selectedOnPage < currentPageCount;

    return (
      <BulkSelect
        isDataPaginated={true}
        selectedCount={selectedCount}
        totalCount={totalCount}
        pageCount={currentPageCount}
        pageSelected={pageSelected}
        pagePartiallySelected={pagePartiallySelected}
        onSelect={handleBulkSelect}
      />
    );
  }, [hasPermissions, isAdminDefault, isPlatformDefault, selection.selected, pagination.count, serviceAccounts.length, tableRows, handleBulkSelect]);

  // Determine active state
  const activeState = isLoading ? DataViewState.loading : serviceAccounts.length === 0 ? DataViewState.empty : undefined;

  return (
    <React.Fragment>
      <Section type="content" id="tab-service-accounts">
        {(isAdminDefault || isPlatformDefault) && group?.system ? (
          <DefaultServiceAccountsCard isPlatformDefault={isPlatformDefault} />
        ) : (
          <>
            <Alert
              className="rbac-service-accounts-alert"
              variant="info"
              isInline
              isPlain
              title={intl.formatMessage(messages.visitServiceAccountsPage, {
                link: (
                  <AppLink to="/service-accounts" linkBasename="/iam">
                    {intl.formatMessage(messages.serviceAccountsPage)}
                  </AppLink>
                ),
              })}
            />
            <DataView activeState={activeState} selection={hasPermissions ? selection : undefined}>
              <DataViewToolbar
                bulkSelect={bulkSelectComponent}
                pagination={paginationComponent}
                actions={toolbarButtons}
                filters={
                  <DataViewFilters onChange={handleFilterChange} values={filters.filters}>
                    <DataViewTextFilter filterId="clientId" title="Client ID" placeholder="Filter by client ID" />
                    <DataViewTextFilter filterId="name" title="Name" placeholder="Filter by name" />
                  </DataViewFilters>
                }
                clearAllFilters={clearAllFilters}
              />
              <DataViewTable
                columns={columns}
                rows={tableRows}
                headStates={{ loading: loadingHeader }}
                bodyStates={{
                  loading: loadingBody,
                  empty: emptyState,
                }}
              />
              <DataViewToolbar pagination={paginationComponent} />
            </DataView>
          </>
        )}
      </Section>
      {!((isAdminDefault || isPlatformDefault) && group?.system) && (
        <Suspense>
          <Outlet
            context={{
              [pathnames['group-service-accounts-edit-group'].path]: {
                group,
                cancelRoute: pathnames['group-detail-service-accounts'].link.replace(':groupId', groupId!),
                submitRoute: pathnames['group-detail-service-accounts'].link.replace(':groupId', groupId!), // Stay on service accounts tab after edit
              },
              [pathnames['group-service-accounts-remove-group'].path]: {
                postMethod: (promise: Promise<unknown>) => {
                  navigate(pathnames['group-detail-service-accounts'].link.replace(':groupId', groupId!));
                  if (promise) {
                    promise.then?.(() => fetchData());
                  }
                },
              },
              [pathnames['group-add-service-account'].path]: {
                isDefault: isPlatformDefault || isAdminDefault,
                isChanged: isChanged,
                onDefaultGroupChanged: onDefaultGroupChanged,
                fetchUuid: systemGroupUuid,
                groupName: group?.name,
                postMethod: (promise: Promise<unknown>) => {
                  navigate(pathnames['group-detail-service-accounts'].link.replace(':groupId', groupId!));
                  if (promise) {
                    promise.then?.(() => {
                      // If we just modified a default group, re-fetch to get the updated name
                      if ((isPlatformDefault || isAdminDefault) && !isChanged) {
                        dispatch(fetchGroup(groupId!));
                      }
                      fetchData();
                    });
                  }
                },
              },
            }}
          />
        </Suspense>
      )}
    </React.Fragment>
  );
};

export default GroupServiceAccounts;
