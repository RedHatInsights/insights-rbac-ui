import { useFlag } from '@unleash/proxy-client-react';

export function useServiceAccountsFlag(): boolean {
  return useFlag('platform.rbac.group-service-accounts.stable');
}
