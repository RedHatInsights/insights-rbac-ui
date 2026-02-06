import { useEffect, useState } from 'react';
import { usePlatformAuth } from './usePlatformAuth';
import { useAccessPermissions } from './useAccessPermissions';

interface UserData {
  ready: boolean;
  orgAdmin: boolean;
  userAccessAdministrator: boolean;
}

const useUserData = (): UserData => {
  const { getUser } = usePlatformAuth();
  const { hasAccess: hasRbacWildcard, isLoading: permissionsLoading } = useAccessPermissions(['rbac:*:*']);

  const [userData, setUserData] = useState<UserData>({
    ready: false,
    orgAdmin: false,
    userAccessAdministrator: false,
  });

  useEffect(() => {
    if (!userData.ready && !permissionsLoading) {
      getUser().then((user) => {
        setUserData({
          ready: true,
          orgAdmin: user?.identity?.user?.is_org_admin || false,
          userAccessAdministrator: hasRbacWildcard,
        });
      });
    }
  }, [getUser, hasRbacWildcard, permissionsLoading, userData.ready]);

  return userData;
};

export default useUserData;
