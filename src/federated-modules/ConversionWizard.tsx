/**
 * ConversionWizard - Federated Module
 *
 * Self-contained V2 conversion wizard for module federation.
 * External consumers can use this via AsyncComponent without needing their own providers.
 *
 * Pairs with `./modules/ConversionOptInBanner`: the banner's `onGetStarted` callback is
 * what mounts this wizard. The wizard renders its own modal and is always open while
 * mounted, so consumers control visibility by mounting and unmounting it.
 *
 * ```tsx
 * const [isWizardOpen, setWizardOpen] = useState(false);
 *
 * <AsyncComponent
 *   scope="rbac"
 *   module="./modules/ConversionOptInBanner"
 *   isOrgAdmin={isOrgAdmin}
 *   onGetStarted={() => setWizardOpen(true)}
 *   fallback={<Skeleton />}
 * />
 * {isWizardOpen && (
 *   <AsyncComponent
 *     scope="rbac"
 *     module="./modules/ConversionWizard"
 *     onCancel={() => setWizardOpen(false)}
 *     onSuccess={() => setWizardOpen(false)}
 *   />
 * )}
 * ```
 *
 * Providers included:
 * - IntlProvider (i18n)
 *
 * The wizard talks to the RBAC tenant API through the shared browser axios client, so no
 * ServiceProvider or QueryClientProvider is required.
 */

import React from 'react';
import { IntlMessagesProvider } from '../shared/i18n';
import { ConversionWizard as ConversionWizardInner, ConversionWizardProps } from '../v1/components/conversion-wizard/ConversionWizard';

type FederatedConversionWizardProps = ConversionWizardProps & { locale?: string };

const ConversionWizard: React.FC<FederatedConversionWizardProps> = ({ locale = 'en', ...props }) => {
  return (
    <IntlMessagesProvider locale={locale}>
      <ConversionWizardInner {...props} />
    </IntlMessagesProvider>
  );
};

export default ConversionWizard;
export type { FederatedConversionWizardProps as ConversionWizardProps };
