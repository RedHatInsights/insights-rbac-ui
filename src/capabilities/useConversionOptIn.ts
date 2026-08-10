import { useFlag } from '@unleash/proxy-client-react';

export function useConversionOptIn(): boolean {
  return useFlag('platform-conversion.opt-in-banner');
}
