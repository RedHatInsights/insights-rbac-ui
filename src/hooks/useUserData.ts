import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { useEffect, useState } from 'react';

interface UserData {
  ready: boolean;
  orgAdmin: boolean;
  userAccessAdministrator: boolean;
}

interface UserIdentity {
  identity?: {
    user?: {
      is_org_admin?: boolean;
    };
  };
}

interface Permission {
  permission: string;
}

const useUserData = (): UserData => {
  const chrome = useChrome();
  const [userData, setUserData] = useState<UserData>({
    ready: false,
    orgAdmin: false,
    userAccessAdministrator: false,
  });

  useEffect(() => {
    if (chrome && !userData.ready) {
      Promise.all([chrome.auth.getUser() as Promise<UserIdentity>, chrome.getUserPermissions('rbac') as Promise<Permission[]>]).then(
        ([user, permissions]) => {
          setUserData({
            ready: true,
            orgAdmin: user?.identity?.user?.is_org_admin || false,
            userAccessAdministrator: !!permissions.find(({ permission }) => permission === 'rbac:*:*'),
          });
        },
      );
    }
  }, [chrome, userData.ready]);

  return userData;
};

export default useUserData;
