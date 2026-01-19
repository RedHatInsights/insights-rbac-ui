import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import { GetPrincipalAccessOrderByEnum, GetPrincipalAccessStatusEnum, accessApi } from '../api/access';

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
  orderBy?: GetPrincipalAccessOrderByEnum | string;
  status?: GetPrincipalAccessStatusEnum | string;
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
      const response = await accessApi.getPrincipalAccess({
        application: params.application || '',
        username: params.username,
        orderBy: params.orderBy as GetPrincipalAccessOrderByEnum,
        status: params.status as GetPrincipalAccessStatusEnum,
        limit: params.limit ?? 20,
        offset: params.offset ?? 0,
      });
      return response.data as PrincipalAccessResult;
    },
    enabled: options?.enabled ?? true,
  });
}
