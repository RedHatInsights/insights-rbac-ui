import { useLocation, useNavigate } from 'react-router-dom';
import { bundleData } from './bundleData';
import { DEFAULT_MUA_BUNDLE } from '../../utilities/constants';

type BundleType = 'openshift' | 'rhel' | 'ansible' | 'settings';

export const useBundleApps = (bundle?: string): string[] => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  if (typeof bundle !== 'string' || bundle.length === 0 || !(['openshift', 'rhel', 'ansible', 'settings'] as const).includes(bundle as BundleType)) {
    const defaultBundle = DEFAULT_MUA_BUNDLE;
    navigate({ pathname, search: `bundle=${defaultBundle}` }, { replace: true });
    return [];
  }

  return bundleData.find(({ entitlement }) => entitlement === bundle)?.appsIds || [];
};
