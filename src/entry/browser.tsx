/**
 * Browser Entry Point - Web Environment Setup
 *
 * This entry point configures the React application for browser usage:
 * - Cookie-based session authentication (via Red Hat Chrome)
 * - Redux-based toast notifications
 * - 401 handling with automatic page reload
 *
 * Usage:
 *   This module is used by AppEntry.tsx to wrap the application
 *   with the ServiceProvider for dependency injection.
 */

import React, { type ReactNode } from 'react';
import axios, { type AxiosError, type AxiosInstance } from 'axios';
import { ServiceProvider } from '../contexts/ServiceContext';
import type { AppServices, NotifyFn } from '../services/types';

// ============================================================================
// Axios Instance Factory
// ============================================================================

/**
 * Handle 401 Unauthorized by reloading the page to force re-authentication.
 * This is critical for session expiration handling in the browser.
 */
const handle401Error = (error: AxiosError) => {
  if (error.response?.status === 401) {
    window.location.reload();
  }
  return Promise.reject(error);
};

/**
 * Create a configured axios instance for browser usage.
 * Includes 401 interceptor for automatic session expiration handling.
 *
 * @returns Configured AxiosInstance for browser environment
 */
export function createBrowserAxiosInstance(): AxiosInstance {
  const instance = axios.create();
  instance.interceptors.response.use(undefined, handle401Error);
  return instance;
}

/**
 * Default browser axios instance - singleton for the application.
 */
export const browserApiClient = createBrowserAxiosInstance();

// ============================================================================
// Browser Notification Implementation
// ============================================================================

/**
 * Type for the addNotification function from frontend-components-notifications.
 * We use a looser type with `variant: string` to avoid conflicts with the library's
 * strict union type. The actual function accepts the same properties.
 */
export type AddNotificationFn = (notification: { variant: string; title: string; description?: string; dismissable?: boolean }) => void;

/**
 * Create a browser notification function that integrates with Redux/Toast.
 *
 * @param addNotification - Function from @redhat-cloud-services/frontend-components-notifications
 * @returns NotifyFn compatible with AppServices
 *
 * Note: We use a generic function type here to avoid type conflicts between
 * the frontend-components-notifications types and our NotifyFn interface.
 * The actual addNotification from useAddNotification() accepts objects with
 * variant, title, description, and dismissable properties.
 */
export function createBrowserNotify(addNotification: AddNotificationFn): NotifyFn {
  return (variant, title, description) => {
    addNotification({
      variant,
      title,
      description,
      dismissable: true,
    });
  };
}

// ============================================================================
// Services Factory
// ============================================================================

/**
 * Create browser-specific services with Redux notification integration.
 *
 * @param addNotification - The addNotification function from frontend-components-notifications
 * @returns AppServices configured for browser environment
 *
 * @example
 * ```tsx
 * import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';
 * import { createBrowserServices } from './entry/browser';
 *
 * function App() {
 *   const addNotification = useAddNotification();
 *   const services = createBrowserServices(addNotification);
 *
 *   return (
 *     <ServiceProvider value={services}>
 *       <MyApp />
 *     </ServiceProvider>
 *   );
 * }
 * ```
 */
export function createBrowserServices(addNotification: AddNotificationFn): AppServices {
  return {
    axios: browserApiClient,
    notify: createBrowserNotify(addNotification),
  };
}

/**
 * Create browser-specific services with a custom axios instance.
 * Use this when you need to provide a different axios configuration.
 *
 * @param axiosInstance - Custom axios instance
 * @param addNotification - The addNotification function from frontend-components-notifications
 * @returns AppServices configured for browser environment
 */
export function createBrowserServicesWithAxios(axiosInstance: AxiosInstance, addNotification: AddNotificationFn): AppServices {
  return {
    axios: axiosInstance,
    notify: createBrowserNotify(addNotification),
  };
}

// ============================================================================
// Browser App Wrapper
// ============================================================================

interface BrowserAppWrapperProps {
  children: ReactNode;
  services: AppServices;
}

/**
 * Browser application wrapper with ServiceProvider.
 *
 * Note: IntlProvider and NotificationsProvider should be added by the
 * consuming code (AppEntry.tsx) as they may have app-specific configuration.
 *
 * @example
 * ```tsx
 * import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';
 * import { BrowserAppWrapper, createBrowserServices } from './entry/browser';
 *
 * function AppWithServices({ children }) {
 *   const addNotification = useAddNotification();
 *   const services = createBrowserServices(addNotification);
 *
 *   return (
 *     <BrowserAppWrapper services={services}>
 *       {children}
 *     </BrowserAppWrapper>
 *   );
 * }
 * ```
 */
export function BrowserAppWrapper({ children, services }: BrowserAppWrapperProps): React.ReactElement {
  return <ServiceProvider value={services}>{children}</ServiceProvider>;
}

// ============================================================================
// Exports
// ============================================================================

export { ServiceProvider } from '../contexts/ServiceContext';
export type { AppServices, NotifyFn } from '../services/types';
