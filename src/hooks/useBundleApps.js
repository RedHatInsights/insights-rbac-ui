import { useHistory } from 'react-router-dom';
import { bundleData } from '../presentational-components/myUserAccess/bundles';

const useBundleApps = (bundle) => {
  const {
    push,
    location: { pathname },
  } = useHistory();
  if (typeof bundle !== 'string' || bundle.length === 0) {
    push({ to: pathname, search: `bundle=${bundleData[0].entitlement}` });
    return [];
  }

  const apps = bundleData.find(({ entitlement }) => entitlement === bundle)?.appsIds || [];
  return apps.sort((a, b) => a.localeCompare(b, 'en-US'));
};

export default useBundleApps;
