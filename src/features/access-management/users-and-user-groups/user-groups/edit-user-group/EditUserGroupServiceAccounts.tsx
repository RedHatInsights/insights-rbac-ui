import { BulkSelect, BulkSelectValue, SkeletonTableBody, SkeletonTableHead } from '@patternfly/react-component-groups';
import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateHeader } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateIcon } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { Pagination } from '@patternfly/react-core/dist/dynamic/components/Pagination';
import { DataView, DataViewState, DataViewTable, DataViewToolbar, useDataViewPagination, useDataViewSelection } from '@patternfly/react-data-view';
import SearchIcon from '@patternfly/react-icons/dist/js/icons/search-icon';
import DateFormat from '@redhat-cloud-services/frontend-components/DateFormat';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { ERROR, LAST_PAGE } from '../../../../../redux/service-accounts/constants';
import { ServiceAccount } from '../../../../../redux/service-accounts/types';
import { mappedProps } from '../../../../../helpers/dataUtilities';
import Messages from '../../../../../Messages';
import { fetchServiceAccountsForGroup } from '../../../../../redux/groups/actions';
import { fetchServiceAccounts } from '../../../../../redux/service-accounts/actions';
import { ServiceAccountsState } from '../../../../../redux/service-accounts/reducer';
import { TableState } from './EditUserGroupUsersAndServiceAccounts';

const EmptyTable: React.FunctionComponent<{ titleText: string; subtitleText?: string }> = ({ titleText, subtitleText }) => {
  return (
    <tbody>
      <tr>
        <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
          <EmptyState>
            <EmptyStateHeader titleText={titleText} headingLevel="h4" icon={<EmptyStateIcon icon={SearchIcon} />} />
            {subtitleText && <EmptyStateBody>{subtitleText}</EmptyStateBody>}
          </EmptyState>
        </td>
      </tr>
    </tbody>
  );
};

interface EditGroupServiceAccountsTableProps {
  groupId?: string;
  onChange: (serviceAccounts: TableState) => void;
  initialServiceAccountIds: string[];
}

const PER_PAGE_OPTIONS = [
  { title: '5', value: 5 },
  { title: '10', value: 10 },
  { title: '20', value: 20 },
  { title: '50', value: 50 },
  { title: '100', value: 100 },
];

const reducer = ({ serviceAccountReducer }: { serviceAccountReducer: ServiceAccountsState }) => ({
  serviceAccounts: serviceAccountReducer.serviceAccounts,
  status: serviceAccountReducer.status,
  isLoading: serviceAccountReducer.isLoading,
  limit: serviceAccountReducer.limit,
  offset: serviceAccountReducer.offset,
});

