import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { useEffect, useState } from 'react';

const useUserData = () => {
  const chrome = useChrome();
  const [userData, setUserData] = useState({
    ready: false,
    orgAdmin: false,
    userAccessAdministrator: false,
  });

  useEffect(() => {
    if (chrome && !userData.ready)
      Promise.all([chrome.auth.getUser(), chrome.getUserPermissions('rbac')]).then(([user, permissions]) => {
        setUserData({
          ready: true,
          orgAdmin: user?.identity?.user?.is_org_admin,
          userAccessAdministrator: !!permissions.find(({ permission }) => permission === 'rbac:*:*'),
        });
      });
  }, [chrome, userData.ready]);

  return userData;
};

export default useUserData;
