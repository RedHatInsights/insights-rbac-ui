/**
 * Kessel Domain Hooks — V2 Permission Checks
 *
 * UI action language (canCreate, canView, etc.) backed by Kessel SDK calls.
 * Each domain hook makes a single bulk API call for its relations.
 * Components consume these hooks and never call useSelfAccessCheck directly.
 */

import { useMemo } from 'react';
import { useSelfAccessCheck } from '@project-kessel/react-kessel-access-check';
import type { NotEmptyArray, SelfAccessCheckResourceWithRelation } from '@project-kessel/react-kessel-access-check/types';
import useIdentity from '../../shared/hooks/useIdentity';
import { useOrganizationData } from './useOrganizationData';

// ============================================================================
// Internal constants
// ============================================================================

const RBAC_REPORTER = { type: 'rbac' } as const;

// ============================================================================
// Tenant-scoped bulk check helper
// ============================================================================

const _RBAC_TENANT_RELATIONS = [
  'rbac_roles_read',
  'rbac_roles_write',
  'rbac_groups_read',
  'rbac_groups_write',
  'rbac_principal_read',
  'rbac_workspace_view',
  'rbac_workspace_edit',
  'rbac_workspace_create',
  'rbac_workspace_delete',
  'rbac_workspace_move',
] as const;

type RbacTenantRelation = (typeof _RBAC_TENANT_RELATIONS)[number];

interface BulkCheckResult<R extends string> {
  result: Record<R, boolean>;
  isLoading: boolean;
}

/**
 * Bulk tenant-scoped check. Sends one /checkselfbulk request
 * for all provided relations against the tenant resource (Overload 3).
 * Fetches organizationId internally via useOrganizationData.
 */
function useBulkTenantCheck<R extends RbacTenantRelation>(relations: readonly R[]): BulkCheckResult<R> {
  const { organizationId: orgId, isLoading: orgLoading } = useOrganizationData();
  const hasOrgId = orgId !== '';

  const resourceId = hasOrgId ? `redhat/${orgId}` : '';

  const resources = useMemo<NotEmptyArray<SelfAccessCheckResourceWithRelation>>(() => {
    if (!hasOrgId) return [] as unknown as NotEmptyArray<SelfAccessCheckResourceWithRelation>;
    return relations.map((rel) => ({
      id: resourceId,
      type: 'tenant' as const,
      reporter: RBAC_REPORTER,
      relation: rel as string,
    })) as unknown as NotEmptyArray<SelfAccessCheckResourceWithRelation>;
  }, [resourceId, hasOrgId, relations]);

  const { data, loading } = useSelfAccessCheck({ resources });

  const result = useMemo(() => {
    const out = {} as Record<R, boolean>;
    for (const rel of relations) {
      out[rel] = false;
    }

    if (!hasOrgId || !Array.isArray(data)) return out;

    for (const check of data) {
      if (check.resource.id === resourceId && relations.includes(check.relation as R)) {
        out[check.relation as R] = check.allowed;
      }
    }
    return out;
  }, [data, resourceId, hasOrgId, relations]);

  return { result, isLoading: orgLoading || (hasOrgId && loading) };
}

// ============================================================================
// Workspace-scoped bulk check helper
// ============================================================================

const _RBAC_WORKSPACE_RELATIONS = [
  'rbac_workspaces_role_binding_view',
  'rbac_workspaces_role_binding_grant',
  'rbac_workspaces_role_binding_revoke',
  'rbac_workspaces_role_binding_update',
] as const;

type RbacWorkspaceRelation = (typeof _RBAC_WORKSPACE_RELATIONS)[number];

