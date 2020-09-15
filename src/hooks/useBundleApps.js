import { bundleData } from '../presentational-components/myUserAccess/bundles';

const useBundleApps = (bundle) => {
  if (typeof bundle !== 'string' || bundle.lenght === 0) {
    return [];
  }

  const apps = bundleData.find(({ entitlement }) => entitlement === bundle)?.apps;
  return apps ? Object.keys(apps).sort((a, b) => a.localeCompare(b, 'en-US')) : [];
};

export default useBundleApps;
