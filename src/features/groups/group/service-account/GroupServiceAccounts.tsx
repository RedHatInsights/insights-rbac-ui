import React, { Fragment, Suspense, useCallback, useContext, useEffect, useMemo } from 'react';
import { Outlet, createSearchParams, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';

import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import Section from '@redhat-cloud-services/frontend-components/Section';

import { DefaultEmptyStateNoData, DefaultEmptyStateNoResults, TableView, useTableState } from '../../../../components/table-view';
import { ActionDropdown } from '../../../../components/ActionDropdown';
import { AppLink } from '../../../../components/navigation/AppLink';
import { DefaultServiceAccountsCard } from '../../components/DefaultServiceAccountsCard';

import { columns, useGroupServiceAccountsTableConfig } from './useGroupServiceAccountsTableConfig';

import { fetchGroup, fetchServiceAccountsForGroup } from '../../../../redux/groups/actions';
import {
  selectGroupServiceAccounts,
  selectGroupServiceAccountsMeta,
  selectIsAdminDefaultGroup,
  selectIsChangedDefaultGroup,
  selectIsGroupServiceAccountsLoading,
  selectIsPlatformDefaultGroup,
  selectSelectedGroup,
  selectSystemGroupUUID,
} from '../../../../redux/groups/selectors';

import { DEFAULT_ACCESS_GROUP_ID } from '../../../../utilities/constants';
import PermissionsContext from '../../../../utilities/permissionsContext';
import useAppNavigate from '../../../../hooks/useAppNavigate';
import messages from '../../../../Messages';
import pathnames from '../../../../utilities/pathnames';
import type { GroupServiceAccountsProps, ServiceAccount } from './types';

import './group-service-accounts.scss';

export const GroupServiceAccounts: React.FC<GroupServiceAccountsProps> = (props) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const { groupId } = useParams<{ groupId: string }>();

  // Permissions
  const { userAccessAdministrator, orgAdmin } = useContext(PermissionsContext);
  const hasPermissions = orgAdmin || userAccessAdministrator;

  // Redux state
  const serviceAccounts = useSelector(selectGroupServiceAccounts);
  const pagination = useSelector(selectGroupServiceAccountsMeta);
  const isReduxLoading = useSelector(selectIsGroupServiceAccountsLoading);
  const isPlatformDefault = useSelector(selectIsPlatformDefaultGroup);
  const isAdminDefault = useSelector(selectIsAdminDefaultGroup);
  const isChanged = useSelector(selectIsChangedDefaultGroup);
  const systemGroupUuid = useSelector(selectSystemGroupUUID);
  const group = useSelector(selectSelectedGroup);

  // Resolve actual group ID (handle default access group)
  const actualGroupId = useMemo(() => (groupId !== DEFAULT_ACCESS_GROUP_ID ? groupId! : systemGroupUuid), [groupId, systemGroupUuid]);

  // Table configuration
  const { columnConfig, cellRenderers, filterConfig } = useGroupServiceAccountsTableConfig({ intl });

  // Data fetching function
  const fetchData = useCallback(
    (params: { offset: number; limit: number; orderBy?: string; filters: Record<string, string | string[]> }) => {
      if (!actualGroupId) return;

      const clientIdFilter = typeof params.filters.clientId === 'string' ? params.filters.clientId : '';
      const nameFilter = typeof params.filters.name === 'string' ? params.filters.name : '';

      dispatch(
        fetchServiceAccountsForGroup(actualGroupId, {
          limit: params.limit,
          offset: params.offset,
          clientId: clientIdFilter || undefined,
          name: nameFilter || undefined,
        }) as any,
      );
    },
    [dispatch, actualGroupId],
  );

  // Table state hook
  const tableState = useTableState<typeof columns, ServiceAccount>({
    columns,
    initialPerPage: 20,
    getRowId: (account) => account.uuid,
    syncWithUrl: false,
    onStaleData: fetchData,
  });

  // Total count from Redux pagination
  const totalCount = pagination?.count ?? 0;

  // Permission flag for modifying service accounts (non-default groups with permissions)
  const canModifyServiceAccounts = hasPermissions && !isAdminDefault && !isPlatformDefault;

  // Enable selection when user can modify
  const selectable = canModifyServiceAccounts;

  // Refetch when actualGroupId becomes available (handles default access group case)
  // This effect intentionally only depends on actualGroupId to avoid refetching on every param change
  useEffect(() => {
    if (actualGroupId) {
      fetchData({
        offset: tableState.apiParams.offset,
        limit: tableState.apiParams.limit,
        filters: tableState.apiParams.filters,
      });
    }
    // eslint-disable-next-line
  }, [actualGroupId]);

  // Handle default group changes
  useEffect(() => {
    if (isChanged && props.onDefaultGroupChanged && group) {
      props.onDefaultGroupChanged({ uuid: group.uuid, name: group.name });
    }
  }, [isChanged, group, props.onDefaultGroupChanged]);

  // Remove handlers
  const handleRemoveServiceAccount = useCallback(
    (account: ServiceAccount) => {
      navigate({
        pathname: pathnames['group-service-accounts-remove-group'].link.replace(':groupId', groupId!),
        search: createSearchParams({ uuid: account.uuid }).toString(),
      });
    },
    [navigate, groupId],
  );

  const handleRemoveSelectedServiceAccounts = useCallback(() => {
    if (tableState.selectedRows.length === 0) return;

    const searchParams = createSearchParams();
    tableState.selectedRows.forEach((account) => {
      searchParams.append('uuid', account.uuid);
    });

    navigate({
      pathname: pathnames['group-service-accounts-remove-group'].link.replace(':groupId', groupId!),
      search: searchParams.toString(),
    });

    tableState.clearSelection();
  }, [tableState.selectedRows, navigate, groupId, tableState.clearSelection]);

  // Toolbar content
  const toolbarActions = useMemo(() => {
    if (!canModifyServiceAccounts) return undefined;

    return (
      <Button
        key="add-service-account"
        variant="primary"
        ouiaId="add-service-account-button"
        onClick={() => navigate(pathnames['group-add-service-account'].link.replace(':groupId', groupId!))}
      >
        {intl.formatMessage(messages.addServiceAccount)}
      </Button>
    );
  }, [canModifyServiceAccounts, groupId, intl, navigate]);

  const bulkActions = useMemo(() => {
    if (!canModifyServiceAccounts) return undefined;

    return (
      <ActionDropdown
        ariaLabel="bulk actions"
        ouiaId="service-accounts-bulk-actions"
        items={[
          {
            key: 'remove',
            label: intl.formatMessage(messages.remove),
            onClick: handleRemoveSelectedServiceAccounts,
            isDisabled: tableState.selectedRows.length === 0,
          },
        ]}
      />
    );
  }, [canModifyServiceAccounts, tableState.selectedRows.length, intl, handleRemoveSelectedServiceAccounts]);

  // Show special card for system default groups
  if ((isAdminDefault || isPlatformDefault) && group?.system) {
    return (
      <Section type="content" id="tab-service-accounts">
        <DefaultServiceAccountsCard isPlatformDefault={isPlatformDefault} />
      </Section>
    );
  }

  return (
    <Fragment>
      <Section type="content" id="tab-service-accounts">
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

        <TableView<typeof columns, ServiceAccount>
          columns={columns}
          columnConfig={columnConfig}
          data={isReduxLoading ? undefined : serviceAccounts}
          totalCount={totalCount}
          getRowId={(account) => account.uuid}
          cellRenderers={cellRenderers}
          selectable={selectable}
          renderActions={
            canModifyServiceAccounts
              ? (account) => (
                  <ActionDropdown
                    ariaLabel={`Actions for service account ${account.name}`}
                    ouiaId={`service-account-${account.uuid}-actions`}
                    items={[
                      {
                        key: 'remove',
                        label: intl.formatMessage(messages.remove),
                        onClick: () => handleRemoveServiceAccount(account),
                      },
                    ]}
                  />
                )
              : undefined
          }
          filterConfig={filterConfig}
          toolbarActions={toolbarActions}
          bulkActions={bulkActions}
          emptyStateNoData={
            <DefaultEmptyStateNoData
              title={intl.formatMessage(messages.noGroupAccounts)}
              body={intl.formatMessage(isAdminDefault ? messages.contactServiceTeamForAccounts : messages.addAccountsToThisGroup)}
            />
          }
          emptyStateNoResults={
            <DefaultEmptyStateNoResults
              title={intl.formatMessage(messages.noServiceAccountsFound)}
              body={intl.formatMessage(messages.noFilteredRoles)}
            />
          }
          variant="default"
          ouiaId="group-service-accounts-table"
          ariaLabel={intl.formatMessage(messages.serviceAccounts)}
          {...tableState}
        />
      </Section>

      <Suspense fallback={<div>Loading...</div>}>
        <Outlet
          context={{
            [pathnames['group-service-accounts-edit-group'].path]: {
              group,
              cancelRoute: pathnames['group-detail-service-accounts'].link.replace(':groupId', groupId!),
              submitRoute: pathnames['group-detail-service-accounts'].link.replace(':groupId', groupId!),
            },
            [pathnames['group-service-accounts-remove-group'].path]: {
              postMethod: (promise: Promise<unknown>) => {
                navigate(pathnames['group-detail-service-accounts'].link.replace(':groupId', groupId!));
                if (promise) {
                  promise.then?.(() =>
                    fetchData({
                      offset: tableState.apiParams.offset,
                      limit: tableState.apiParams.limit,
                      filters: tableState.apiParams.filters,
                    }),
                  );
                }
              },
            },
            [pathnames['group-add-service-account'].path]: {
              isDefault: isPlatformDefault || isAdminDefault,
              isChanged: isChanged,
              onDefaultGroupChanged: props.onDefaultGroupChanged,
              fetchUuid: systemGroupUuid,
              groupName: group?.name,
              postMethod: (promise: Promise<unknown>) => {
                navigate(pathnames['group-detail-service-accounts'].link.replace(':groupId', groupId!));
                if (promise) {
                  promise.then?.(() => {
                    if ((isPlatformDefault || isAdminDefault) && !isChanged) {
                      dispatch(fetchGroup(groupId!) as any);
                    }
                    fetchData({
                      offset: tableState.apiParams.offset,
                      limit: tableState.apiParams.limit,
                      filters: tableState.apiParams.filters,
                    });
                  });
                }
              },
            },
          }}
        />
      </Suspense>
    </Fragment>
  );
};

export default GroupServiceAccounts;
