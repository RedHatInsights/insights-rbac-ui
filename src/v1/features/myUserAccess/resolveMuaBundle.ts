import { DEFAULT_MUA_BUNDLE } from '../../../shared/utilities/constants';
import { bundleData } from './bundleData';

export type MuaEntitlements = Record<string, { is_entitled?: boolean } | undefined>;

const isEntitled = (entitlements: MuaEntitlements | undefined, bundle: string): boolean => Boolean(entitlements?.[bundle]?.is_entitled);

const isKnownBundle = (bundle: string): boolean => bundleData.some(({ entitlement }) => entitlement === bundle);

/**
 * Bundle to show for My User Access.
 *
 * A known, entitled `?bundle=` is kept. Otherwise prefer DEFAULT_MUA_BUNDLE when
 * the user is entitled to it (SaaS RHEL), then the first entitled bundle in
 * bundleData order (on-prem OpenShift). Fall back to DEFAULT_MUA_BUNDLE when
 * nothing is entitled so the URL rewrite cannot loop.
 */
export const resolveMuaBundle = (requested: string | null | undefined, entitlements: MuaEntitlements | undefined): string => {
  if (requested && isKnownBundle(requested) && isEntitled(entitlements, requested)) {
    return requested;
  }

  if (isEntitled(entitlements, DEFAULT_MUA_BUNDLE)) {
    return DEFAULT_MUA_BUNDLE;
  }

  return bundleData.find(({ entitlement }) => isEntitled(entitlements, entitlement))?.entitlement ?? DEFAULT_MUA_BUNDLE;
};