const EditGroupServiceAccountsTable: React.FunctionComponent<EditGroupServiceAccountsTableProps> = ({
  groupId,
  onChange,
  initialServiceAccountIds,
}) => {
  const dispatch = useDispatch();
  const pagination = useDataViewPagination({ perPage: 20 });
  const { page, perPage, onSetPage, onPerPageSelect } = pagination;
  const { auth, getEnvironmentDetails } = useChrome();
  const [activeState, setActiveState] = useState<DataViewState | undefined>(DataViewState.loading);
  const intl = useIntl();

  const columns = useMemo(
    () => [
      intl.formatMessage(Messages.name),
      intl.formatMessage(Messages.description),
      intl.formatMessage(Messages.clientId),
      intl.formatMessage(Messages.owner),
      intl.formatMessage(Messages.timeCreated),
    ],
    [intl],
  );

  const selection = useDataViewSelection({
    matchOption: (a, b) => a.id === b.id,
  });
  const { onSelect, selected } = selection;

  const { serviceAccounts, status, isLoading } = useSelector(reducer);

  // Initialize selection when service accounts are loaded
  useEffect(() => {
    if (serviceAccounts.length > 0 && initialServiceAccountIds.length > 0) {
      onSelect(false); // Clear any existing selections
      // Convert service account IDs to UUIDs since rows use uuid as ID
      const initialSelectedServiceAccounts = initialServiceAccountIds
        .map((serviceAccountId) => {
          const serviceAccount = serviceAccounts.find((sa) => sa.uuid === serviceAccountId);
          return serviceAccount ? { id: serviceAccount.uuid } : null;
        })
        .filter(Boolean);
      onSelect(true, initialSelectedServiceAccounts);
    }
  }, [serviceAccounts, initialServiceAccountIds]); // Don't include onSelect to avoid repeated calls
  const totalCount = useMemo(() => {
    if (!serviceAccounts) return 0;
    const currentCount = (page - 1) * perPage + serviceAccounts.length;
    return status === LAST_PAGE ? currentCount : currentCount + 1;
  }, [serviceAccounts, page, perPage, status]);

  useEffect(() => {
    if (isLoading) {
      setActiveState(DataViewState.loading);
    } else if (status === ERROR) {
      setActiveState(DataViewState.error);
    } else {
      setActiveState(serviceAccounts.length === 0 ? DataViewState.empty : undefined);
    }
  }, [serviceAccounts.length, isLoading, status]);

  const fetchData = useCallback(
    async (apiProps: { count: number; limit: number; offset: number; orderBy: string }) => {
      const { count, limit, offset, orderBy } = apiProps;
      const env = getEnvironmentDetails();
      const token = await auth.getToken();
      dispatch(fetchServiceAccounts({ ...mappedProps({ count, limit, offset, orderBy, token, sso: env?.sso }) }));

      // Only fetch group service accounts if we have a groupId (editing existing group)
      if (groupId) {
        dispatch(fetchServiceAccountsForGroup(groupId, {}));
      }
    },
    [dispatch, groupId],
  );

  useEffect(() => {
    fetchData({
      limit: perPage,
      offset: (page - 1) * perPage,
      orderBy: 'username',
      count: totalCount || 0,
    });
  }, [fetchData, page, perPage]);

  const processedServiceAccounts = serviceAccounts ? serviceAccounts.slice(0, perPage) : [];
  const rows = useMemo(
    () =>
      processedServiceAccounts.map((account: ServiceAccount) => ({
        id: account.uuid,
        row: [
          account.name,
          account.description,
          account.clientId,
          account.createdBy,
          <DateFormat key={`${account.name}-date`} date={account.createdAt} />,
        ],
      })),
    [processedServiceAccounts, groupId],
  );

  useEffect(() => {
    onChange({ initial: initialServiceAccountIds, updated: selection.selected.map((user) => user.id) });
  }, [selection.selected, initialServiceAccountIds]);

  const handleBulkSelect = (value: BulkSelectValue) => {
    if (value === BulkSelectValue.none) {
      onSelect(false);
    } else if (value === BulkSelectValue.page) {
      onSelect(true, rows);
    } else if (value === BulkSelectValue.nonePage) {
      onSelect(false, rows);
    }
  };

  const pageSelected = rows.length > 0 && rows.every((row) => selection.isSelected(row));
  const pagePartiallySelected = !pageSelected && rows.some((row) => selection.isSelected(row));

  return (
    <DataView selection={{ ...selection }} activeState={activeState}>
      <DataViewToolbar
        pagination={
          <Pagination
            isCompact
            perPageOptions={PER_PAGE_OPTIONS}
            itemCount={totalCount}
            page={page}
            perPage={perPage}
            onSetPage={onSetPage}
            onPerPageSelect={onPerPageSelect}
            toggleTemplate={() => {
              const firstIndex = (page - 1) * perPage + 1;
              const lastIndex = Math.min(page * perPage, totalCount);
              const totalNumber = status === LAST_PAGE ? (page - 1) * perPage + serviceAccounts.length : 'many';
              return (
                <React.Fragment>
                  <b>
                    {firstIndex} - {lastIndex}
                  </b>{' '}
                  of <b>{totalNumber}</b>
                </React.Fragment>
              );
            }}
          />
        }
        bulkSelect={
          <BulkSelect
            pageCount={serviceAccounts.length}
            selectedCount={selected.length}
            totalCount={totalCount}
            pageSelected={pageSelected}
            pagePartiallySelected={pagePartiallySelected}
            onSelect={handleBulkSelect}
          />
        }
      />
      <DataViewTable
        variant="compact"
        columns={columns}
        rows={rows}
        headStates={{
          loading: <SkeletonTableHead columns={columns} />,
        }}
        bodyStates={{
          loading: <SkeletonTableBody rowsCount={10} columnsCount={columns.length} />,
          empty: <EmptyTable titleText={intl.formatMessage(Messages.noServiceAccountsFound)} />,
          error: (
            <EmptyTable
              titleText="Failed to load service accounts"
              subtitleText="Please try refreshing the page or contact support if the problem persists."
            />
          ),
        }}
      />
    </DataView>
  );
};

// Component uses named export only
export { EditGroupServiceAccountsTable };
