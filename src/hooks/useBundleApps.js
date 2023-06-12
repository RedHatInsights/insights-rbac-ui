import { useLocation, useNavigate } from 'react-router-dom';
import { bundleData } from '../presentational-components/myUserAccess/bundles';

const useBundleApps = (bundle) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  if (typeof bundle !== 'string' || bundle.length === 0 || !['application_services', 'openshift', 'rhel', 'ansible'].includes(bundle)) {
    bundle = 'rhel';
    navigate({ to: pathname, search: `bundle=${bundle}` }, { replace: true });
    return [];
  }

  return bundleData.find(({ entitlement }) => entitlement === bundle)?.appsIds || [];
};

export default useBundleApps;
