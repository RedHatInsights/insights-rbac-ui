import { bundleData } from '../presentational-components/myUserAccess/bundles';

const useBundleApps = (bundle) => {
  if (typeof bundle !== 'string' || bundle.length === 0) {
    return [];
  }

  const apps = bundleData.find(({ entitlement }) => entitlement === bundle)?.appsIds || [];
  return apps ? apps.sort((a, b) => a.localeCompare(b, 'en-US')) : [];
};

export default useBundleApps;
