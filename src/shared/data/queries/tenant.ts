import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { type TenantOptInResponse, createTenantApi } from '../api/tenant';
import { useAppServices } from '../../contexts/ServiceContext';

// ============================================================================
// Query Keys Factory
// ============================================================================

export const tenantKeys = {
  all: ['tenant'] as const,
  optIn: () => [...tenantKeys.all, 'opt-in'] as const,
  optInStatus: () => [...tenantKeys.optIn(), 'status'] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/** Treated as the answer whenever the real one cannot be obtained. */
const NOT_OPTED_IN: TenantOptInResponse = { v2_opted_in: false };

/**
 * A 403 or 404 is this endpoint telling us it will not answer for this user, which is as
 * definitive as a `false`. Anything else (network failure, 5xx, timeout) might succeed if
 * asked again, and is worth one retry: reporting "not opted in" for a tenant that has in fact
 * converted routes them into V1, where conversion has already stopped the V1 access API from
 * answering, so every page denies them.
 */
const isDefinitiveRefusal = (error: unknown): boolean => {
  const status = (error as AxiosError | undefined)?.response?.status;
  return status === 403 || status === 404;
};

/**
 * Whether the tenant has converted to V2.
 *
 * Failures are swallowed rather than thrown. The app shell calls this to pick which version
 * to render, and every other query's errors reach `ApiErrorBoundary` through the QueryCache,
 * where a 403 or 5xx replaces the whole app with an error page. This endpoint is not
 * guaranteed to be readable by every user, so letting it fail normally would blank the app
 * for them. Reporting "not opted in" instead falls back to the feature flag alone, which is
 * how the shell behaved before this query existed.
 */
export function useTenantOptInStatusQuery(options?: { enabled?: boolean }) {
  const { axios } = useAppServices();

  return useQuery<TenantOptInResponse>({
    queryKey: tenantKeys.optInStatus(),
    queryFn: async () => {
      const api = createTenantApi(axios);

      try {
        return await api.getOptInStatus();
      } catch (error) {
        if (isDefinitiveRefusal(error)) {
          return NOT_OPTED_IN;
        }

        // Retried here rather than through the client's `retry` option: that only runs when the
        // query rejects, and rejecting would reach `QueryCache.onError` and blank the app.
        try {
          return await api.getOptInStatus();
        } catch (retryError) {
          console.error('Failed to read tenant opt-in status; assuming not opted in:', retryError);
          return NOT_OPTED_IN;
        }
      }
    },
    enabled: options?.enabled ?? true,
  });
}

// Re-export types
export type { TenantOptInResponse } from '../api/tenant';
