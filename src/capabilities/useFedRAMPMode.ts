import { useFlag } from '@unleash/proxy-client-react';

export function useFedRAMPMode(): boolean {
  return useFlag('platform.rbac.itless');
}
