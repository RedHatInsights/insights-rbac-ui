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
