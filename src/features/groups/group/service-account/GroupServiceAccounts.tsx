import React, { Fragment, Suspense, useCallback, useContext, useEffect, useMemo } from 'react';
import { Outlet, createSearchParams, useParams } from 'react-router-dom';
import { useIntl } from 'react-intl';

import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import Section from '@redhat-cloud-services/frontend-components/Section';

import { DefaultEmptyStateNoData, DefaultEmptyStateNoResults, TableView, useTableState } from '../../../../components/table-view';
import { ActionDropdown } from '../../../../components/ActionDropdown';
import { AppLink } from '../../../../components/navigation/AppLink';
import { DefaultServiceAccountsAlert } from '../../components/DefaultServiceAccountsAlert';

import { columns, useGroupServiceAccountsTableConfig } from './useGroupServiceAccountsTableConfig';
import { useGroupQuery, useGroupServiceAccountsQuery, useGroupsQuery } from '../../../../data/queries/groups';

import { DEFAULT_ACCESS_GROUP_ID } from '../../../../utilities/constants';
import PermissionsContext from '../../../../utilities/permissionsContext';
import useAppNavigate from '../../../../hooks/useAppNavigate';
import messages from '../../../../Messages';
import pathnames from '../../../../utilities/pathnames';
import type { GroupServiceAccountsProps, ServiceAccount } from './types';

/**
 * GroupServiceAccounts - fetches its own data via React Query.
 *
 * Migrated from Redux - component is now self-contained.
 */
export const GroupServiceAccounts: React.FC<GroupServiceAccountsProps> = (props) => {
  const intl = useIntl();
  const navigate = useAppNavigate();
  const { groupId } = useParams<{ groupId: string }>();

  // Permissions
  const { userAccessAdministrator, orgAdmin } = useContext(PermissionsContext);
  const hasPermissions = orgAdmin || userAccessAdministrator;

  // For default access groups, we need to first get the system group UUID
  const isPlatformDefaultRoute = groupId === DEFAULT_ACCESS_GROUP_ID;

  // Fetch system group UUID when viewing default access group
  const { data: systemGroupData } = useGroupsQuery({ platformDefault: true, limit: 1 }, { enabled: isPlatformDefaultRoute });
  const systemGroupUuid = systemGroupData?.data?.[0]?.uuid;

  // Resolve actual group ID (handle default access group)
  const actualGroupId = useMemo(() => (isPlatformDefaultRoute ? systemGroupUuid : groupId), [isPlatformDefaultRoute, systemGroupUuid, groupId]);

  // Fetch group data
  const { data: groupData, isLoading: isGroupLoading } = useGroupQuery(actualGroupId ?? '', {
    enabled: !!actualGroupId,
  });

  // Derive group flags from the group data
  const isPlatformDefault = groupData?.platform_default === true;
  const isAdminDefault = groupData?.admin_default === true;
  const isSystemGroup = groupData?.system === true;
  const isChanged = isPlatformDefault && !isSystemGroup;
  const group = groupData;

  // Table configuration
  const { columnConfig, cellRenderers, filterConfig } = useGroupServiceAccountsTableConfig({ intl });

  // useTableState for all state management - provides apiParams for queries
  const tableState = useTableState<typeof columns, ServiceAccount>({
    columns,
    initialPerPage: 20,
    getRowId: (account) => account.uuid,
    syncWithUrl: false,
  });

  // Fetch service accounts using apiParams from tableState
  const { data: serviceAccountsData, isLoading: isServiceAccountsLoading } = useGroupServiceAccountsQuery(
    actualGroupId ?? '',
    {
      limit: tableState.apiParams.limit,
      offset: tableState.apiParams.offset,
      clientId: (tableState.apiParams.filters.clientId as string) || undefined,
      name: (tableState.apiParams.filters.name as string) || undefined,
    },
    { enabled: !!actualGroupId },
  );

  const serviceAccounts = serviceAccountsData?.data ?? [];
  const totalCount = serviceAccountsData?.meta?.count ?? 0;

  // Permission flag for modifying service accounts (non-default groups with permissions)
  const canModifyServiceAccounts = hasPermissions && !isAdminDefault && !isPlatformDefault;

  // Enable selection when user can modify
  const selectable = canModifyServiceAccounts;

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

  // Show loading state
  if (isGroupLoading) {
    return (
      <Section type="content" id="tab-service-accounts">
        <div>Loading...</div>
      </Section>
    );
  }

  // Show special card for system default groups (not yet modified)
  if ((isAdminDefault || isPlatformDefault) && isSystemGroup) {
    return (
      <Section type="content" id="tab-service-accounts">
        <DefaultServiceAccountsAlert isPlatformDefault={isPlatformDefault} />
      </Section>
    );
  }

  return (
    <Fragment>
      <Section type="content" id="tab-service-accounts">
        <Alert
          className="pf-v6-u-mb-md"
          variant="info"
          isInline
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
          data={isServiceAccountsLoading ? undefined : serviceAccounts}
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
              postMethod: () => {
                navigate(pathnames['group-detail-service-accounts'].link.replace(':groupId', groupId!));
                // Note: With React Query, cache invalidation happens automatically
              },
            },
            [pathnames['group-add-service-account'].path]: {
              isDefault: isPlatformDefault || isAdminDefault,
              isChanged: isChanged,
              onDefaultGroupChanged: props.onDefaultGroupChanged,
              fetchUuid: systemGroupUuid,
              groupName: group?.name,
              postMethod: () => {
                navigate(pathnames['group-detail-service-accounts'].link.replace(':groupId', groupId!));
                // Note: With React Query, cache invalidation happens automatically
              },
            },
          }}
        />
      </Suspense>
    </Fragment>
  );
};

export default GroupServiceAccounts;
