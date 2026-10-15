import { useQuery } from '@tanstack/react-query';
import {
  type ListPermissionOptionsParams,
  type ListPermissionsParams,
  type PermissionOptionsResponse,
  type PermissionsResponse,
  createPermissionsApi,
  listPermissionOptionsFiltered,
  listPermissionsFiltered,
} from '../api/permissions';
import { useAppServices } from '../../contexts/ServiceContext';

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
 * Fetch a list of permissions with optional filtering.
 * Uses useAppServices().axios for DI — works in browser, CLI, and Storybook.
 */
export function usePermissionsQuery(params: ListPermissionsParams, options?: { enabled?: boolean }) {
  const { axios } = useAppServices();
  const permissionsApi = createPermissionsApi(axios);

  return useQuery<PermissionsResponse>({
    queryKey: permissionsKeys.list(params),
    queryFn: () => listPermissionsFiltered(permissionsApi, params),
    enabled: options?.enabled ?? true,
  });
}

/**
 * Fetch permission options for a specific field (application, resource_type, or verb).
 * Uses useAppServices().axios for DI — works in browser, CLI, and Storybook.
 */
export function usePermissionOptionsQuery(params: ListPermissionOptionsParams, options?: { enabled?: boolean }) {
  const { axios } = useAppServices();
  const permissionsApi = createPermissionsApi(axios);

  return useQuery<PermissionOptionsResponse>({
    queryKey: permissionsKeys.optionsByField(params.field, params),
    queryFn: () => listPermissionOptionsFiltered(permissionsApi, params),
    enabled: options?.enabled ?? true,
  });
}

/**
 * Expand splat permissions (wildcards) to actual permissions.
 * Uses useAppServices().axios for DI — works in browser, CLI, and Storybook.
 */
export function useExpandSplatsQuery(params: ListPermissionsParams, options?: { enabled?: boolean }) {
  const { axios } = useAppServices();
  const permissionsApi = createPermissionsApi(axios);

  const queryParams: ListPermissionsParams = {
    limit: 1000,
    offset: 0,
    excludeGlobals: true,
    ...params,
  };

  return useQuery<PermissionsResponse>({
    queryKey: permissionsKeys.expandSplats(queryParams),
    queryFn: () => listPermissionsFiltered(permissionsApi, queryParams),
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
