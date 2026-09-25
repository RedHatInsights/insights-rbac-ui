import { describe, expect, it } from 'vitest';
import { DEFAULT_MUA_BUNDLE } from '../../../shared/utilities/constants';
import { type MuaEntitlements, resolveMuaBundle } from './resolveMuaBundle';

const entitled = (...bundles: string[]): MuaEntitlements => Object.fromEntries(bundles.map((bundle) => [bundle, { is_entitled: true }]));

describe('resolveMuaBundle', () => {
  it('keeps the SaaS default when the bundle is missing or invalid and RHEL is entitled', () => {
    const entitlements = entitled('rhel', 'openshift', 'settings');

    expect(resolveMuaBundle(null, entitlements)).toBe(DEFAULT_MUA_BUNDLE);
    expect(resolveMuaBundle(undefined, entitlements)).toBe('rhel');
    expect(resolveMuaBundle('', entitlements)).toBe('rhel');
    expect(resolveMuaBundle('not-a-bundle', entitlements)).toBe('rhel');
  });

  it('defaults to the first entitled bundle when RHEL is not entitled', () => {
    const entitlements = entitled('openshift', 'settings');

    expect(resolveMuaBundle(null, entitlements)).toBe('openshift');
    expect(resolveMuaBundle(undefined, entitlements)).toBe('openshift');
  });

  it('redirects an unentitled bundle to the first entitled bundle', () => {
    expect(resolveMuaBundle('rhel', entitled('openshift', 'settings'))).toBe('openshift');
  });

  it('keeps an entitled bundle even when RHEL is also entitled', () => {
    expect(resolveMuaBundle('openshift', entitled('rhel', 'openshift', 'settings'))).toBe('openshift');
  });

  it('falls back to the SaaS default when nothing is entitled', () => {
    expect(resolveMuaBundle(null, {})).toBe('rhel');
    expect(resolveMuaBundle('openshift', undefined)).toBe('rhel');
    expect(resolveMuaBundle('rhel', { rhel: { is_entitled: false }, openshift: { is_entitled: false } })).toBe('rhel');
  });
});
