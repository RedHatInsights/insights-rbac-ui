import React from 'react';
import NotificationsProvider from '@redhat-cloud-services/frontend-components-notifications/NotificationsProvider';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';
import { createStore } from '@redhat-cloud-services/frontend-components-notifications/state';

import { IntlMessagesProvider } from './shared/i18n';
import { useChromeLocale } from './shared/hooks/useChromeLocale';
import { ApiErrorProvider } from './shared/contexts/ApiErrorContext';
import { QueryClientSetup } from './shared/components/QueryClientSetup';
import ApiErrorBoundary from './shared/components/ui-states/ApiErrorBoundary';
import { AppPlaceholder } from './shared/components/ui-states/LoaderPlaceholders';
import { useTenantOptInStatusQuery } from './shared/data/queries/tenant';
import { ServiceProvider } from './shared/contexts/ServiceContext';
import { type AddNotificationFn, createBrowserServices } from './shared/entry/browser';
import { useFedRAMPMode } from './capabilities/useFedRAMPMode';
import { usePlatformAuth } from './shared/hooks/usePlatformAuth';
import { usePlatformEnvironment } from './shared/hooks/usePlatformEnvironment';
import { useIdentity } from './shared/hooks/useIdentity';
import { useWorkspacesFlag } from './capabilities/useWorkspacesFlag';
import { IamV1 } from './v1/IamV1';
import { IamV2 } from './v2/IamV2';

const NOTIFICATION_DISMISS_DELAY = 3000;

export interface IamProps {
  testMode?: boolean;
}

/**
 * Shared provider stack for both V1 and V2.
 * Wires all Chrome/Unleash values into ServiceProvider so data layer hooks
 * can access them via useAppServices() without importing platform hooks.
 */
const SharedProviders: React.FC<IamProps & { locale: string; children: React.ReactNode }> = ({ testMode, locale, children }) => {
  const addNotification = useAddNotification() as AddNotificationFn;
  const { getToken } = usePlatformAuth();
  const { environment, ssoUrl } = usePlatformEnvironment();
  const { identity } = useIdentity();
  const isITLess = useFedRAMPMode();

  const services = createBrowserServices({
    addNotification,
    getToken,
    environment,
    ssoUrl,
    identity: identity ? { org_id: identity.org_id, account_id: identity.internal?.account_id } : undefined,
    isITLess,
    locale,
  });

  return (
    <ApiErrorProvider>
      <ServiceProvider value={services}>
        <QueryClientSetup testMode={testMode}>
          <ApiErrorBoundary>{children}</ApiErrorBoundary>
        </QueryClientSetup>
      </ServiceProvider>
    </ApiErrorProvider>
  );
};

/**
 * Version router: renders V2 when the access-management flag is on, or when the tenant has
 * already converted.
 *
 * Conversion is irreversible and per-tenant, while the flag is rolled out per environment, so
 * the two can disagree. A converted tenant that still lands in V1 is broken: V1 checks
 * permissions against the V1 access API, which conversion stops populating, so every page
 * denies them. Opt-in therefore has to be sufficient on its own.
 */
const VersionRouter: React.FC = () => {
  const flagEnabled = useWorkspacesFlag('m5');

  // Only worth asking when the flag alone would send the user to V1 — this sits in front of
  // the whole app, so the flag path must not wait on a request.
  const { data, isLoading } = useTenantOptInStatusQuery({ enabled: !flagEnabled });
  const optedIn = data?.v2_opted_in === true;

  const hasAccessManagement = flagEnabled || optedIn;
  const waitingForOptInStatus = !flagEnabled && isLoading;

  // Picking a version before the answer arrives would mount one app and then swap it for the
  // other, throwing away whatever the first one had already fetched.
  if (waitingForOptInStatus) {
    return <AppPlaceholder />;
  }

  return hasAccessManagement ? <IamV2 /> : <IamV1 />;
};

/**
 * Main application entry point for IAM.
 *
 * Provider hierarchy:
 * - IntlMessagesProvider (i18n — async locale loading)
 * - NotificationsProvider (toast notifications)
 * - SharedProviders (error handling, services, query client)
 * - VersionRouter → IamV1 or IamV2
 */
export const Iam: React.FC<IamProps> = ({ testMode = false }) => {
  const locale = useChromeLocale();

  const notificationStore = React.useMemo(() => {
    const store = createStore();
    const originalAdd = store.addNotification.bind(store);
    store.addNotification = (config) => originalAdd({ dismissDelay: NOTIFICATION_DISMISS_DELAY, ...config } as typeof config);
    return store;
  }, []);

  return (
    <IntlMessagesProvider locale={locale}>
      <NotificationsProvider store={notificationStore}>
        <SharedProviders testMode={testMode} locale={locale}>
          <VersionRouter />
        </SharedProviders>
      </NotificationsProvider>
    </IntlMessagesProvider>
  );
};
