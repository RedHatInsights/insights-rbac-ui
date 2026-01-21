import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import { GetPrincipalAccessOrderByEnum, GetPrincipalAccessStatusEnum, createAccessApi } from '../api/access';
import { useAppServices } from '../../contexts/ServiceContext';

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
 * Uses injected axios from ServiceContext - works in both browser and CLI.
 */
export function usePrincipalAccessQuery(
  params: UsePrincipalAccessQueryParams = {},
  options?: { enabled?: boolean },
): UseQueryResult<PrincipalAccessResult> {
  const { axios } = useAppServices();
  const accessApi = createAccessApi(axios);

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
