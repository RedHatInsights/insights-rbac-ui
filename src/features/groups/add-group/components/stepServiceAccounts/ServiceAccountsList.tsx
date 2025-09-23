import DateFormat from '@redhat-cloud-services/frontend-components/DateFormat';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { useDataViewPagination, useDataViewSelection } from '@patternfly/react-data-view/dist/dynamic/Hooks';
import { DataView, DataViewState } from '@patternfly/react-data-view/dist/dynamic/DataView';
import { DataViewToolbar } from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';
import { DataViewTable } from '@patternfly/react-data-view/dist/dynamic/DataViewTable';
import { DataViewTh, DataViewTr } from '@patternfly/react-data-view';
import { BulkSelect, BulkSelectValue } from '@patternfly/react-component-groups/dist/dynamic/BulkSelect';
import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateHeader } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { Pagination } from '@patternfly/react-core/dist/dynamic/components/Pagination';
import { SkeletonTable, SkeletonTableBody, SkeletonTableHead } from '@patternfly/react-component-groups';
import { TableVariant } from '@patternfly/react-table';
import SearchIcon from '@patternfly/react-icons/dist/js/icons/search-icon';
import { LAST_PAGE } from '../../../../../redux/service-accounts/constants';
import { ServiceAccount } from '../../../../../redux/service-accounts/types';
import { getDateFormat } from '../../../../../helpers/stringUtilities';
import messages from '../../../../../Messages';
import { fetchServiceAccounts } from '../../../../../redux/service-accounts/actions';
import { ServiceAccountsState } from '../../../../../redux/service-accounts/reducer';
import { PaginationProps } from '../../../group/service-account/AddGroupServiceAccounts';
import { PER_PAGE_OPTIONS } from '../../../../../helpers/pagination';
import './serviceAccountsList.scss';

interface ServiceAccountsListProps {
  initialSelectedServiceAccounts: ServiceAccount[];
  onSelect: (selectedServiceAccounts: ServiceAccount[]) => void;
  groupId?: string;
}

const reducer = ({ serviceAccountReducer }: { serviceAccountReducer: ServiceAccountsState }) => ({
  serviceAccounts: serviceAccountReducer.serviceAccounts,
  status: serviceAccountReducer.status,
  isLoading: serviceAccountReducer.isLoading,
  limit: serviceAccountReducer.limit,
  offset: serviceAccountReducer.offset,
});

const EmptyTable: React.FunctionComponent<{ titleText: string; bodyText: string }> = ({ titleText, bodyText }) => {
  return (
    <EmptyState>
      <EmptyStateHeader titleText={titleText} headingLevel="h4" icon={<SearchIcon />} />
      <EmptyStateBody>{bodyText}</EmptyStateBody>
    </EmptyState>
  );
};

