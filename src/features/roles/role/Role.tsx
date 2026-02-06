import React, { Fragment, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { Outlet, useNavigationType, useParams, useNavigate as useRouterNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { usePlatformTracking } from '../../../hooks/usePlatformTracking';
import { useAccessPermissions } from '../../../hooks/useAccessPermissions';
import { useGroupQuery, useSystemGroupQuery } from '../../../data/queries/groups';
import { DEFAULT_ACCESS_GROUP_ID } from '../../../utilities/constants';
import { getBackRoute } from '../../../helpers/navigation';
import useAppNavigate from '../../../hooks/useAppNavigate';
import { defaultSettings } from '../../../helpers/pagination';
import useUserData from '../../../hooks/useUserData';
import { useAppLink } from '../../../hooks/useAppLink';
import { rolesKeys, useRoleQuery } from '../../../data/queries/roles';
import pathnames from '../../../utilities/pathnames';
import messages from '../../../Messages';
import { RoleDetail } from './components/RoleDetail';
import { RolePermissions } from './components/RolePermissions';
import { useRolePermissions } from './useRolePermissions';

interface RoleProps {
  onDelete?: () => void;
}

const Role: React.FC<RoleProps> = ({ onDelete }) => {
  const intl = useIntl();
  const { trackObjectView } = usePlatformTracking();
  const navigate = useAppNavigate();
  const routerNavigate = useRouterNavigate(); // For delta navigation (back)
  const navigationType = useNavigationType();
  const queryClient = useQueryClient();
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [permissionFilters, setPermissionFilters] = useState<{ applications: string[]; resources: string[]; operations: string[] }>({
    applications: [],
    resources: [],
    operations: [],
  });
  const { roleId, groupId } = useParams<{ roleId: string; groupId?: string }>();
  const { orgAdmin, userAccessAdministrator } = useUserData();

  // Check granular permissions for read and write access
  const { hasAccess: canWriteRoles } = useAccessPermissions(['rbac:role:write']);

  // Use TanStack Query for role data
  const { data: role, isLoading: isRoleLoading, isError: isRoleError } = useRoleQuery(roleId ?? '');
  const roleExists = !isRoleError;

  // Use React Query for system group data (only needed when viewing role from default group)
  const needsSystemGroup = groupId === DEFAULT_ACCESS_GROUP_ID;
  const { data: systemGroup } = useSystemGroupQuery({ enabled: needsSystemGroup });
  const systemGroupUuid = systemGroup?.uuid;

  // Determine actual group ID (handle DEFAULT_ACCESS_GROUP_ID)
  const actualGroupId = needsSystemGroup ? systemGroupUuid : groupId;

  // Fetch group details via React Query
  const { data: group, isError: isGroupError } = useGroupQuery(actualGroupId ?? '', {
    enabled: !!actualGroupId,
  });

  const groupExists = !isGroupError;

  // Use default pagination for breadcrumbs
  const groupsPagination = defaultSettings;
  const groupsFilters: Record<string, string> = {};
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

  const toAppLink = useAppLink();

  // Refetch role data (for use after edits)
  const refetchRole = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: rolesKeys.detail(roleId ?? '') });
  }, [queryClient, roleId]);

  // Set chrome app object ID for analytics
  useEffect(() => {
    if (roleId) {
      trackObjectView(roleId);
    } else if (actualGroupId) {
      trackObjectView(actualGroupId);
    }
    return () => trackObjectView('');
  }, [roleId, actualGroupId, trackObjectView]);

  // Derived: Determine if role cannot have permissions added
  // System roles and preconfigured roles (for admins) are non-editable
  const isNonPermissionAddingRole = useMemo(() => {
    const isSystemRole = role?.system;
    const isPreconfiguredRoleForAdmin = (orgAdmin || userAccessAdministrator) && (role?.platform_default || role?.admin_default);
    return Boolean(isSystemRole || isPreconfiguredRoleForAdmin);
  }, [role?.system, role?.platform_default, role?.admin_default, orgAdmin, userAccessAdministrator]);

  interface Breadcrumb {
    title: string | undefined;
    to?: string;
    isLoading?: boolean;
    isActive?: boolean;
  }

  // Helper to convert getBackRoute result to string
  const routeToString = (route: { pathname: string; search: string }) => `${route.pathname}${route.search}`;

  const breadcrumbsList = (): Breadcrumb[] => [
    groupId
      ? {
          title: intl.formatMessage(messages.groups),
          to: routeToString(
            getBackRoute(toAppLink(pathnames.groups.link()) as string, groupsPagination as { limit: number; offset: number }, groupsFilters),
          ),
        }
      : {
          title: intl.formatMessage(messages.roles),
          to: routeToString(
            getBackRoute(toAppLink(pathnames.roles.link()) as string, rolesPagination as { limit: number; offset: number }, rolesFilters),
          ),
        },

    ...(groupExists && groupId && (groupId === DEFAULT_ACCESS_GROUP_ID ? systemGroupUuid : groupExists)
      ? group
        ? [
            {
              title: group && group.name,
              to: toAppLink(pathnames['group-detail-roles'].link(groupId)) as string,
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
      navigate(pathnames.roles.link());
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
      cancelRoute: pathnames['role-detail'].link(roleId || ''),
      submitRoute: getBackRoute(
        pathnames['roles'].link(),
        { ...rolesPagination, offset: 0, limit: rolesPagination.limit || defaultSettings.limit },
        rolesFilters,
      ),
      isLoading,
    },
    [pathnames['role-detail-edit'].path]: {
      afterSubmit: refetchRole,
      cancelRoute: pathnames['role-detail'].link(roleId || ''),
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
        editLink={pathnames['role-detail-edit'].link(roleId || '')}
        deleteLink={pathnames['role-detail-remove'].link(roleId || '')}
        onDelete={onDelete}
        onBackClick={handleBackClick}
        hasPermission={orgAdmin || userAccessAdministrator}
        canEdit={canWriteRoles}
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
