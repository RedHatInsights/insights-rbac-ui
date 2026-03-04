import { useEffect, useState } from 'react';
import { UserIdentity, usePlatformAuth } from './usePlatformAuth';
import { useAccessPermissions } from './useAccessPermissions';

interface UserData extends UserIdentity {
  ready: boolean;
  orgAdmin: boolean;
  userAccessAdministrator: boolean;
}

const useUserData = (): UserData => {
  // eslint-disable-next-line rbac-local/no-direct-get-user -- useUserData is the canonical wrapper
  const { getUser } = usePlatformAuth();
  const { hasAccess: hasRbacWildcard, isLoading: permissionsLoading } = useAccessPermissions(['rbac:*:*']);

  const [userData, setUserData] = useState<UserData>({
    ready: false,
    orgAdmin: false,
    userAccessAdministrator: false,
    entitlements: {},
  });

  useEffect(() => {
    if (!userData.ready && !permissionsLoading) {
      getUser().then((user) => {
        setUserData({
          ready: true,
          orgAdmin: user?.identity?.user?.is_org_admin || false,
          userAccessAdministrator: hasRbacWildcard,
          entitlements: user?.entitlements || {},
          identity: user?.identity || {},
        });
      });
    }
  }, [getUser, hasRbacWildcard, permissionsLoading, userData.ready]);

  return userData;
};

export default useUserData;
