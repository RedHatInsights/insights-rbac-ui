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
import { IntlProvider } from 'react-intl';
import messages from '../locales/data.json';
import {
  ConversionOptInBanner as ConversionOptInBannerInner,
  ConversionOptInBannerProps,
} from '../v1/components/ConversionOptInBanner';

export const locale = 'en';

const ConversionOptInBanner: React.FC<ConversionOptInBannerProps> = (props) => {
  return (
    <IntlProvider locale={locale} messages={messages[locale]}>
      <ConversionOptInBannerInner {...props} />
    </IntlProvider>
  );
};

export default ConversionOptInBanner;
export type { ConversionOptInBannerProps };
