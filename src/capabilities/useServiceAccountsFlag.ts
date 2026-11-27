import { useFlag } from '@unleash/proxy-client-react';

export function useServiceAccountsFlag(): boolean {
  return useFlag('platform.rbac.group-service-accounts.stable');
}

export function useServiceAccessTokens(): boolean {
  return useFlag('platform.service-accounts.sat');
}

/**
 * Gate the Type filter in service accounts lists separately from the
 * broader SAT feature. Keeps the filter disabled until the SSO
 * contract (filtering + pagination) has been verified end-to-end.
 */
export function useServiceAccountTypeFilter(): boolean {
  return useFlag('platform.service-accounts.type-filter');
}
