import React, { Fragment, useCallback, useContext, useEffect, useRef } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { createSearchParams, useParams } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { useDataViewFilters, useDataViewPagination, useDataViewSelection } from '@patternfly/react-data-view';
import DateFormat from '@redhat-cloud-services/frontend-components/DateFormat';

import { fetchServiceAccountsForGroup } from '../../../../../redux/groups/actions';
import { getDateFormat } from '../../../../../helpers/stringUtilities';
import { DEFAULT_ACCESS_GROUP_ID } from '../../../../../utilities/constants';
import PermissionsContext from '../../../../../utilities/permissionsContext';
import useAppNavigate from '../../../../../hooks/useAppNavigate';
import messages from '../../../../../Messages';
import pathnames from '../../../../../utilities/pathnames';

import type { ServiceAccount, ServiceAccountFilters, ServiceAccountTableRow } from '../types';
import type { RBACStore } from '../../../../../redux/store';

interface UseGroupServiceAccountsReturn {
  // Core data
  serviceAccounts: ServiceAccount[];
  isLoading: boolean;
  totalCount: number;

  // State
  isAdminDefault: boolean;
  isPlatformDefault: boolean;
  hasPermissions: boolean;

  // DataView hooks
  filters: ReturnType<typeof useDataViewFilters>;
  selection: ReturnType<typeof useDataViewSelection>;
  pagination: ReturnType<typeof useDataViewPagination>;

  // Computed values
  tableRows: ServiceAccountTableRow[];
  columns: Array<{ cell: string }>;
  hasActiveFilters: boolean;

  // Actions
  fetchData: () => void;
  onRemoveServiceAccounts: (accounts: ServiceAccount[]) => void;
  onAddServiceAccount: () => void;

  // Empty state props
  emptyStateProps: {
    colSpan: number;
    hasActiveFilters: boolean;
    titleText: string;
    descriptionText: string;
  };
}

export const useGroupServiceAccounts = (): UseGroupServiceAccountsReturn => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const { groupId } = useParams<{ groupId: string }>();

  // Permissions
  const { userAccessAdministrator, orgAdmin } = useContext(PermissionsContext);
  const hasPermissions = useRef(orgAdmin || userAccessAdministrator);

  // DataView hooks
  const filters = useDataViewFilters<ServiceAccountFilters>({
    initialFilters: { clientId: '', name: '', description: '' },
  });

  const selection = useDataViewSelection({
    matchOption: (a, b) => a.uuid === b.uuid,
  });

  const pagination = useDataViewPagination({ perPage: 20 });

  // Redux selectors
  const { serviceAccounts, isLoading, totalCount, isAdminDefault, isPlatformDefault, systemGroupUuid } = useSelector((state: RBACStore) => {
    const selectedGroup = state.groupReducer?.selectedGroup;
    const systemGroup = state.groupReducer?.systemGroup;

    return {
      serviceAccounts: selectedGroup?.serviceAccounts?.data || [],
      isLoading: selectedGroup?.serviceAccounts?.isLoading || false,
      totalCount: selectedGroup?.serviceAccounts?.meta?.count || 0,
      isAdminDefault: selectedGroup?.admin_default || false,
      isPlatformDefault: selectedGroup?.platform_default || false,
      systemGroupUuid: systemGroup?.uuid,
    };
  }, shallowEqual);

  // Update permissions ref
  useEffect(() => {
    hasPermissions.current = orgAdmin || userAccessAdministrator;
  }, [orgAdmin, userAccessAdministrator]);

  // Data fetching
  const fetchGroupAccounts = useCallback(
    (targetGroupId: string, options: any) => {
      dispatch(fetchServiceAccountsForGroup(targetGroupId, options));
    },
    [dispatch],
  );

  const fetchData = useCallback(() => {
    const targetGroupId = groupId !== DEFAULT_ACCESS_GROUP_ID ? groupId! : systemGroupUuid;
    if (targetGroupId) {
      fetchGroupAccounts(targetGroupId, {
        ...pagination,
        ...filters.filters,
      });
    }
  }, [groupId, systemGroupUuid, pagination, filters.filters, fetchGroupAccounts]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchData();
  }, [systemGroupUuid]);

  // Columns definition
  const columns = React.useMemo(
    () => [
      { cell: intl.formatMessage(messages.name) },
      { cell: intl.formatMessage(messages.clientId) },
      { cell: intl.formatMessage(messages.owner) },
      { cell: intl.formatMessage(messages.timeCreated) },
    ],
    [intl],
  );

  // Table rows generation
  const tableRows = React.useMemo(() => {
    return serviceAccounts.map((account) => ({
      id: account.uuid,
      row: [
        selection.isSelected(account),
        account.name,
        account.clientId || '',
        (account as any).owner || '',
        account.time_created
          ? React.createElement(
              Fragment,
              { key: `${account.name}-modified` },
              React.createElement(DateFormat, {
                date: account.time_created,
                type: getDateFormat(account.time_created.toString()),
              }),
            )
          : '',
      ],
      item: account,
    }));
  }, [serviceAccounts, selection]);

  // Computed values
  const hasActiveFilters = Object.values(filters.filters).some((value) => value !== '');

  // Actions
  const onRemoveServiceAccounts = useCallback(
    (accounts: ServiceAccount[]) => {
      const searchParams = createSearchParams();
      accounts.forEach(({ name }) => searchParams.append('name', name));
      navigate({
        pathname: pathnames['group-service-accounts-remove-group'].link.replace(':groupId', groupId!),
        search: searchParams.toString(),
      });
    },
    [navigate, groupId],
  );

  const onAddServiceAccount = useCallback(() => {
    navigate(pathnames['group-add-service-account'].link.replace(':groupId', groupId!));
  }, [navigate, groupId]);

  // Empty state props
  const emptyStateProps = {
    colSpan: columns.length,
    hasActiveFilters,
    titleText: intl.formatMessage(messages.noGroupAccounts),
    descriptionText: intl.formatMessage(isAdminDefault ? messages.contactServiceTeamForAccounts : messages.addAccountsToThisGroup),
  };

  return {
    serviceAccounts,
    isLoading,
    totalCount,
    isAdminDefault,
    isPlatformDefault,
    hasPermissions: hasPermissions.current,
    filters,
    selection,
    pagination,
    tableRows,
    columns,
    hasActiveFilters,
    fetchData,
    onRemoveServiceAccounts,
    onAddServiceAccount,
    emptyStateProps,
  };
};
