/**
 * Group Assignment Hooks
 *
 * UI-model types and hooks for workspace/org role-assignment tables.
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
export type GroupRoleBinding = Omit<RoleBindingsRoleBindingBySubject, 'subject'> & {
  subject?: RoleBindingsGroupSubject;
};

// =============================================================================
// UI Model Types (what components see)
// =============================================================================

export interface GroupAssignmentRole {
  id: string;
  name: string;
}

export interface GroupAssignmentRow {
  id: string;
  name: string;
  description: string;
  userCount: number;
  roleCount: number;
  roles: GroupAssignmentRole[];
  lastModified: string;
}

export interface InheritedGroupAssignmentRow extends GroupAssignmentRow {
  inheritedFrom?: {
    workspaceId: string;
    workspaceName: string;
  };
}

// =============================================================================
// Private transformer (rbac-client type IN → UI model OUT)
// =============================================================================

function toGroupAssignmentRow(binding: GroupRoleBinding): GroupAssignmentRow {
  const { subject } = binding;
  const roles: GroupAssignmentRole[] = (binding.roles ?? []).map((r) => ({ id: r.id ?? '', name: r.name ?? '' }));
  return {
    id: subject?.id ?? subject?.group?.name ?? '',
    name: subject?.group?.name ?? '',
    description: subject?.group?.description ?? '',
    userCount: subject?.group?.user_count ?? 0,
    roleCount: roles.length,
    roles,
    lastModified: binding.last_modified ?? '',
  };
}

function transformBindings(data: GroupRoleBinding[]): GroupAssignmentRow[] {
  return data.map(toGroupAssignmentRow).filter((row) => row.roleCount > 0);
}

// =============================================================================
// Public Hooks
// =============================================================================

const ROLE_BINDINGS_LIMIT = 1000;

/**
 * Returns group assignment rows for a workspace, already transformed and filtered.
 * Groups with zero roles are excluded.
 */
export function useGroupAssignments(workspaceId: string, options?: { enabled?: boolean }) {
  const query = useRoleAssignmentsQuery(workspaceId, {
    enabled: options?.enabled ?? true,
    limit: ROLE_BINDINGS_LIMIT,
  });

  const data = useMemo(() => (query.data?.data ? transformBindings(query.data.data as GroupRoleBinding[]) : []), [query.data]);

  return { data, isLoading: query.isLoading };
}

/**
 * Returns inherited group assignment rows for a workspace.
 * Queries the current workspace with `parent_role_bindings=true` so the API
 * traverses the full ancestor chain. Each row's `inheritedFrom` is derived
 * from the `resource` field on the binding (the ancestor workspace it came from).
 */
export function useInheritedGroupAssignments(workspaceId: string, options?: { enabled?: boolean }) {
  const query = useRoleAssignmentsQuery(workspaceId, {
    enabled: options?.enabled ?? true,
    limit: ROLE_BINDINGS_LIMIT,
    parentRoleBindings: true,
  });

  const data: InheritedGroupAssignmentRow[] = useMemo(() => {
    if (!query.data?.data) return [];
    const bindings = query.data.data as GroupRoleBinding[];
    const seen = new Set<string>();
    return bindings
      .map((binding): InheritedGroupAssignmentRow => {
        const row = toGroupAssignmentRow(binding);
        const resource = binding.resource;
        return {
          ...row,
          inheritedFrom: resource?.id ? { workspaceId: resource.id, workspaceName: resource.name ?? '' } : undefined,
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
 * Returns group assignment rows for an organization (tenant-scoped).
 * Used by OrganizationManagement.
 */
export function useOrgGroupAssignments(organizationId: string, options?: { enabled?: boolean }) {
  const query = useRoleBindingsQuery(
    {
      resourceId: `redhat/${organizationId}`,
      resourceType: 'tenant',
      fields: 'subject(id,group.name,group.user_count,group.description),roles(id,name)',
      limit: ROLE_BINDINGS_LIMIT,
    },
    { enabled: options?.enabled ?? true },
  );

  const data = useMemo(() => (query.data?.data ? transformBindings(query.data.data as GroupRoleBinding[]) : []), [query.data]);

  return { data, isLoading: query.isLoading };
}
