/**
 * GroupRoles Page
 *
 * Displays and manages roles assigned to a group using the TableView component.
 * All table state (pagination, sorting, filtering, selection) is managed by useTableState.
 */

import React, { Fragment, Suspense, useCallback, useContext, useEffect, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { Outlet, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import Section from '@redhat-cloud-services/frontend-components/Section';

import { DefaultEmptyStateNoData, DefaultEmptyStateNoResults, TableView, useTableState } from '../../../../components/table-view';
import { ActionDropdown } from '../../../../components/ActionDropdown';
import { RemoveGroupRoles } from './RemoveGroupRoles';

import { columns, useGroupRolesTableConfig } from './useGroupRolesTableConfig';

import { fetchAddRolesForGroup, fetchRolesForGroup, removeRolesFromGroup } from '../../../../redux/groups/actions';
import {
  selectGroupRoles,
  selectGroupRolesMeta,
  selectIsAdminDefaultGroup,
  selectIsChangedDefaultGroup,
  selectIsGroupRolesLoading,
  selectIsPlatformDefaultGroup,
  selectSelectedGroup,
  selectShouldDisableAddRoles,
  selectSystemGroupUUID,
} from '../../../../redux/groups/selectors';

import { getBackRoute } from '../../../../helpers/navigation';
import PermissionsContext from '../../../../utilities/permissionsContext';
import { DEFAULT_ACCESS_GROUP_ID } from '../../../../utilities/constants';
import useAppNavigate from '../../../../hooks/useAppNavigate';
import { useConfirmItemsModal } from '../../../../hooks/useConfirmItemsModal';
import messages from '../../../../Messages';
import pathnames from '../../../../utilities/pathnames';
import type { GroupRolesProps, Role } from './types';

import './group-roles.scss';

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
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const { groupId } = useParams<{ groupId: string }>();

  // Permissions
  const { userAccessAdministrator, orgAdmin } = useContext(PermissionsContext);
  const hasPermissions = orgAdmin || userAccessAdministrator;

  // Redux state
  const roles = useSelector(selectGroupRoles);
  const pagination = useSelector(selectGroupRolesMeta);
  const isReduxLoading = useSelector(selectIsGroupRolesLoading);
  const isPlatformDefault = useSelector(selectIsPlatformDefaultGroup);
  const isAdminDefault = useSelector(selectIsAdminDefaultGroup);
  const isChanged = useSelector(selectIsChangedDefaultGroup);
  const disableAddRoles = useSelector(selectShouldDisableAddRoles);
  const systemGroupUuid = useSelector(selectSystemGroupUUID);
  const group = useSelector(selectSelectedGroup);

  // Resolve actual group ID (handle default access group)
  const actualGroupId = useMemo(() => (groupId !== DEFAULT_ACCESS_GROUP_ID ? groupId! : systemGroupUuid), [groupId, systemGroupUuid]);

  // Table configuration
  const { columnConfig, cellRenderers, filterConfig } = useGroupRolesTableConfig({
    intl,
    groupId: groupId!,
  });

  // Data fetching function
  const fetchData = useCallback(
    (params: { offset: number; limit: number; orderBy?: string; filters: Record<string, string | string[]> }) => {
      if (!actualGroupId) return;

      const nameFilter = typeof params.filters.name === 'string' ? params.filters.name : '';

      dispatch(
        fetchRolesForGroup(actualGroupId, {
          limit: params.limit,
          offset: params.offset,
          name: nameFilter || undefined,
        }) as any,
      );
    },
    [dispatch, actualGroupId],
  );

  // Table state hook (no sorting - API doesn't support it)
  const tableState = useTableState<typeof columns, Role>({
    columns,
    initialPerPage: 20,
    getRowId: (role) => role.uuid,
    syncWithUrl: false, // Don't sync with URL for sub-tab
    onStaleData: fetchData,
  });

  // Total count from Redux pagination
  const totalCount = pagination?.count ?? 0;

  // Enable selection for non-admin-default groups with permissions
  const selectable = hasPermissions && !isAdminDefault;

  // Remove modal using shared hook
  const { openModal: handleOpenRemoveModal, modalState: removeModalState } = useConfirmItemsModal<Role>({
    onConfirm: async (roles) => {
      // Guard against missing actualGroupId (could happen in transient state)
      if (!actualGroupId) return;

      const roleIds = roles.map(({ uuid }) => uuid);
      await dispatch(removeRolesFromGroup(actualGroupId, roleIds) as any);

      tableState.clearSelection();

      // Refresh data
      fetchData({
        offset: tableState.apiParams.offset,
        limit: tableState.apiParams.limit,
        orderBy: tableState.apiParams.orderBy,
        filters: tableState.filters,
      });

      // Refresh available roles
      dispatch(fetchAddRolesForGroup(actualGroupId, { limit: 20, offset: 0 }) as any);
    },
    singularTitle: messages.removeRoleQuestion,
    pluralTitle: messages.removeRolesQuestion,
    singularBody: messages.removeRoleModalText,
    pluralBody: messages.removeRolesModalText,
    singularConfirmLabel: messages.removeRole,
    pluralConfirmLabel: messages.removeRoles,
    getItemLabel: (role) => role.display_name || role.name,
    extraValues: { name: group?.name || '' },
    itemValueKey: 'role',
    countValueKey: 'roles',
  });

  // =============================================================================
  // Effects
  // =============================================================================

  // Fetch available roles for "Add Roles" button
  useEffect(() => {
    if (actualGroupId) {
      dispatch(fetchAddRolesForGroup(actualGroupId, { limit: 20, offset: 0 }) as any);
    }
  }, [dispatch, actualGroupId]);

  // Handle default group changes
  useEffect(() => {
    if (isChanged && props.onDefaultGroupChanged && group) {
      props.onDefaultGroupChanged({ uuid: group.uuid, name: group.name });
    }
  }, [isChanged, group, props.onDefaultGroupChanged]);

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
          data={isReduxLoading ? undefined : roles}
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
                isChanged: isChanged,
                onDefaultGroupChanged: props.onDefaultGroupChanged,
                fetchUuid: systemGroupUuid,
                groupName: group?.name,
                closeUrl: pathnames['group-detail-roles'].link.replace(':groupId', groupId),
                afterSubmit: () => {
                  if (actualGroupId) {
                    dispatch(fetchAddRolesForGroup(actualGroupId, { limit: 20, offset: 0 }) as any);
                  }
                  fetchData({
                    offset: tableState.apiParams.offset,
                    limit: tableState.apiParams.limit,
                    orderBy: tableState.apiParams.orderBy,
                    filters: tableState.filters,
                  });
                },
                postMethod: (promise: Promise<unknown>) => {
                  navigate(pathnames['group-detail-roles'].link.replace(':groupId', groupId));
                  if (promise) {
                    promise.then(() => {
                      if (actualGroupId) {
                        dispatch(fetchAddRolesForGroup(actualGroupId, { limit: 20, offset: 0 }) as any);
                      }
                      fetchData({
                        offset: tableState.apiParams.offset,
                        limit: tableState.apiParams.limit,
                        orderBy: tableState.apiParams.orderBy,
                        filters: tableState.filters,
                      });
                    });
                  }
                },
              },
              [pathnames['group-roles-edit-group'].path]: {
                group,
                cancelRoute: pathnames['group-detail-roles'].link.replace(':groupId', groupId),
                submitRoute: pathnames['group-detail-roles'].link.replace(':groupId', groupId),
              },
              [pathnames['group-roles-remove-group'].path]: {
                postMethod: (promise: Promise<unknown>) => {
                  const backRoute = getBackRoute(
                    pathnames['group-detail-roles'].link.replace(':groupId', groupId),
                    { limit: tableState.apiParams.limit, offset: tableState.apiParams.offset },
                    {},
                  );
                  navigate(backRoute);
                  if (promise) {
                    promise.then(() => {
                      if (actualGroupId) {
                        dispatch(fetchAddRolesForGroup(actualGroupId, { limit: 20, offset: 0 }) as any);
                      }
                      fetchData({
                        offset: tableState.apiParams.offset,
                        limit: tableState.apiParams.limit,
                        orderBy: tableState.apiParams.orderBy,
                        filters: tableState.filters,
                      });
                    });
                  }
                },
                cancelRoute: pathnames['group-detail-roles'].link.replace(':groupId', groupId),
                submitRoute: getBackRoute(pathnames.groups.link, { limit: tableState.apiParams.limit, offset: 0 }, {}),
              },
            }}
          />
        </Suspense>
      )}
    </Fragment>
  );
};

export default GroupRoles;
