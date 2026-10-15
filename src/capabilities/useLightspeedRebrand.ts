import { useFlag } from '@unleash/proxy-client-react';

export function useLightspeedRebrand(): boolean {
  return useFlag('platform.lightspeed-rebrand');
}
