import { useEffect } from 'react';
import { bundleData } from './bundleData';
import { DEFAULT_MUA_BUNDLE } from '../../../shared/utilities/constants';
import useAppNavigate from '../../../shared/hooks/useAppNavigate';
import pathnames from '../../utilities/pathnames';

type BundleType = 'openshift' | 'rhel' | 'ansible' | 'settings';

export const useBundleApps = (bundle?: string): string[] => {
  const navigate = useAppNavigate();

  // Validate bundle and redirect to default if invalid
  // Must be in useEffect to avoid navigating during render
  useEffect(() => {
    if (
      typeof bundle !== 'string' ||
      bundle.length === 0 ||
      !(['openshift', 'rhel', 'ansible', 'settings'] as const).includes(bundle as BundleType)
    ) {
      const defaultBundle = DEFAULT_MUA_BUNDLE;
      navigate(
        {
          pathname: pathnames['my-user-access'].link(),
          search: 'bundle=' + defaultBundle,
        },
        { replace: true },
      );
    }
  }, [bundle, navigate]);

  // Return empty array if bundle is invalid (will redirect via useEffect)
  if (typeof bundle !== 'string' || bundle.length === 0 || !(['openshift', 'rhel', 'ansible', 'settings'] as const).includes(bundle as BundleType)) {
    return [];
  }

  return bundleData.find(({ entitlement }) => entitlement === bundle)?.appsIds || [];
};
