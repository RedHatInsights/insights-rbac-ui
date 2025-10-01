import React, { Fragment, Suspense, useCallback, useMemo } from 'react';
import { Outlet, useParams } from 'react-router-dom';
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

export const GroupServiceAccounts: React.FC<GroupServiceAccountsProps> = (props) => {
  const intl = useIntl();
  const navigate = useAppNavigate();
  const { groupId } = useParams<{ groupId: string }>();

  // Use custom hook for ALL business logic
  const {
    serviceAccounts,
    isLoading,
    filters,
    selection,
    tableRows,
    columns,
    hasActiveFilters,
    hasPermissions,
    isAdminDefault,
    isPlatformDefault,
    fetchData,
    emptyStateProps,
    toolbarButtons,
    group,
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
    [filters, fetchData],
  );

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    const defaultFilters = { clientId: '', name: '', description: '' };
    filters.onSetFilters(defaultFilters);
    fetchData({ ...defaultFilters, offset: 0 });
  }, [filters, fetchData]);

  // Bulk select handler
  const handleBulkSelect = useCallback(
    (value: BulkSelectValue) => {
      if (value === BulkSelectValue.none) {
        selection.onSelect(false);
      } else if (value === BulkSelectValue.all || value === BulkSelectValue.page) {
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

  // Bulk select component
  const bulkSelectComponent = useMemo(() => {
    if (!hasPermissions || isAdminDefault || isPlatformDefault) {
      return undefined;
    }

    const selectedCount = selection.selected?.length || 0;
    const totalCount = serviceAccounts.length;

    return (
      <BulkSelect isDataPaginated={false} selectedCount={selectedCount} totalCount={totalCount} onSelect={handleBulkSelect} pageCount={totalCount} />
    );
  }, [hasPermissions, isAdminDefault, isPlatformDefault, selection.selected?.length, serviceAccounts.length, handleBulkSelect]);

  // Determine active state
  const activeState = isLoading ? DataViewState.loading : serviceAccounts.length === 0 ? DataViewState.empty : undefined;

  return (
    <React.Fragment>
      <Section type="content" id="tab-service-accounts">
        {isPlatformDefault || isAdminDefault ? (
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
                actions={toolbarButtons}
                filters={
                  <DataViewFilters onChange={handleFilterChange} values={filters.filters}>
                    <DataViewTextFilter filterId="clientId" title="Client ID" placeholder="Filter by client ID" />
                    <DataViewTextFilter filterId="name" title="Name" placeholder="Filter by name" />
                  </DataViewFilters>
                }
                clearAllFilters={hasActiveFilters ? clearAllFilters : undefined}
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
            </DataView>
          </>
        )}
      </Section>
      {!(isPlatformDefault || isAdminDefault) ? (
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
                postMethod: (promise: Promise<unknown>) => {
                  navigate(pathnames['group-detail-service-accounts'].link.replace(':groupId', groupId!));
                  if (promise) {
                    promise.then?.(() => fetchData());
                  }
                },
              },
            }}
          />
        </Suspense>
      ) : null}
    </React.Fragment>
  );
};

export default GroupServiceAccounts;
