import React, { useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { createSearchParams, useParams } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { useDataViewFilters, useDataViewSelection } from '@patternfly/react-data-view';
import { defaultSettings } from '../../../../../helpers/pagination';
import { fetchServiceAccountsForGroup } from '../../../../../redux/groups/actions';
import { DEFAULT_ACCESS_GROUP_ID } from '../../../../../utilities/constants';
import PermissionsContext from '../../../../../utilities/permissionsContext';
import useAppNavigate from '../../../../../hooks/useAppNavigate';
import messages from '../../../../../Messages';
import pathnames from '../../../../../utilities/pathnames';
// import { mergeToBasename } from '../../../../../helpers/mergeToBasename';
import type { GroupServiceAccountsProps, ServiceAccount } from '../types';
import type { RBACStore } from '../../../../../redux/store.d';

// Types
interface GroupServiceAccountTableRow {
  id: string;
  row: [string, string, string, React.ReactElement | string];
  item: ServiceAccount;
}

interface GroupServiceAccountDataViewFilters {
  clientId: string;
  name: string;
  description: string;
}

// Hook return interface
export interface UseGroupServiceAccountsReturn {
  // Core data
  serviceAccounts: ServiceAccount[];
  isLoading: boolean;
  pagination: any;

  // DataView hooks
  filters: ReturnType<typeof useDataViewFilters<GroupServiceAccountDataViewFilters>>;
  selection: ReturnType<typeof useDataViewSelection>;

  // Computed values
  tableRows: GroupServiceAccountTableRow[];
  columns: Array<{ cell: string }>;
  hasActiveFilters: boolean;

  // Permission states
  hasPermissions: boolean;
  isAdminDefault: boolean;
  isPlatformDefault: boolean;

  // Group data
  groupId: string | undefined;
  systemGroupUuid: string | undefined;

  // Actions
  fetchData: (apiProps?: Record<string, unknown>) => void;

  // Action resolvers
  actionResolver: (account: ServiceAccount) => Array<{ title: string; onClick: () => void }>;
  toolbarButtons: Array<React.ReactElement | { label: string; props: Record<string, unknown>; onClick: () => void }>;

  // Empty state props
  emptyStateProps: {
    colSpan: number;
    hasActiveFilters: boolean;
    title: string;
    description: string;
  };
}

const reducer = ({ groupReducer }: RBACStore) => {
  const { selectedGroup, systemGroup, groups } = groupReducer;
  return {
    serviceAccounts: selectedGroup?.serviceAccounts?.data || [],
    pagination: { ...defaultSettings, ...(selectedGroup?.serviceAccounts?.meta || {}) },
    groupsPagination: groups?.pagination || groups?.meta,
    groupsFilters: groups?.filters,
    isLoading: selectedGroup?.serviceAccounts?.isLoading || false,
    isAdminDefault: selectedGroup?.admin_default || false,
    systemGroupUuid: systemGroup?.uuid,
    group: selectedGroup,
    isPlatformDefault: selectedGroup?.platform_default || false,
  };
};

export const useGroupServiceAccounts = ({ groupId }: GroupServiceAccountsProps): UseGroupServiceAccountsReturn => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const { groupId: paramGroupId } = useParams<{ groupId: string }>();
  const actualGroupId = groupId || paramGroupId;
  const { userAccessAdministrator, orgAdmin } = useContext(PermissionsContext);
  const hasPermissions = useRef(orgAdmin || userAccessAdministrator);

  // Redux selectors
  const { serviceAccounts, pagination, isLoading, isAdminDefault, systemGroupUuid, isPlatformDefault } = useSelector(reducer, shallowEqual);

  // DataView hooks
  const filters = useDataViewFilters<GroupServiceAccountDataViewFilters>({
    initialFilters: { clientId: '', name: '', description: '' },
  });

  const selection = useDataViewSelection({
    matchOption: (a, b) => a.id === b.id,
  });

  // Fetch service accounts for group
  const fetchGroupAccounts = useCallback(
    (actualGroupId: string, options: Record<string, unknown>) => dispatch(fetchServiceAccountsForGroup(actualGroupId, options)),
    [dispatch],
  );

  const fetchData = useCallback(
    (apiProps: Record<string, unknown> = {}) => {
      const config = {
        ...pagination,
        ...apiProps,
        // Include current filter values unless explicitly overridden
        // Based on API logs, the Redux action maps clientId to principal_username
        principal_username: apiProps.clientId !== undefined ? apiProps.clientId : filters.filters.clientId,
        service_account_name:
          apiProps.service_account_name !== undefined
            ? apiProps.service_account_name
            : apiProps.name !== undefined
              ? apiProps.name
              : filters.filters.name,
        service_account_description:
          apiProps.service_account_description !== undefined
            ? apiProps.service_account_description
            : apiProps.description !== undefined
              ? apiProps.description
              : filters.filters.description,
      };
      if (actualGroupId !== DEFAULT_ACCESS_GROUP_ID) {
        fetchGroupAccounts(actualGroupId!, config);
      } else {
        systemGroupUuid && fetchGroupAccounts(systemGroupUuid, config);
      }
    },
    [systemGroupUuid, actualGroupId, pagination, fetchGroupAccounts, filters.filters],
  );

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [systemGroupUuid]);

  // Update permissions ref
  useEffect(() => {
    hasPermissions.current = orgAdmin || userAccessAdministrator;
  }, [orgAdmin, userAccessAdministrator]);

  // Action resolver for table rows
  const actionResolver = useCallback(
    (account: ServiceAccount) => [
      ...(hasPermissions.current && !isAdminDefault
        ? [
            {
              title: intl.formatMessage(messages.remove),
              onClick: () =>
                navigate({
                  pathname: pathnames['group-service-accounts-remove-group'].link.replace(':actualGroupId', actualGroupId!),
                  search: createSearchParams({ name: account.uuid }).toString(),
                }),
            },
          ]
        : []),
    ],
    [hasPermissions, isAdminDefault, intl, navigate, actualGroupId],
  );

  // Table rows with JSX elements
  const tableRows = useMemo((): GroupServiceAccountTableRow[] => {
    if (!serviceAccounts) return [];

    return serviceAccounts.map((account): GroupServiceAccountTableRow => {
      const ownerItem = serviceAccounts.find((item: ServiceAccount) => item.uuid === account.uuid);
      const owner = (ownerItem as Record<string, unknown>)?.owner || '';

      return {
        id: account.uuid,
        row: [
          account.name,
          account.clientId || '',
          owner as string,
          // Date formatting - simplified for DataView
          account.time_created ? new Date(account.time_created).toLocaleDateString() : '',
        ],
        item: account,
      };
    });
  }, [serviceAccounts]);

  // Column definitions
  const columns = useMemo(
    () => [
      { cell: intl.formatMessage(messages.name) },
      { cell: intl.formatMessage(messages.clientId) },
      { cell: intl.formatMessage(messages.owner) },
      { cell: intl.formatMessage(messages.timeCreated) },
    ],
    [intl],
  );

  // Toolbar buttons
  const toolbarButtons = useMemo(() => {
    const buttons: Array<React.ReactElement | { label: string; props: Record<string, unknown>; onClick: () => void }> = [];

    if (hasPermissions.current && !isAdminDefault && !isPlatformDefault) {
      // Add service account button
      buttons.push(
        <Button
          key="add-to-group"
          variant="primary"
          className="rbac-m-hide-on-sm"
          ouiaId="add-service-account-button"
          onClick={() => {
            navigate(pathnames['group-add-service-account'].link.replace(':actualGroupId', actualGroupId!));
          }}
        >
          {intl.formatMessage(messages.addServiceAccount)}
        </Button>,
      );

      // Remove button (bulk action)
      if (selection.selected.length > 0) {
        buttons.push({
          label: intl.formatMessage(messages.remove),
          props: {
            isDisabled: selection.selected.length === 0,
          },
          onClick: () => {
            const searchParams = createSearchParams();
            selection.selected.forEach((accountUuid: string) => {
              const account = serviceAccounts.find((sa) => sa.uuid === accountUuid);
              if (account?.name) {
                searchParams.append('name', account.name);
              }
            });
            navigate({
              pathname: pathnames['group-service-accounts-remove-group'].link.replace(':actualGroupId', actualGroupId!),
              search: searchParams.toString(),
            });
          },
        });
      }

      // Mobile add service account button
      buttons.push({
        label: intl.formatMessage(messages.addServiceAccount),
        props: {
          className: 'rbac-m-hide-on-md',
        },
        onClick: () => navigate(pathnames['group-add-service-account'].link.replace(':actualGroupId', actualGroupId!)),
      });
    }

    return buttons;
  }, [hasPermissions, isAdminDefault, isPlatformDefault, actualGroupId, selection.selected.length, serviceAccounts, intl, navigate]);

  // Computed values
  const hasActiveFilters = Object.values(filters.filters).some((value) => value !== '');

  // Empty state props
  const emptyStateProps = {
    colSpan: columns.length,
    hasActiveFilters,
    title: intl.formatMessage(messages.noGroupAccounts),
    description: intl.formatMessage(isAdminDefault ? messages.contactServiceTeamForAccounts : messages.addAccountsToThisGroup),
  };

  return {
    serviceAccounts,
    isLoading,
    pagination,
    filters,
    selection,
    tableRows,
    columns,
    hasActiveFilters,
    hasPermissions: hasPermissions.current,
    isAdminDefault,
    isPlatformDefault,
    groupId: actualGroupId,
    systemGroupUuid,
    fetchData,
    actionResolver,
    toolbarButtons,
    emptyStateProps,
  };
};
