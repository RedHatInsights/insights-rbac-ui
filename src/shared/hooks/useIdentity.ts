import { useEffect, useState } from 'react';
import { type UserIdentity, usePlatformAuth } from './usePlatformAuth';

export interface IdentityData extends UserIdentity {
  ready: boolean;
  orgAdmin: boolean;
}

/**
 * Chrome-only identity hook. Returns orgAdmin, identity, and ready state
 * without any V1 RBAC API dependency.
 *
 * This is the shared identity primitive used by both V1 and V2.
 * V1 composes this with useAccessPermissions in useUserData.
 * V2 uses this directly.
 */
const useIdentity = (): IdentityData => {
  // eslint-disable-next-line rbac-local/no-direct-get-user -- useIdentity is the canonical Chrome identity wrapper
  const { getUser } = usePlatformAuth();

  const [data, setData] = useState<IdentityData>({
    ready: false,
    orgAdmin: false,
    entitlements: {},
  });

  useEffect(() => {
    if (data.ready) return;

    let cancelled = false;

    getUser()
      .then((user) => {
        if (!cancelled) {
          setData({
            ready: true,
            orgAdmin: user?.identity?.user?.is_org_admin || false,
            entitlements: user?.entitlements || {},
            identity: user?.identity || {},
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData({ ready: true, orgAdmin: false, entitlements: {} });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [getUser, data.ready]);

  return data;
};

export default useIdentity;
