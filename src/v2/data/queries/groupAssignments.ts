/**
 * Workspace & Org Group Hooks
 *
 * UI-model types and hooks for workspace/org group tables.
 * Wraps raw role-binding queries and returns data already transformed
 * into the shape the components need — no V1 `Group` type involved.
 */

import { useMemo } from 'react';
import type { RoleBindingsGroupSubject, RoleBindingsRoleBindingBySubject } from '../api/workspaces';
import { useRoleAssignmentsQuery } from './roles';
import { useRoleBindingsQuery } from './workspaces';

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
  userCount: number;
  /** True for platform-default or admin-default groups (all org users) */
  isDefaultGroup: boolean;
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

/** Well-known default group names used as fallback detection */
const DEFAULT_GROUP_NAMES = new Set(['default access', 'default admin access']);

function isDefaultGroupSubject(subject?: WorkspaceGroupBinding['subject']): boolean {
  const group = subject?.group as Record<string, unknown> | undefined;
  if (group?.platform_default || group?.admin_default) return true;
  const name = (group?.name as string) ?? '';
  return DEFAULT_GROUP_NAMES.has(name.toLowerCase());
}

function toWorkspaceGroupRow(binding: WorkspaceGroupBinding): WorkspaceGroupRow {
  const { subject } = binding;
  const roles: WorkspaceGroupRole[] = (binding.roles ?? []).map((r) => ({ id: r.id ?? '', name: r.name ?? '' }));
  return {
    id: subject?.id ?? subject?.group?.name ?? '',
    name: subject?.group?.name ?? '',
    description: subject?.group?.description ?? '',
    userCount: subject?.group?.user_count ?? 0,
    isDefaultGroup: isDefaultGroupSubject(subject),
    roleCount: roles.length,
    roles,
    lastModified: binding.last_modified ?? '',
  };
}

function transformBindings(data: WorkspaceGroupBinding[]): WorkspaceGroupRow[] {
  return data.map(toWorkspaceGroupRow).filter((row) => row.roleCount > 0);
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
  const query = useRoleAssignmentsQuery(workspaceId, {
    enabled: options?.enabled ?? true,
    limit: ROLE_BINDINGS_LIMIT,
    excludeSources: 'indirect',
  });

  const data = useMemo(() => (query.data?.data ? transformBindings(query.data.data as WorkspaceGroupBinding[]) : []), [query.data]);

  return { data, isLoading: query.isLoading };
}

/**
 * Groups with roles inherited from parent workspaces.
 * Uses `excludeSources: 'direct'` so the API returns only inherited bindings.
 * Each row's `inheritedFrom` is derived from the `sources` array on the binding.
 */
export function useWorkspaceInheritedGroups(workspaceId: string, options?: { enabled?: boolean }) {
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
        const row = toWorkspaceGroupRow(binding);
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
  }, [query.data]);

  return { data, isLoading: query.isLoading };
}

/**
 * Groups with roles at the organization (tenant) level.
 * Used by OrganizationManagement.
 */
export function useOrgGroups(organizationId: string, options?: { enabled?: boolean }) {
  const query = useRoleBindingsQuery(
    {
      resourceId: `redhat/${organizationId}`,
      resourceType: 'tenant',
      fields: 'subject(id,group.name,group.user_count,group.description,group.platform_default,group.admin_default),roles(id,name),last_modified',
      limit: ROLE_BINDINGS_LIMIT,
    },
    { enabled: options?.enabled ?? true },
  );

  const data = useMemo(() => (query.data?.data ? transformBindings(query.data.data as WorkspaceGroupBinding[]) : []), [query.data]);

  return { data, isLoading: query.isLoading };
}
