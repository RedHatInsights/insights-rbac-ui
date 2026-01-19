/**
 * GroupRoles Page
 *
 * Displays and manages roles assigned to a group using the TableView component.
 * All table state (pagination, sorting, filtering, selection) is managed by useTableState.
 *
 * Data fetching is handled by React Query. Mutations automatically
 * invalidate the cache, so no manual refresh is needed.
 */

import React, { Fragment, Suspense, useCallback, useContext, useMemo, useRef } from 'react';
import { useIntl } from 'react-intl';
import { Outlet, useParams } from 'react-router-dom';

import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import Section from '@redhat-cloud-services/frontend-components/Section';

import { DefaultEmptyStateNoData, DefaultEmptyStateNoResults, TableView, useTableState } from '../../../../components/table-view';
import { ActionDropdown } from '../../../../components/ActionDropdown';
import { RemoveGroupRoles } from './RemoveGroupRoles';

import { columns, useGroupRolesTableConfig } from './useGroupRolesTableConfig';

// React Query
import {
  useAvailableRolesForGroupQuery,
  useGroupQuery,
  useGroupRolesQuery,
  useGroupsQuery,
  useRemoveRolesFromGroupMutation,
} from '../../../../data/queries/groups';

import { getBackRoute } from '../../../../helpers/navigation';
import PermissionsContext from '../../../../utilities/permissionsContext';
import { DEFAULT_ACCESS_GROUP_ID } from '../../../../utilities/constants';
import useAppNavigate from '../../../../hooks/useAppNavigate';
import { useGroupRemoveModal } from '../../hooks/useGroupRemoveModal';
import messages from '../../../../Messages';
import pathnames from '../../../../utilities/pathnames';
import type { GroupRolesProps, Role } from './types';

// =============================================================================
// Helper Functions
// =============================================================================

const generateOuiaID = (name: string) => {
  return name.toLowerCase().includes('default access') ? 'dag-add-role-button' : 'add-role-button';
};

// =============================================================================
// GroupRoles Component
// =============================================================================

