import { bundleData } from './bundleData';

export const useBundleApps = (bundle?: string): string[] => {
  if (!bundle) {
    return [];
  }

  return bundleData.find(({ entitlement }) => entitlement === bundle)?.appsIds || [];
};
