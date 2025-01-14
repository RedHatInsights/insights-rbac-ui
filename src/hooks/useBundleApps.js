import { useLocation, useNavigate } from 'react-router-dom';
import { bundleData } from '../presentational-components/myUserAccess/bundles';
import { DEFAULT_MUA_BUNDLE } from '../utilities/constants';

const useBundleApps = (bundle) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  if (typeof bundle !== 'string' || bundle.length === 0 || !['openshift', 'rhel', 'ansible', 'settings'].includes(bundle)) {
    bundle = DEFAULT_MUA_BUNDLE;
    navigate({ to: pathname, search: `bundle=${bundle}` }, { replace: true });
    return [];
  }

  return bundleData.find(({ entitlement }) => entitlement === bundle)?.appsIds || [];
};

export default useBundleApps;
