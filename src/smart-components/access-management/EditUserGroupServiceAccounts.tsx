import { Pagination } from '@patternfly/react-core';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { DataView, DataViewTable, DataViewToolbar, useDataViewPagination, useDataViewSelection } from '@patternfly/react-data-view';
import { useDispatch, useSelector } from 'react-redux';
import { fetchServiceAccountsForGroup } from '../../redux/actions/group-actions';
import { RBACStore } from '../../redux/store';
import { mappedProps } from '../../helpers/shared/helpers';
import { fetchServiceAccounts } from '../../redux/actions/service-account-actions';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { ServiceAccountsState } from '../../redux/reducers/service-account-reducer';
import { LAST_PAGE, ServiceAccount } from '../../helpers/service-account/service-account-helper';
import { BulkSelect, BulkSelectValue } from '@patternfly/react-component-groups';
import DateFormat from '@redhat-cloud-services/frontend-components/DateFormat';
import { Diff } from './EditUserGroupUsersAndServiceAccounts';

interface EditGroupServiceAccountsTableProps {
  groupId?: string;
  onChange: (serviceAccounts: Diff) => void;
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

const EditGroupServiceAccountsTable: React.FunctionComponent<EditGroupServiceAccountsTableProps> = ({ groupId, onChange }) => {
  const dispatch = useDispatch();
  const pagination = useDataViewPagination({ perPage: 20 });
  const { page, perPage, onSetPage, onPerPageSelect } = pagination;
  const { auth, getEnvironmentDetails } = useChrome();
  const initialServiceAccountIds = useRef<string[]>([]);

  const selection = useDataViewSelection({
    matchOption: (a, b) => a.id === b.id,
  });
  const { onSelect, selected } = selection;

  useEffect(() => {
    return () => {
      onSelect(false);
      initialServiceAccountIds.current = [];
    };
  }, []);

  const { serviceAccounts, status } = useSelector(reducer);
  const calculateTotalCount = () => {
    if (!serviceAccounts) return 0;
    const currentCount = (page - 1) * perPage + serviceAccounts.length;
    return status === LAST_PAGE ? currentCount : currentCount + 1;
  };
  const totalCount = calculateTotalCount();

  const { groupServiceAccounts: groupServiceAccounts } = useSelector((state: RBACStore) => ({
    groupServiceAccounts: state.groupReducer?.selectedGroup?.serviceAccounts?.data || [],
  }));

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
    [dispatch, groupId]
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
    [processedServiceAccounts, groupId]
  );

  useEffect(() => {
    // on mount, select the accounts that are in the current group
    onSelect(false);
    initialServiceAccountIds.current = [];
    const initialSelectedServiceAccounts = groupServiceAccounts.map((account) => ({ id: account.clientId }));
    onSelect(true, initialSelectedServiceAccounts);
    initialServiceAccountIds.current = initialSelectedServiceAccounts.map((account) => account.id);
  }, [groupServiceAccounts]);

  useEffect(() => {
    const selectedServiceAccountIds = selection.selected.map((account) => account.id);
    const added = selectedServiceAccountIds.filter((id) => !initialServiceAccountIds.current.includes(id));
    const removed = initialServiceAccountIds.current.filter((id) => !selectedServiceAccountIds.includes(id));
    onChange({ added, removed });
  }, [selection.selected]);

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
    <DataView selection={{ ...selection }}>
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
      <DataViewTable variant="compact" columns={['Name', 'Description', 'Client ID', 'Owner', 'Time created']} rows={rows} />
    </DataView>
  );
};

export default EditGroupServiceAccountsTable;
