/**
 * Workspace & Org Group Hooks
 *
 * UI-model types and hooks for workspace/org group tables.
 * Wraps raw role-binding queries and returns data already transformed
 * into the shape the components need — no V1 `Group` type involved.
 */

import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import type { RoleBindingsGroupSubject, RoleBindingsRoleBindingBySubject } from '../api/workspaces';
import messages from '../../../Messages';
import { useQuery } from '@tanstack/react-query';
import { createWorkspacesApi } from '../api/workspaces';
import { useAppServices } from '../../../shared/contexts/ServiceContext';
import { useRoleAssignmentsQuery } from './roles';
import { roleBindingsKeys } from './workspaces';

// =============================================================================
// Raw API narrowing (rbac-client → typed binding)
// =============================================================================

/** Role binding whose subject carries group details (from `fields=subject(group.*)`) */
export type WorkspaceGroupBinding = Omit<RoleBindingsRoleBindingBySubject, 'subject'> & {
  subject?: RoleBindingsGroupSubject;
};

// =============================================================================
// UI Model Types (what components see)
// =============================================================================

export interface WorkspaceGroupRole {
  id: string;
  name: string;
}

export interface WorkspaceGroupRow {
  id: string;
  name: string;
  description: string;
  userCount: number | string;
  /** True for well-known default groups (all org users belong implicitly) */
  isDefaultGroup: boolean;
  /** True specifically for the admin default group (org admins only) */
  isAdminDefault: boolean;
  roleCount: number;
  roles: WorkspaceGroupRole[];
  lastModified: string;
}

export interface InheritedWorkspaceGroupRow extends WorkspaceGroupRow {
  inheritedFrom?: {
    workspaceId: string;
    workspaceName: string;
  };
}

// =============================================================================
// Private transformer (rbac-client type IN → UI model OUT)
// =============================================================================

/** V2 API does not expose platform_default/admin_default — detect by well-known names only */
const DEFAULT_GROUP_NAMES = new Set(['default access', 'default admin access']);
const ADMIN_DEFAULT_NAME = 'default admin access';

function isDefaultGroupName(name: string): boolean {
  return DEFAULT_GROUP_NAMES.has(name.toLowerCase());
}

function isAdminDefaultGroupName(name: string): boolean {
  return name.toLowerCase() === ADMIN_DEFAULT_NAME;
}

function toWorkspaceGroupRow(binding: WorkspaceGroupBinding, labels: { allUsers: string; allOrgAdmins: string }): WorkspaceGroupRow {
  const { subject } = binding;
  const name = subject?.group?.name ?? '';
  const isDefault = isDefaultGroupName(name);
  const isAdmin = isAdminDefaultGroupName(name);
  const roles: WorkspaceGroupRole[] = (binding.roles ?? []).map((r) => ({ id: r.id ?? '', name: r.name ?? '' }));
  return {
    id: subject?.id ?? name,
    name,
    description: subject?.group?.description ?? '',
    userCount: isDefault ? (isAdmin ? labels.allOrgAdmins : labels.allUsers) : (subject?.group?.user_count ?? 0),
    isDefaultGroup: isDefault,
    isAdminDefault: isAdmin,
    roleCount: roles.length,
    roles,
    lastModified: binding.last_modified ?? '',
  };
}

function transformBindings(data: WorkspaceGroupBinding[], labels: { allUsers: string; allOrgAdmins: string }): WorkspaceGroupRow[] {
  return data.map((b) => toWorkspaceGroupRow(b, labels)).filter((row) => row.roleCount > 0);
}

// =============================================================================
// Public Hooks
// =============================================================================

const ROLE_BINDINGS_LIMIT = 1000;

/**
 * Groups with roles directly assigned in a workspace.
 * Groups with zero roles are excluded.
 */
export function useWorkspaceGroups(workspaceId: string, options?: { enabled?: boolean }) {
  const intl = useIntl();
  const labels = { allUsers: intl.formatMessage(messages.allUsers), allOrgAdmins: intl.formatMessage(messages.allOrgAdmins) };

  const query = useRoleAssignmentsQuery(workspaceId, {
    enabled: options?.enabled ?? true,
    limit: ROLE_BINDINGS_LIMIT,
    excludeSources: 'indirect',
  });

  const data = useMemo(
    () => (query.data?.data ? transformBindings(query.data.data as WorkspaceGroupBinding[], labels) : []),
    [query.data, labels.allUsers, labels.allOrgAdmins],
  );

  return { data, isLoading: query.isLoading };
}

/**
 * Groups with roles inherited from parent workspaces.
 * Uses `excludeSources: 'direct'` so the API returns only inherited bindings.
 * Each row's `inheritedFrom` is derived from the `sources` array on the binding.
 */
export function useWorkspaceInheritedGroups(workspaceId: string, options?: { enabled?: boolean }) {
  const intl = useIntl();
  const labels = { allUsers: intl.formatMessage(messages.allUsers), allOrgAdmins: intl.formatMessage(messages.allOrgAdmins) };

  const query = useRoleAssignmentsQuery(workspaceId, {
    enabled: options?.enabled ?? true,
    limit: ROLE_BINDINGS_LIMIT,
    excludeSources: 'direct',
  });

  const data: InheritedWorkspaceGroupRow[] = useMemo(() => {
    if (!query.data?.data) return [];
    const bindings = query.data.data as WorkspaceGroupBinding[];
    const seen = new Set<string>();
    return bindings
      .map((binding): InheritedWorkspaceGroupRow => {
        const row = toWorkspaceGroupRow(binding, labels);
        const source = binding.sources?.[0];
        return {
          ...row,
          inheritedFrom: source?.id ? { workspaceId: source.id, workspaceName: source.name ?? '' } : undefined,
        };
      })
      .filter((row) => {
        if (row.roleCount <= 0) return false;
        if (seen.has(row.id)) return false;
        seen.add(row.id);
        return true;
      });
  }, [query.data, labels.allUsers, labels.allOrgAdmins]);

  return { data, isLoading: query.isLoading };
}

/**
 * Groups with roles at the organization (tenant) level.
 * Used by OrganizationManagement.
 */
export function useOrgGroups(organizationId: string, options?: { enabled?: boolean }) {
  const intl = useIntl();
  const { axios } = useAppServices();
  const api = createWorkspacesApi(axios);
  const labels = { allUsers: intl.formatMessage(messages.allUsers), allOrgAdmins: intl.formatMessage(messages.allOrgAdmins) };

  const query = useQuery({
    queryKey: roleBindingsKeys.orgGroups(organizationId),
    queryFn: async () => {
      const response = await api.roleBindingsListBySubject({
        resourceId: `redhat/${organizationId}`,
        resourceType: 'tenant',
        fields: 'subject(id,group.name,group.user_count,group.description),roles(id,name),last_modified',
        limit: ROLE_BINDINGS_LIMIT,
      });
      return response.data;
    },
    enabled: (options?.enabled ?? true) && !!organizationId,
  });

  const data = useMemo(
    () => (query.data?.data ? transformBindings(query.data.data as WorkspaceGroupBinding[], labels) : []),
    [query.data, labels.allUsers, labels.allOrgAdmins],
  );

  return { data, isLoading: query.isLoading };
}
