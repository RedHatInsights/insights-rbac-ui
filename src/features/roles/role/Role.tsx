import React, { Fragment, Suspense, useCallback, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { Outlet, useNavigationType, useParams, useNavigate as useRouterNavigate } from 'react-router-dom';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import { useQueryClient } from '@tanstack/react-query';
import { fetchGroup, fetchRolesForGroup, fetchSystemGroup } from '../../../redux/groups/actions';
import { DEFAULT_ACCESS_GROUP_ID } from '../../../utilities/constants';
import { BAD_UUID } from '../../../helpers/dataUtilities';
import { getBackRoute } from '../../../helpers/navigation';
import useAppNavigate from '../../../hooks/useAppNavigate';
import { PaginationDefaultI, defaultSettings } from '../../../helpers/pagination';
import useUserData from '../../../hooks/useUserData';
import { useAppLink } from '../../../hooks/useAppLink';
import { rolesKeys, useRoleQuery } from '../../../data/queries/roles';
import pathnames from '../../../utilities/pathnames';
import messages from '../../../Messages';
import { Group } from '../../../redux/groups/reducer';
import { RoleDetail } from './components/RoleDetail';
import { RolePermissions } from './components/RolePermissions';
import { useRolePermissions } from './useRolePermissions';

interface RoleProps {
  onDelete?: () => void;
}

interface GroupState {
  groupReducer: {
    selectedGroup?: Group;
    systemGroup?: { uuid: string };
    error?: string;
    groups?: {
      pagination?: PaginationDefaultI;
      filters?: Record<string, string>;
    };
  };
}

const Role: React.FC<RoleProps> = ({ onDelete }) => {
  const intl = useIntl();
  const chrome = useChrome();
  const navigate = useAppNavigate();
  const routerNavigate = useRouterNavigate(); // For delta navigation (back)
  const navigationType = useNavigationType();
  const queryClient = useQueryClient();
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isNonPermissionAddingRole, setIsNonPermissionAddingRole] = useState(false);
  const [permissionFilters, setPermissionFilters] = useState<{ applications: string[]; resources: string[]; operations: string[] }>({
    applications: [],
    resources: [],
    operations: [],
  });
  const { roleId, groupId } = useParams<{ roleId: string; groupId?: string }>();
  const { orgAdmin, userAccessAdministrator } = useUserData();

  // Use TanStack Query for role data
  const { data: role, isLoading: isRoleLoading, isError: isRoleError } = useRoleQuery(roleId ?? '');
  const roleExists = !isRoleError;

  // Keep Redux for group-related state (will be migrated in Groups slice)
  const { group, groupsPagination, groupsFilters, systemGroupUuid } = useSelector(
    (state: GroupState) => ({
      ...(groupId && { group: state.groupReducer.selectedGroup }),
      systemGroupUuid: state.groupReducer.systemGroup?.uuid,
      groupsPagination: state.groupReducer?.groups?.pagination || defaultSettings,
      groupsFilters: state.groupReducer?.groups?.filters || {},
    }),
    shallowEqual,
  );

  const groupExists = useSelector((state: GroupState) => {
    const {
      groupReducer: { error },
    } = state;
    return error !== BAD_UUID;
  });

  // For breadcrumbs - use default pagination since we don't track roles pagination in Redux anymore
  const rolesPagination = defaultSettings;
  const rolesFilters: Record<string, string> = {};
  const isLoading = isRoleLoading;

  // Use the permissions hook for business logic
  const {
    isRecordLoading,
    filteredPermissions,
    applications,
    resources,
    operations,
    showResourceDefinitions,
    onRemovePermissions,
    onNavigateToAddPermissions,
  } = useRolePermissions(permissionFilters);

  const dispatch = useDispatch();
  const toAppLink = useAppLink();

  // Refetch role data (for use after edits)
  const refetchRole = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: rolesKeys.detail(roleId ?? '') });
  }, [queryClient, roleId]);

  // Fetch group data (still using Redux)
  const fetchGroupData = useCallback(() => {
    if (groupId) {
      if (groupId !== DEFAULT_ACCESS_GROUP_ID) {
        dispatch(fetchGroup(groupId as string) as unknown as { type: string });
      } else {
        if (systemGroupUuid) {
          dispatch(fetchRolesForGroup(systemGroupUuid, {}) as unknown as { type: string });
          chrome.appObjectId(systemGroupUuid as string);
        } else {
          dispatch(fetchSystemGroup({ chrome }) as unknown as { type: string });
        }
      }
    }
  }, [groupId, systemGroupUuid, dispatch, chrome]);

  useEffect(() => {
    fetchGroupData();
    if (roleId) {
      chrome.appObjectId(roleId);
    }
    return () => (chrome.appObjectId as (id: string | undefined) => void)(undefined);
  }, [fetchGroupData, roleId, chrome]);

  useEffect(() => {
    // Disable for system roles
    const isSystemRole = role?.system;

    // Disable for preconfigured roles when user is Org Admin or User Access Admin
    const isPreconfiguredRoleForAdmin = (orgAdmin || userAccessAdministrator) && (role?.platform_default || role?.admin_default);

    if (isSystemRole || isPreconfiguredRoleForAdmin) {
      setIsNonPermissionAddingRole(true);
    } else {
      setIsNonPermissionAddingRole(false);
    }
  }, [role, orgAdmin, userAccessAdministrator]);

  const breadcrumbsList = (): any[] => [
    groupId
      ? {
          title: intl.formatMessage(messages.groups),
          to: getBackRoute(toAppLink(pathnames.groups.link) as string, groupsPagination as { limit: number; offset: number }, groupsFilters),
        }
      : {
          title: intl.formatMessage(messages.roles),
          to: getBackRoute(toAppLink(pathnames.roles.link) as string, rolesPagination as { limit: number; offset: number }, rolesFilters),
        },

    ...(groupExists && groupId && (groupId === DEFAULT_ACCESS_GROUP_ID ? systemGroupUuid : groupExists)
      ? group
        ? [
            {
              title: group && group.name,
              to: toAppLink(pathnames['group-detail-roles'].link.replace(':groupId', groupId)),
              isLoading: false,
            },
          ]
        : []
      : groupExists || !groupId
        ? []
        : [{ title: intl.formatMessage(messages.invalidGroup), isActive: true }]),

    ...(groupExists || !groupId
      ? [
          {
            title: isLoading ? undefined : roleExists ? role?.display_name || role?.name : intl.formatMessage(messages.invalidRole),
            isActive: true,
          },
        ]
      : []),
  ];

  const title = !isLoading && role ? role.display_name || role.name : undefined;
  const description = !isLoading && role ? role.description : undefined;
  const isSystemRole = role?.system || false;

  const handleBackClick = () => {
    if (navigationType !== 'POP') {
      routerNavigate(-1); // Use native navigate for delta navigation
    } else {
      navigate(pathnames.roles.link);
    }
  };

  const handleDropdownToggle = (isOpen: boolean) => {
    setDropdownOpen(isOpen);
  };

  const outletContext = {
    [pathnames['role-detail-remove'].path]: {
      afterSubmit: () => {
        // Invalidate roles list cache after deletion
        queryClient.invalidateQueries({ queryKey: rolesKeys.all });
      },
      cancelRoute: pathnames['role-detail'].link.replace(':roleId', roleId || ''),
      submitRoute: getBackRoute(
        pathnames['roles'].link,
        { ...rolesPagination, offset: 0, limit: rolesPagination.limit || defaultSettings.limit },
        rolesFilters,
      ),
      isLoading,
    },
    [pathnames['role-detail-edit'].path]: {
      afterSubmit: refetchRole,
      cancelRoute: pathnames['role-detail'].link.replace(':roleId', roleId || ''),
      isLoading,
    },
    [pathnames['role-add-permission'].path]: {
      isOpen: true,
      role,
    },
  };

  return (
    <Fragment>
      <RoleDetail
        title={title}
        description={description}
        isLoading={isLoading}
        isSystemRole={isSystemRole}
        roleExists={roleExists}
        groupExists={groupExists}
        isDropdownOpen={isDropdownOpen}
        onDropdownToggle={handleDropdownToggle}
        breadcrumbs={breadcrumbsList()}
        editLink={pathnames['role-detail-edit'].link.replace(':roleId', roleId || '')}
        deleteLink={pathnames['role-detail-remove'].link.replace(':roleId', roleId || '')}
        onDelete={onDelete}
        onBackClick={handleBackClick}
        hasPermission={orgAdmin || userAccessAdministrator}
        errorType={groupExists ? 'role' : 'group'}
      >
        <RolePermissions
          cantAddPermissions={isNonPermissionAddingRole}
          isLoading={isLoading || !role}
          isRecordLoading={isRecordLoading}
          roleUuid={role?.uuid}
          roleName={role?.name || role?.display_name}
          isSystemRole={role?.system || false}
          filteredPermissions={filteredPermissions}
          applications={applications}
          resources={resources}
          operations={operations}
          showResourceDefinitions={showResourceDefinitions}
          onRemovePermissions={onRemovePermissions}
          onNavigateToAddPermissions={onNavigateToAddPermissions}
          onFiltersChange={setPermissionFilters}
          currentFilters={permissionFilters}
        />
      </RoleDetail>
      <Suspense>
        <Outlet context={outletContext} />
      </Suspense>
    </Fragment>
  );
};

export default Role;
