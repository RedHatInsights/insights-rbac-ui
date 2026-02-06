import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { useMemo } from 'react';

export type Environment = 'production' | 'staging' | 'qa';

export interface PlatformEnvironment {
  /** Current environment: 'production', 'staging', or 'qa' */
  environment: Environment;
  /** SSO URL for the current environment */
  ssoUrl: string;
  /** Portal URL for the current environment */
  portalUrl: string;
}

/**
 * Hook to access platform environment information.
 *
 * @example
 * const { environment, ssoUrl } = usePlatformEnvironment();
 * if (environment === 'production') { ... }
 */
export const usePlatformEnvironment = (): PlatformEnvironment => {
  const chrome = useChrome();

  return useMemo(() => {
    const rawEnv = chrome.getEnvironment();
    const environment: Environment = rawEnv === 'prod' ? 'production' : rawEnv === 'stage' ? 'staging' : 'qa';
    const envDetails = chrome.getEnvironmentDetails?.();

    return {
      environment,
      ssoUrl: envDetails?.sso ?? '',
      portalUrl: envDetails?.portal ?? '',
    };
  }, [chrome]);
};
