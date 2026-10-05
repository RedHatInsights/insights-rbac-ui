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
 * - IntlMessagesProvider (loads the selected locale catalog)
 */

import React from 'react';
import { locale } from '../locales/locale';
import { IntlMessagesProvider } from '../shared/i18n/IntlMessagesProvider';
import { ConversionOptInBanner as ConversionOptInBannerInner, ConversionOptInBannerProps } from '../v1/components/ConversionOptInBanner';

export { locale };

const ConversionOptInBanner: React.FC<ConversionOptInBannerProps> = (props) => {
  return (
    <IntlMessagesProvider locale={locale}>
      <ConversionOptInBannerInner {...props} />
    </IntlMessagesProvider>
  );
};

export default ConversionOptInBanner;
export type { ConversionOptInBannerProps };
