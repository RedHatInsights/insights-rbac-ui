/**
 * ConversionOptInBanner - Federated Module
 *
 * Self-contained conversion opt-in banner for module federation.
 * External consumers can use this via AsyncComponent without needing their own providers.
 *
 * ```tsx
 * <AsyncComponent
 *   scope="rbac"
 *   module="./modules/ConversionOptInBanner"
 *   isOrgAdmin={isOrgAdmin}
 *   onGetStarted={handleGetStarted}
 *   fallback={<Skeleton />}
 * />
 * ```
 *
 * Host responsibilities: this module renders unconditionally. It reads no feature flags and
 * no identity beyond the `isOrgAdmin` prop, so the consumer owns the gating:
 *
 * - **Feature flag** — in-app this is `platform.conversion.opt-in-banner`; `OverviewContent`
 *   mounts the banner only when it and `orgAdmin` are both true.
 * - **Org admin** — pass `isOrgAdmin`; the module renders nothing when it is false.
 * - **Tenant eligibility** — the wizard's job, not the host's. It calls
 *   `GET /tenant/opt-in/eligibility/` before converting and names any blocking custom roles
 *   and groups, so an ineligible org gets an actionable explanation rather than a dead end.
 *
 * Providers included:
 * - IntlProvider (i18n)
 */

import React from 'react';
import { IntlMessagesProvider } from '../shared/i18n';
import { ConversionOptInBanner as ConversionOptInBannerInner, ConversionOptInBannerProps } from '../v1/components/ConversionOptInBanner';

type FederatedConversionOptInBannerProps = ConversionOptInBannerProps & { locale?: string };

const ConversionOptInBanner: React.FC<FederatedConversionOptInBannerProps> = ({ locale = 'en', ...props }) => {
  return (
    <IntlMessagesProvider locale={locale}>
      <ConversionOptInBannerInner {...props} />
    </IntlMessagesProvider>
  );
};

export default ConversionOptInBanner;
export type { FederatedConversionOptInBannerProps as ConversionOptInBannerProps };
