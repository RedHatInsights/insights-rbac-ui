import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import { accessApi } from '../api/access';

// ============================================================================
// Response Types
// ============================================================================

/**
 * Principal access query result.
 */
export interface PrincipalAccessResult {
  data: Array<{
    permission: string;
    resourceDefinitions: Array<{
      attributeFilter: {
        key: string;
        value: string;
        operation: string;
      };
    }>;
  }>;
  meta: {
    count: number;
    limit: number;
    offset: number;
  };
}

// ============================================================================
// Query Keys Factory
// ============================================================================

export const accessKeys = {
  all: ['access'] as const,
  principal: () => [...accessKeys.all, 'principal'] as const,
  principalAccess: (params: UsePrincipalAccessQueryParams) => [...accessKeys.principal(), params] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

export interface UsePrincipalAccessQueryParams {
  limit?: number;
  offset?: number;
  application?: string;
  orderBy?: string;
  status?: string;
  username?: string;
}

/**
 * Fetch principal access (permissions).
 * Returns a paginated list of permissions for the current principal.
 */
export function usePrincipalAccessQuery(
  params: UsePrincipalAccessQueryParams = {},
  options?: { enabled?: boolean },
): UseQueryResult<PrincipalAccessResult> {
  return useQuery({
    queryKey: accessKeys.principalAccess(params),
    queryFn: async (): Promise<PrincipalAccessResult> => {
      // NOTE: rbac-client has broken types, using any to bypass
      const response = await (accessApi.getPrincipalAccess as any)(
        params.application || '',
        params.username,
        params.orderBy,
        params.status,
        params.limit ?? 20,
        params.offset ?? 0,
      );
      return response.data as PrincipalAccessResult;
    },
    enabled: options?.enabled ?? true,
  });
}
