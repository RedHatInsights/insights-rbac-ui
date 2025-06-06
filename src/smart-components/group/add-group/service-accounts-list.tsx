import DateFormat from '@redhat-cloud-services/frontend-components/DateFormat';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import React, { Dispatch, Fragment, SetStateAction, useCallback, useEffect } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { LAST_PAGE } from '../../../helpers/service-account/constants';
import { ServiceAccount } from '../../../helpers/service-account/types';
import { getDateFormat } from '../../../helpers/shared/helpers';
import messages from '../../../Messages';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';
import { fetchServiceAccounts } from '../../../redux/actions/service-account-actions';
import { ServiceAccountsState } from '../../../redux/reducers/service-account-reducer';
import { PaginationProps } from '../service-account/add-group-service-accounts';
import './service-accounts-list.scss';

interface ServiceAccountsListProps {
  selected: ServiceAccount[];
  setSelected: Dispatch<SetStateAction<ServiceAccount[]>>;
  // optional group ID to check whether SA are assigned to selected group
  groupId?: string;
}

const reducer = ({ serviceAccountReducer }: { serviceAccountReducer: ServiceAccountsState }) => ({
  serviceAccounts: serviceAccountReducer.serviceAccounts,
  status: serviceAccountReducer.status,
  isLoading: serviceAccountReducer.isLoading,
  limit: serviceAccountReducer.limit,
  offset: serviceAccountReducer.offset,
});

const createRows = (data: ServiceAccount[], checkedRows: ServiceAccount[]) =>
  data?.reduce(
    (acc: unknown[], curr: ServiceAccount) => [
      ...acc,
      {
        uuid: curr.uuid,
        title: curr.name,
        cells: [
          curr.name,
          curr.description,
          curr.clientId,
          curr.createdBy,
          <Fragment key={`${curr.name}-modified`}>
            <DateFormat date={curr.createdAt} type={getDateFormat(curr.createdAt)} />
          </Fragment>,
        ],
        selected: Boolean(checkedRows && checkedRows.find((row: ServiceAccount) => row.uuid === curr.uuid)) || curr.assignedToSelectedGroup,
        disableSelection: curr.assignedToSelectedGroup,
      },
    ],
    [],
  );

export const ServiceAccountsList: React.FunctionComponent<ServiceAccountsListProps> = ({ selected, setSelected, groupId }) => {
  const { auth, getEnvironmentDetails } = useChrome();
  const { serviceAccounts, status, limit, offset, isLoading } = useSelector(reducer);

  const dispatch = useDispatch();
  const intl = useIntl();

  const fetchAccounts = useCallback(
    async (props?: PaginationProps) => {
      const env = getEnvironmentDetails();
      const token = await auth.getToken();
      dispatch(
        fetchServiceAccounts({
          limit: props?.limit ?? limit,
          offset: props?.offset ?? offset,
          token,
          sso: env?.sso,
          groupId,
        }),
      );
    },
    [limit, offset],
  );

  useEffect(() => {
    fetchAccounts({ limit, offset: 0 });
  }, []);

  const columns = [
    { title: intl.formatMessage(messages.name), orderBy: 'name' },
    { title: intl.formatMessage(messages.description), orderBy: 'description' },
    { title: intl.formatMessage(messages.clientId), orderBy: 'clientId' },
    { title: intl.formatMessage(messages.owner), orderBy: 'owner' },
    { title: intl.formatMessage(messages.timeCreated), orderBy: 'timeCreated' },
  ];

  return (
    <TableToolbarView
      className="rbac-service-accounts-list"
      columns={columns}
      isSelectable
      rows={createRows(serviceAccounts, selected)}
      data={serviceAccounts}
      fetchData={fetchAccounts}
      isLoading={isLoading}
      pagination={{
        limit,
        offset,
        ...(status === LAST_PAGE ? { count: offset + serviceAccounts.length } : {}),
      }}
      paginationProps={{
        toggleTemplate: ({ firstIndex, lastIndex }) => (
          <>
            <b>
              {firstIndex} - {lastIndex}
            </b>{' '}
            of <b>{status === LAST_PAGE ? offset + serviceAccounts.length : 'many'}</b>
          </>
        ),
        isCompact: true,
      }}
      checkedRows={selected}
      setCheckedItems={setSelected}
      titlePlural={intl.formatMessage(messages.serviceAccounts).toLowerCase()}
      titleSingular={intl.formatMessage(messages.serviceAccount)}
      emptyProps={{
        title: intl.formatMessage(messages.noServiceAccountsFound),
        description: [intl.formatMessage(messages.contactServiceTeamForAccounts), ''],
      }}
      tableId="group-add-accounts"
      ouiaId="group-add-accounts"
    />
  );
};

export default ServiceAccountsList;
