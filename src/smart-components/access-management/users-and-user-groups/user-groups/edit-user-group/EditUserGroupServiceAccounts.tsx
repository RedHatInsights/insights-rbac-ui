import { BulkSelect, BulkSelectValue, SkeletonTableBody, SkeletonTableHead } from '@patternfly/react-component-groups';
import { EmptyState, EmptyStateBody, EmptyStateHeader, EmptyStateIcon, Pagination } from '@patternfly/react-core';
import { DataView, DataViewState, DataViewTable, DataViewToolbar, useDataViewPagination, useDataViewSelection } from '@patternfly/react-data-view';
import { SearchIcon } from '@patternfly/react-icons';
import DateFormat from '@redhat-cloud-services/frontend-components/DateFormat';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { LAST_PAGE } from '../../../../../helpers/service-account/constants';
import { ServiceAccount } from '../../../../../helpers/service-account/types';
import { mappedProps } from '../../../../../helpers/shared/helpers';
import Messages from '../../../../../Messages';
import { fetchServiceAccountsForGroup } from '../../../../../redux/actions/group-actions';
import { fetchServiceAccounts } from '../../../../../redux/actions/service-account-actions';
import { ServiceAccountsState } from '../../../../../redux/reducers/service-account-reducer';
import { TableState } from './EditUserGroupUsersAndServiceAccounts';

const EmptyTable: React.FunctionComponent<{ titleText: string }> = ({ titleText }) => {
  return (
    <EmptyState>
      <EmptyStateHeader titleText={titleText} headingLevel="h4" icon={<EmptyStateIcon icon={SearchIcon} />} />
      <EmptyStateBody>
        <FormattedMessage
          {...Messages['usersEmptyStateSubtitle']}
          values={{
            br: <br />,
          }}
        />
      </EmptyStateBody>
    </EmptyState>
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

  useEffect(() => {
    onSelect(false);
    const initialSelectedServiceAccounts = initialServiceAccountIds.map((id) => ({ id }));
    onSelect(true, initialSelectedServiceAccounts);
  }, [initialServiceAccountIds]);

  const { serviceAccounts, status, isLoading } = useSelector(reducer);
  const totalCount = useMemo(() => {
    if (!serviceAccounts) return 0;
    const currentCount = (page - 1) * perPage + serviceAccounts.length;
    return status === LAST_PAGE ? currentCount : currentCount + 1;
  }, [serviceAccounts, page, perPage, status]);

  useEffect(() => {
    if (isLoading) {
      setActiveState(DataViewState.loading);
    } else {
      setActiveState(serviceAccounts.length === 0 ? DataViewState.empty : undefined);
    }
  }, [serviceAccounts.length, isLoading]);

  const fetchData = useCallback(
    async (apiProps: { count: number; limit: number; offset: number; orderBy: string }) => {
      if (groupId) {
        const { count, limit, offset, orderBy } = apiProps;
        const env = getEnvironmentDetails();
        const token = await auth.getToken();
        dispatch(fetchServiceAccounts({ ...mappedProps({ count, limit, offset, orderBy, token, sso: env?.sso }) }));
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
          empty: <EmptyTable titleText={intl.formatMessage(Messages.usersEmptyStateTitle)} />,
        }}
      />
    </DataView>
  );
};

export default EditGroupServiceAccountsTable;
