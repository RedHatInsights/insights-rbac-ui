import React, { useRef } from 'react';
import { useMockState } from '../contexts/StorybookMockContext';
import type { TenantPermissionsMap, WorkspacePermissionsMap } from '../contexts/StorybookMockContext';

interface Resource {
  id: string;
  type: string;
  reporter?: { type: string };
  relation?: string;
}

interface AccessCheckResult {
  resource: Resource;
  allowed: boolean;
  relation: string;
}

type SingleParams = { relation: string; resource: Resource };
type BulkWithTopRelation = { relation: string; resources: Resource[] };
type BulkWithPerResourceRelation = { resources: (Resource & { relation: string })[] };
type UseSelfAccessCheckOptions = SingleParams | BulkWithTopRelation | BulkWithPerResourceRelation;

function checkTenantPermission(relation: string, tenantPerms: TenantPermissionsMap): boolean {
  return tenantPerms[relation as keyof TenantPermissionsMap] ?? false;
}

/**
 * Role binding relations that have optional granular keys in WorkspacePermissionsMap.
 * When the granular key is set, it takes priority; otherwise we fall back to the
 * coarse workspace relation via `wsFallbackMap`.
 */
const rbGranularKey: Record<string, keyof WorkspacePermissionsMap> = {
  role_binding_view: 'role_binding_view',
  role_binding_grant: 'role_binding_grant',
  role_binding_revoke: 'role_binding_revoke',
};

const wsFallbackMap: Record<string, keyof WorkspacePermissionsMap> = {
  rbac_workspace_view: 'view',
  rbac_workspace_edit: 'edit',
  rbac_workspace_create: 'create',
  rbac_workspace_delete: 'delete',
  rbac_workspace_move: 'move',
  role_binding_view: 'view',
  role_binding_grant: 'create',
  role_binding_revoke: 'delete',
  view: 'view',
  edit: 'edit',
  create: 'create',
  delete: 'delete',
  move: 'move',
};

function checkWorkspacePermission(relation: string, resourceId: string, wsPerms: WorkspacePermissionsMap): boolean {
  const granular = rbGranularKey[relation];
  if (granular) {
    const granularIds = wsPerms[granular];
    if (granularIds !== undefined) {
      return granularIds.includes('*') || granularIds.includes(resourceId);
    }
  }

  const fallback = wsFallbackMap[relation];
  if (!fallback) return false;
  const ids = wsPerms[fallback] ?? [];
  return ids.includes('*') || ids.includes(resourceId);
}

export const useSelfAccessCheck = (params: UseSelfAccessCheckOptions) => {
  const mock = useMockState();
  const mockRef = useRef(mock);
  mockRef.current = mock;

  const resolvePermission = (relation: string, resource: Resource): boolean => {
    if (resource.type === 'tenant') return checkTenantPermission(relation, mockRef.current.tenantPermissions);
    return checkWorkspacePermission(relation, resource.id, mockRef.current.workspacePermissions);
  };

  // Single resource check (Overload 1)
  if ('resource' in params && !('resources' in params)) {
    const { relation, resource } = params as SingleParams;
    const allowed = resolvePermission(relation, resource);

    return { data: { resource, allowed }, loading: false };
  }

  // Bulk check — determine relation per resource
  const rawResources = (params as BulkWithTopRelation | BulkWithPerResourceRelation).resources;
  const topRelation = 'relation' in params ? (params as BulkWithTopRelation).relation : undefined;

  const data: AccessCheckResult[] = rawResources.map((resource) => {
    const relation = resource.relation ?? topRelation ?? '';
    const allowed = resolvePermission(relation, resource);

    return { resource, allowed, relation };
  });

  return { data, loading: false };
};

// Mock AccessCheck.Provider - passes children through
export const AccessCheck = {
  Provider: ({ children }: { children: React.ReactNode; baseUrl?: string; apiPath?: string }) => <>{children}</>,
};