export const ServiceAccountsList: React.FunctionComponent<ServiceAccountsListProps> = ({ initialSelectedServiceAccounts, onSelect, groupId }) => {
  const { auth, getEnvironmentDetails } = useChrome();
  const { serviceAccounts, status, limit, offset, isLoading } = useSelector(reducer);
  const [activeState, setActiveState] = useState<DataViewState | undefined>(DataViewState.loading);

  const dispatch = useDispatch();
  const intl = useIntl();

  const pagination = useDataViewPagination({ perPage: limit || 20 });
  const { page, perPage, onSetPage, onPerPageSelect } = pagination;

  const selection = useDataViewSelection({
    matchOption: (a, b) => a.id === b.id,
    initialSelected: initialSelectedServiceAccounts.map((serviceAccount) => ({ id: serviceAccount.uuid })),
  });
  const { selected: dataViewSelected, onSelect: dataViewOnSelect, isSelected } = selection;

  useEffect(() => {
    const selectedServiceAccounts = serviceAccounts.filter((serviceAccount) =>
      dataViewSelected.some((selected) => selected.id === serviceAccount.uuid),
    );
    onSelect(selectedServiceAccounts);
  }, [dataViewSelected, serviceAccounts, onSelect]);

  useEffect(() => {
    const dataViewItems = serviceAccounts.map((serviceAccount) => ({ id: serviceAccount.uuid }));
    const selectedItems = dataViewItems.filter((item) => initialSelectedServiceAccounts.some((serviceAccount) => serviceAccount.uuid === item.id));
    if (selectedItems.length !== dataViewSelected.length || !selectedItems.every((item) => dataViewSelected.some((s) => s.id === item.id))) {
      dataViewOnSelect(false);
      if (selectedItems.length > 0) {
        dataViewOnSelect(true, selectedItems);
      }
    }
  }, [initialSelectedServiceAccounts]);

  const fetchAccounts = useCallback(
    async (props?: PaginationProps) => {
      const env = getEnvironmentDetails();
      const token = await auth.getToken();
      dispatch(
        fetchServiceAccounts({
          limit: props?.limit ?? perPage,
          offset: props?.offset ?? (page - 1) * perPage,
          token,
          sso: env?.sso,
          groupId,
        }),
      );
    },
    [perPage, page, groupId],
  );

  useEffect(() => {
    fetchAccounts({ limit: perPage, offset: (page - 1) * perPage });
  }, [fetchAccounts]);

  useEffect(() => {
    if (isLoading) {
      setActiveState(DataViewState.loading);
    } else {
      serviceAccounts.length === 0 ? setActiveState(DataViewState.empty) : setActiveState(undefined);
    }
  }, [serviceAccounts.length, isLoading]);

  const COLUMN_HEADERS = [
    { label: intl.formatMessage(messages.name), key: 'name', index: 0 },
    { label: intl.formatMessage(messages.description), key: 'description', index: 1 },
    { label: intl.formatMessage(messages.clientId), key: 'clientId', index: 2 },
    { label: intl.formatMessage(messages.owner), key: 'owner', index: 3 },
    { label: intl.formatMessage(messages.timeCreated), key: 'timeCreated', index: 4 },
  ];

  const columns: DataViewTh[] = COLUMN_HEADERS.map((column) => ({
    cell: column.label,
    props: {},
  }));

  const rows: DataViewTr[] = useMemo(() => {
    return serviceAccounts.map((serviceAccount: ServiceAccount) => ({
      id: serviceAccount.uuid,
      row: Object.values({
        name: serviceAccount.name,
        description: serviceAccount.description || '',
        clientId: serviceAccount.clientId,
        owner: serviceAccount.createdBy,
        timeCreated: <DateFormat date={serviceAccount.createdAt} type={getDateFormat(String(serviceAccount.createdAt))} />,
      }),
      props: {
        isRowSelected: initialSelectedServiceAccounts.some((selectedServiceAccount) => selectedServiceAccount.uuid === serviceAccount.uuid),
      },
    }));
  }, [serviceAccounts, initialSelectedServiceAccounts]);

  const handleBulkSelect = (value: BulkSelectValue) => {
    const selectableServiceAccounts = serviceAccounts.filter((serviceAccount) => !serviceAccount.assignedToSelectedGroup);

    if (value === BulkSelectValue.none) {
      onSelect([]);
      dataViewOnSelect(false);
    } else if (value === BulkSelectValue.all || value === BulkSelectValue.page) {
      onSelect(selectableServiceAccounts);
      const dataViewItems = selectableServiceAccounts.map((sa) => ({ id: sa.uuid }));
      dataViewOnSelect(true, dataViewItems);
    } else if (value === BulkSelectValue.nonePage) {
      onSelect([]);
      dataViewOnSelect(false);
    }
  };

  const pageSelected = rows.length > 0 && rows.every(isSelected);
  const pagePartiallySelected = !pageSelected && rows.some(isSelected);
  const totalCount = status === LAST_PAGE ? offset + serviceAccounts.length : offset + serviceAccounts.length + 1;

  const ouiaId = 'group-add-service-accounts';

  return (
    <div className="rbac-service-accounts-list">
      <DataView ouiaId={ouiaId} selection={selection} activeState={activeState}>
        <DataViewToolbar
          ouiaId={`${ouiaId}-header-toolbar`}
          bulkSelect={
            <BulkSelect
              isDataPaginated
              pageCount={serviceAccounts.length}
              totalCount={totalCount}
              selectedCount={dataViewSelected.length}
              pageSelected={pageSelected}
              pagePartiallySelected={pagePartiallySelected}
              onSelect={handleBulkSelect}
            />
          }
          pagination={
            <Pagination
              perPageOptions={PER_PAGE_OPTIONS}
              itemCount={totalCount}
              page={page}
              perPage={perPage}
              onSetPage={onSetPage}
              onPerPageSelect={onPerPageSelect}
            />
          }
        />
        {isLoading ? (
          <SkeletonTable rowsCount={10} columns={columns} variant={TableVariant.compact} />
        ) : (
          <DataViewTable
            variant="compact"
            columns={columns}
            rows={rows}
            ouiaId={`${ouiaId}-table`}
            headStates={{ loading: <SkeletonTableHead columns={columns} /> }}
            bodyStates={{
              loading: <SkeletonTableBody rowsCount={10} columnsCount={columns.length} />,
              empty: (
                <EmptyTable
                  titleText={intl.formatMessage(messages.noServiceAccountsFound)}
                  bodyText={intl.formatMessage(messages.groupServiceAccountEmptyStateBody)}
                />
              ),
            }}
          />
        )}
        <DataViewToolbar
          ouiaId={`${ouiaId}-footer-toolbar`}
          pagination={
            <Pagination
              perPageOptions={PER_PAGE_OPTIONS}
              itemCount={totalCount}
              page={page}
              perPage={perPage}
              onSetPage={onSetPage}
              onPerPageSelect={onPerPageSelect}
            />
          }
        />
      </DataView>
    </div>
  );
};

export default ServiceAccountsList;
