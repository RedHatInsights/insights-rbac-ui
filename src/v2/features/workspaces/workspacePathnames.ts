/* eslint-disable rbac-local/no-cross-version-imports, no-restricted-imports --
   Workspace feature is V2-native, backported to V1. Cross-domain
   paths are injected from each version's authoritative pathnames
   to avoid duplication. */
import type { PathnameConfig } from '../../../shared/utilities/pathnames';
import { useWorkspacesFlag } from '../../../shared/hooks/useWorkspacesFlag';
import { groups as v1Groups, roles as v1Roles } from '../../../v1/utilities/pathnames';
import { roleDetail as v2RoleDetail, accessManagementRoles as v2Roles, usersAndUserGroups as v2UsersAndGroups } from '../../utilities/pathnames';

interface CrossDomainPathnames {
  roles: PathnameConfig;
  roleDetail?: PathnameConfig<(roleId: string) => string>;
  usersAndUserGroups: PathnameConfig;
}

function createWorkspacePathnames(prefix: string, crossDomain: CrossDomainPathnames) {
  const workspaces: PathnameConfig = {
    link: () => `/${prefix}/workspaces`,
    path: `/${prefix}/workspaces/*`,
    title: 'Workspaces',
  };
  return {
    workspaces,
    'access-management-workspaces': workspaces,
    'workspace-detail': {
      link: (workspaceId: string) => `/${prefix}/workspaces/detail/${workspaceId}`,
      path: `/${prefix}/workspaces/detail/:workspaceId/*`,
      title: 'Workspace detail',
    },
    'create-workspace': {
      link: () => `/${prefix}/workspaces/create-workspace`,
      path: 'create-workspace',
      title: 'Create workspace',
    },
    'edit-workspace': {
      link: (workspaceId: string) => `/${prefix}/workspaces/detail/${workspaceId}/edit`,
      path: 'edit',
      title: 'Edit Workspace',
    },
    'edit-workspaces-list': {
      link: (workspaceId: string) => `/${prefix}/workspaces/edit/${workspaceId}`,
      path: 'edit/:workspaceId',
      title: 'Edit Workspace',
    },
    'workspace-role-access': {
      link: (workspaceId: string, groupId: string) => `/${prefix}/workspaces/detail/${workspaceId}/role-access/${groupId}`,
      path: 'role-access/:groupId',
      title: 'Edit access',
    },
    'access-management-roles': crossDomain.roles,
    'role-detail': crossDomain.roleDetail,
    'users-and-user-groups': crossDomain.usersAndUserGroups,
  };
}

export const v1WorkspacePathnames = createWorkspacePathnames('user-access', {
  roles: v1Roles,
  usersAndUserGroups: v1Groups,
});

export const v2WorkspacePathnames = createWorkspacePathnames('access-management', {
  roles: v2Roles,
  roleDetail: v2RoleDetail,
  usersAndUserGroups: v2UsersAndGroups,
});

export type WorkspacePathnames = ReturnType<typeof createWorkspacePathnames>;

export const useWorkspacePathnames = (): WorkspacePathnames => {
  const isV2 = useWorkspacesFlag('m5');
  return isV2 ? v2WorkspacePathnames : v1WorkspacePathnames;
};