export const GroupRoles: React.FC<GroupRolesProps> = (props) => {
  const intl = useIntl();
  const navigate = useAppNavigate();
  const { groupId } = useParams<{ groupId: string }>();

  // Permissions
  const { userAccessAdministrator, orgAdmin } = useContext(PermissionsContext);
  const hasPermissions = orgAdmin || userAccessAdministrator;

  // Fetch system group UUID for default access group handling
  const { data: systemGroupData } = useGroupsQuery({ platformDefault: true, limit: 1 });
  const systemGroupUuid = systemGroupData?.data?.[0]?.uuid;

  // Resolve actual group ID (handle default access group)
  const actualGroupId = useMemo(() => (groupId !== DEFAULT_ACCESS_GROUP_ID ? groupId! : systemGroupUuid), [groupId, systemGroupUuid]);

  // Fetch group data
  const { data: group } = useGroupQuery(actualGroupId ?? '', { enabled: !!actualGroupId });

  // Derive group properties
  const isPlatformDefault = group?.platform_default ?? false;
  const isAdminDefault = group?.admin_default ?? false;
  // isChanged: true if it's a default group that has been customized (not a pure system group)
  const isChanged = (isPlatformDefault || isAdminDefault) && !group?.system;

  // Table configuration
  const { columnConfig, cellRenderers, filterConfig } = useGroupRolesTableConfig({
    intl,
    groupId: groupId!,
  });

  // Table state hook (no sorting - API doesn't support it)
  const tableState = useTableState<typeof columns, Role>({
    columns,
    initialPerPage: 20,
    getRowId: (role) => role.uuid,
    syncWithUrl: false, // Don't sync with URL for sub-tab
  });

  // Fetch roles via React Query
  const { data: rolesData, isLoading } = useGroupRolesQuery(
    actualGroupId ?? '',
    {
      limit: tableState.apiParams.limit,
      offset: tableState.apiParams.offset,
      name: (tableState.apiParams.filters.name as string) || undefined,
    },
    { enabled: !!actualGroupId },
  );

  // Fetch available roles count (for enabling/disabling "Add Role" button)
  const { data: availableRolesData } = useAvailableRolesForGroupQuery(actualGroupId ?? '', {
    enabled: !!actualGroupId && !isAdminDefault,
  });

  // Determine if "Add Role" button should be disabled
  const disableAddRoles = isAdminDefault || (availableRolesData?.count ?? 0) === 0;

  // Extract roles and count from query result
  const roles = rolesData?.roles ?? [];
  const totalCount = rolesData?.totalCount ?? 0;

  // Enable selection for non-admin-default groups with permissions
  const selectable = hasPermissions && !isAdminDefault;

  // Track roles to remove (needed for the confirm callback)
  const rolesToRemoveRef = useRef<Role[]>([]);

  // Remove mutation
  const removeRolesMutation = useRemoveRolesFromGroupMutation();

  // Remove modal with simple API
  const removeModal = useGroupRemoveModal({
    itemType: 'role',
    groupName: group?.name || '',
    onConfirm: async () => {
      if (!actualGroupId) return;

      const roleUuids = rolesToRemoveRef.current.map(({ uuid }) => uuid);
      await removeRolesMutation.mutateAsync({ groupId: actualGroupId, roleUuids });
      tableState.clearSelection();
      // No need to manually refetch - mutation invalidates cache automatically
    },
  });

  // Helper to open modal with roles
  const handleOpenRemoveModal = useCallback(
    (rolesToRemove: Role[]) => {
      rolesToRemoveRef.current = rolesToRemove;
      removeModal.openModal(rolesToRemove.map((r) => r.display_name || r.name));
    },
    [removeModal],
  );

  const removeModalState = removeModal.modalState;

  // =============================================================================
  // Toolbar Content
  // =============================================================================

  const toolbarActions = useMemo(() => {
    if (!hasPermissions || isAdminDefault) return undefined;

    return (
      <Button
        variant="primary"
        ouiaId={generateOuiaID(group?.name || '')}
        isDisabled={disableAddRoles}
        onClick={() => navigate(pathnames['group-add-roles'].link.replace(':groupId', groupId!))}
      >
        {intl.formatMessage(messages.addRole)}
      </Button>
    );
  }, [hasPermissions, isAdminDefault, group?.name, disableAddRoles, navigate, groupId, intl]);

  const bulkActions = useMemo(() => {
    if (!hasPermissions || isAdminDefault || tableState.selectedRows.length === 0) {
      return undefined;
    }

    return (
      <ActionDropdown
        ariaLabel="bulk actions"
        ouiaId="group-roles-bulk-actions"
        items={[
          {
            key: 'remove',
            label: intl.formatMessage(messages.remove),
            onClick: () => handleOpenRemoveModal(tableState.selectedRows),
          },
        ]}
      />
    );
  }, [hasPermissions, isAdminDefault, tableState.selectedRows, intl, handleOpenRemoveModal]);

  // =============================================================================
  // Render
  // =============================================================================

  if (!groupId) {
    return null;
  }

  return (
    <Fragment>
      <Section type="content" id="tab-roles">
        <TableView<typeof columns, Role>
          // Columns
          columns={columns}
          columnConfig={columnConfig}
          // Data - pass undefined when loading to show skeleton, otherwise pass roles
          data={isLoading ? undefined : roles}
          totalCount={totalCount}
          getRowId={(role) => role.uuid}
          // Renderers
          cellRenderers={cellRenderers}
          // Selection
          selectable={selectable}
          // Row actions
          renderActions={
            hasPermissions && !isAdminDefault
              ? (role) => (
                  <ActionDropdown
                    ariaLabel={`Actions for role ${role.display_name || role.name}`}
                    ouiaId={`group-roles-table-${role.uuid}-actions`}
                    items={[
                      {
                        key: 'remove',
                        label: intl.formatMessage(messages.remove),
                        onClick: () => handleOpenRemoveModal([role]),
                      },
                    ]}
                  />
                )
              : undefined
          }
          // Filtering
          filterConfig={filterConfig}
          // Toolbar
          toolbarActions={toolbarActions}
          bulkActions={bulkActions}
          // Empty states
          emptyStateNoData={
            <DefaultEmptyStateNoData
              title={intl.formatMessage(messages.noGroupRoles)}
              body={intl.formatMessage(isPlatformDefault ? messages.contactServiceTeamForRoles : messages.addRoleToThisGroup)}
            />
          }
          emptyStateNoResults={
            <DefaultEmptyStateNoResults title={intl.formatMessage(messages.noRolesFound)} body={intl.formatMessage(messages.noFilteredRoles)} />
          }
          // Config
          variant="default"
          ouiaId="group-roles-table"
          ariaLabel={intl.formatMessage(messages.roles)}
          // State from hook
          {...tableState}
        />
      </Section>

      <RemoveGroupRoles
        title={removeModalState.title}
        text={removeModalState.text}
        isOpen={removeModalState.isOpen}
        confirmButtonLabel={removeModalState.confirmButtonLabel}
        onClose={removeModalState.onClose}
        onSubmit={removeModalState.onConfirm}
        isDefault={isPlatformDefault}
        isChanged={isChanged}
      />

      {!isAdminDefault && (
        <Suspense fallback={<div>Loading...</div>}>
          <Outlet
            context={{
              [pathnames['group-add-roles'].path]: {
                isDefault: isPlatformDefault || isAdminDefault,
                onDefaultGroupChanged: props.onDefaultGroupChanged,
                fetchUuid: systemGroupUuid,
                groupName: group?.name,
                closeUrl: pathnames['group-detail-roles'].link.replace(':groupId', groupId),
                // Mutations invalidate cache automatically, no postMethod/afterSubmit needed
              },
              [pathnames['group-roles-edit-group'].path]: {
                group,
                cancelRoute: pathnames['group-detail-roles'].link.replace(':groupId', groupId),
                submitRoute: pathnames['group-detail-roles'].link.replace(':groupId', groupId),
                // Mutations invalidate cache automatically
              },
              [pathnames['group-roles-remove-group'].path]: {
                cancelRoute: pathnames['group-detail-roles'].link.replace(':groupId', groupId),
                submitRoute: getBackRoute(pathnames.groups.link, { limit: tableState.apiParams.limit, offset: 0 }, {}),
                // Mutations invalidate cache automatically
              },
            }}
          />
        </Suspense>
      )}
    </Fragment>
  );
};

export default GroupRoles;
