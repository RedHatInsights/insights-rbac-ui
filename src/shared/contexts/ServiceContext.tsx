/**
 * Service Context - Dependency Injection for Environment-Specific Services
 *
 * This context provides injectable services for:
 * - axios: HTTP client (browser uses cookies, CLI uses Bearer token)
 * - notify: Notification system (browser uses Redux/Toast, CLI uses console)
 *
 * Shared hooks consume these via useAppServices() and remain environment-agnostic.
 * This is the canonical source for service injection - do not import directly
 * from src/services/ServiceContext.tsx (legacy location).
 */

import React, { type ReactNode, createContext, useContext } from 'react';
import type { AxiosInstance } from 'axios';
import type { AppServices, NotifyFn } from '../services/types';

// Re-export types for convenience
export type { AppServices, NotifyFn, NotificationVariant } from '../services/types';

/**
 * Context for injected services - null by default to detect missing provider.
 */
const ServiceContext = createContext<AppServices | null>(null);

/**
 * Provider component for injecting services at the application root.
 *
 * Must wrap the entire app (including QueryClientProvider and IntlProvider):
 *
 * ```tsx
 * <ServiceProvider value={services}>
 *   <QueryClientProvider client={queryClient}>
 *     <IntlProvider locale="en" messages={messages}>
 *       <App />
 *     </IntlProvider>
 *   </QueryClientProvider>
 * </ServiceProvider>
 * ```
 */
export function ServiceProvider({ children, value }: { children: ReactNode; value: AppServices }): React.ReactElement {
  return <ServiceContext.Provider value={value}>{children}</ServiceContext.Provider>;
}

/**
 * Hook to access all injected services.
 *
 * @throws Error if used outside a ServiceProvider - this is intentional
 *         to fail fast during development if the provider is missing.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { axios, notify } = useAppServices();
 *
 *   const handleClick = async () => {
 *     try {
 *       await axios.post('/api/resource', data);
 *       notify('success', 'Resource created');
 *     } catch (error) {
 *       notify('danger', 'Failed to create resource');
 *     }
 *   };
 * }
 * ```
 */
export function useAppServices(): AppServices {
  const services = useContext(ServiceContext);
  if (!services) {
    throw new Error(
      'useAppServices must be used within a ServiceProvider. ' +
        'Ensure your app is wrapped with <ServiceProvider value={services}>. ' +
        'For CLI: use createCliServices(axios). ' +
        'For browser: use createBrowserServices(addNotification).',
    );
  }
  return services;
}

/**
 * Hook to access just the axios instance.
 * Convenience hook when only HTTP client is needed.
 */
export function useAxios(): AxiosInstance {
  return useAppServices().axios;
}

/**
 * Hook to access just the notify function.
 * Convenience hook when only notifications are needed.
 */
export function useNotify(): NotifyFn {
  return useAppServices().notify;
}
