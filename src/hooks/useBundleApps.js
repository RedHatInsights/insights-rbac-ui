import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { bundleData } from '../presentational-components/myUserAccess/bundles';

const useBundleApps = (bundle) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  useEffect(() => {
    if (typeof bundle !== 'string' || bundle.length === 0 || !['application_services', 'openshift', 'rhel', 'ansible'].includes(bundle)) {
      bundle = 'rhel';
      navigate({ to: pathname, search: `bundle=${bundle}` }, { replace: true });
      return [];
    }
  }, [bundle]);

  return bundleData.find(({ entitlement }) => entitlement === bundle)?.appsIds || [];
};

export default useBundleApps;
