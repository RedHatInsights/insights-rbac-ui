import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { useCallback } from 'react';

/**
 * User identity structure from the platform auth
 */
export interface UserIdentity {
  identity?: {
    account_number?: string;
    org_id?: string;
    user?: {
      is_org_admin?: boolean;
      username?: string;
      email?: string;
      is_internal?: boolean;
    };
    internal?: {
      account_id?: string;
      cross_access?: boolean;
    };
    organization?: {
      name?: string;
    };
  };
  entitlements?: Record<string, { is_entitled: boolean }>;
}

/**
 * Hook to access platform authentication.
 *
 * Returns stable callback functions that can be used to get auth token and user identity.
 *
 * @example
 * const { getToken, getUser } = usePlatformAuth();
 * const token = await getToken();
 * const user = await getUser();
 */
export const usePlatformAuth = () => {
  const chrome = useChrome();

  const getToken = useCallback(async (): Promise<string> => {
    const token = await chrome.auth.getToken();
    return token ?? '';
  }, [chrome]);

  const getUser = useCallback(async (): Promise<UserIdentity> => {
    return chrome.auth.getUser() as Promise<UserIdentity>;
  }, [chrome]);

  return { getToken, getUser };
};
