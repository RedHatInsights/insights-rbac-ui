import { useQuery } from '@tanstack/react-query';
import {
  type ListPermissionOptionsParams,
  type ListPermissionsParams,
  type PermissionOptionsResponse,
  type PermissionsResponse,
  listPermissionOptionsFiltered,
  listPermissionsFiltered,
} from '../api/permissions';

// ============================================================================
// Query Keys Factory
// ============================================================================

export const permissionsKeys = {
  all: ['permissions'] as const,
  lists: () => [...permissionsKeys.all, 'list'] as const,
  list: (params: ListPermissionsParams) => [...permissionsKeys.lists(), params] as const,
  options: () => [...permissionsKeys.all, 'options'] as const,
  optionsByField: (field: string, params: Omit<ListPermissionOptionsParams, 'field'>) => [...permissionsKeys.options(), field, params] as const,
  expandSplats: (params: ListPermissionsParams) => [...permissionsKeys.all, 'expandSplats', params] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch a list of permissions with optional filtering
 */
export function usePermissionsQuery(params: ListPermissionsParams, options?: { enabled?: boolean }) {
  return useQuery<PermissionsResponse>({
    queryKey: permissionsKeys.list(params),
    queryFn: () => listPermissionsFiltered(params),
    enabled: options?.enabled ?? true,
  });
}

/**
 * Fetch permission options for a specific field (application, resource_type, or verb)
 */
export function usePermissionOptionsQuery(params: ListPermissionOptionsParams, options?: { enabled?: boolean }) {
  return useQuery<PermissionOptionsResponse>({
    queryKey: permissionsKeys.optionsByField(params.field, params),
    queryFn: () => listPermissionOptionsFiltered(params),
    enabled: options?.enabled ?? true,
  });
}

/**
 * Expand splat permissions (wildcards) to actual permissions
 * Uses the same API as listPermissions but with different defaults
 */
export function useExpandSplatsQuery(params: ListPermissionsParams, options?: { enabled?: boolean }) {
  const queryParams: ListPermissionsParams = {
    limit: 1000,
    offset: 0,
    excludeGlobals: true,
    ...params,
  };

  return useQuery<PermissionsResponse>({
    queryKey: permissionsKeys.expandSplats(queryParams),
    queryFn: () => listPermissionsFiltered(queryParams),
    enabled: options?.enabled ?? true,
  });
}

// Re-export types
export type {
  ListPermissionsParams,
  ListPermissionOptionsParams,
  PermissionsResponse,
  PermissionOptionsResponse,
  Permission,
} from '../api/permissions';