function useBulkWorkspaceCheck<R extends RbacWorkspaceRelation>(workspaceId: string, relations: readonly R[]): BulkCheckResult<R> {
  const hasId = workspaceId !== '';

  const resources = useMemo<NotEmptyArray<SelfAccessCheckResourceWithRelation>>(() => {
    if (!hasId) return [] as unknown as NotEmptyArray<SelfAccessCheckResourceWithRelation>;
    return relations.map((rel) => ({
      id: workspaceId,
      type: 'workspace' as const,
      reporter: RBAC_REPORTER,
      relation: rel as string,
    })) as unknown as NotEmptyArray<SelfAccessCheckResourceWithRelation>;
  }, [workspaceId, hasId, relations]);

  const { data, loading } = useSelfAccessCheck({ resources });

  const result = useMemo(() => {
    const out = {} as Record<R, boolean>;
    for (const rel of relations) {
      out[rel] = false;
    }

    if (!hasId || !Array.isArray(data)) return out;

    for (const check of data) {
      if (check.resource.id === workspaceId && relations.includes(check.relation as R)) {
        out[check.relation as R] = check.allowed;
      }
    }
    return out;
  }, [data, workspaceId, hasId, relations]);

  return { result, isLoading: hasId && loading };
}

// ============================================================================
// Domain Hooks — public API (UI action language)
// ============================================================================

const ROLES_RELATIONS = ['rbac_roles_read', 'rbac_roles_write'] as const;

export function useRolesAccess() {
  const { result, isLoading } = useBulkTenantCheck(ROLES_RELATIONS);
  const read = result.rbac_roles_read;
  const write = result.rbac_roles_write;

  return {
    canCreate: write,
    canView: read,
    canList: read,
    canUpdate: write,
    canDelete: write,
    isLoading,
  };
}

const GROUPS_RELATIONS = ['rbac_groups_read', 'rbac_groups_write'] as const;

export function useGroupsAccess() {
  const { result, isLoading } = useBulkTenantCheck(GROUPS_RELATIONS);
  const read = result.rbac_groups_read;
  const write = result.rbac_groups_write;

  return {
    canCreate: write,
    canView: read,
    canList: read,
    canUpdate: write,
    canDelete: write,
    canAddMembers: write,
    canViewMembers: read,
    canRemoveMembers: write,
    isLoading,
  };
}

const ROLE_BINDINGS_RELATIONS = [
  'rbac_workspaces_role_binding_view',
  'rbac_workspaces_role_binding_grant',
  'rbac_workspaces_role_binding_revoke',
  'rbac_workspaces_role_binding_update',
] as const;

export function useRoleBindingsAccess(workspaceId: string) {
  const { result, isLoading } = useBulkWorkspaceCheck(workspaceId, ROLE_BINDINGS_RELATIONS);

  return {
    canCreate: result.rbac_workspaces_role_binding_grant,
    canView: result.rbac_workspaces_role_binding_view,
    canList: result.rbac_workspaces_role_binding_view,
    canUpdate: result.rbac_workspaces_role_binding_update,
    canRevoke: result.rbac_workspaces_role_binding_revoke,
    isLoading,
  };
}

const WS_TENANT_RELATIONS = [
  'rbac_workspace_view',
  'rbac_workspace_edit',
  'rbac_workspace_create',
  'rbac_workspace_delete',
  'rbac_workspace_move',
] as const;

export function useWorkspaceTenantAccess() {
  const { result, isLoading } = useBulkTenantCheck(WS_TENANT_RELATIONS);

  return {
    canCreate: result.rbac_workspace_create,
    canView: result.rbac_workspace_view,
    canList: result.rbac_workspace_view,
    canUpdate: result.rbac_workspace_edit,
    canDelete: result.rbac_workspace_delete,
    canMove: result.rbac_workspace_move,
    isLoading,
  };
}

const PRINCIPALS_RELATIONS = ['rbac_principal_read'] as const;

/**
 * Principals access combines Kessel SDK (canList) with orgAdmin flag
 * (canInvite, canDelete, canToggleOrgAdmin). The orgAdmin source is
 * useIdentity from shared/hooks — a Chrome identity check, not RBAC.
 */
export function usePrincipalsAccess() {
  const { result, isLoading: kesselLoading } = useBulkTenantCheck(PRINCIPALS_RELATIONS);
  const { orgAdmin, ready: orgAdminReady } = useIdentity();

  return {
    canList: result.rbac_principal_read,
    canInvite: orgAdmin,
    canDelete: orgAdmin,
    canToggleOrgAdmin: orgAdmin,
    isLoading: kesselLoading || !orgAdminReady,
  };
}
