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
 * `onSuccess` must navigate away with a full page load. By the time it fires, the tenant is
 * on V2, but the surrounding page is not: the opt-in status it was built from is cached in
 * two places — this app's tenant query, and Chrome's `isKesselOrgOnboarded` behind the nav
 * (cached for 120s, identity-scoped). Closing the wizard in place leaves the user on a V1
 * page with V1 nav until those lapse, so the breakage is intermittent rather than obvious.
 * A full load re-runs both and delivers V2 pages and V2 nav together.
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
 *     // Full page load, not setWizardOpen(false) and not a router push.
 *     onSuccess={() => window.location.assign('/iam/overview')}
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

/**
 * `onSuccess` is optional on the internal component but required here: it is the handoff
 * onto V2, and the success screen's only button is wired straight to it. Omitted, that
 * button silently does nothing.
 */
type FederatedConversionWizardProps = Omit<ConversionWizardProps, 'onSuccess'> & {
  /** Must navigate away with a full page load — see the module docs above. */
  onSuccess: () => void;
  locale?: string;
};

const ConversionWizard: React.FC<FederatedConversionWizardProps> = ({ locale = 'en', ...props }) => {
  return (
    <IntlMessagesProvider locale={locale}>
      <ConversionWizardInner {...props} />
    </IntlMessagesProvider>
  );
};

export default ConversionWizard;
export type { FederatedConversionWizardProps as ConversionWizardProps };
