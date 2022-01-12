import { useHistory } from 'react-router-dom';
import { bundleData } from '../presentational-components/myUserAccess/bundles';

const useBundleApps = (bundle) => {
  const {
    replace,
    location: { pathname },
  } = useHistory();
  if (typeof bundle !== 'string' || bundle.length === 0 || !['application_services', 'openshift', 'rhel', 'ansible'].includes(bundle)) {
    bundle = 'rhel';
    replace({ to: pathname, search: `bundle=${bundle}` });
    return [];
  }

  return bundleData.find(({ entitlement }) => entitlement === bundle)?.appsIds || [];
};

export default useBundleApps;
