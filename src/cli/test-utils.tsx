/**
 * CLI Test Utilities for Vitest
 *
 * Provides testing utilities for CLI components using
 * @testing-library/react with MSW for API mocking.
 */

import React, { type ReactElement, type ReactNode } from 'react';
import { type RenderOptions as RTLRenderOptions, type RenderResult as RTLRenderResult, render as rtlRender } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import axios, { type AxiosInstance } from 'axios';
import { type AppServices, type NotifyFn, ServiceProvider } from '../contexts/ServiceContext';

// ============================================================================
// Test Axios Instance (Auth Bypass)
// ============================================================================

/**
 * Creates a test axios instance with a fake Authorization header.
 * MSW will intercept all requests.
 */
export function createTestAxios(): AxiosInstance {
  return axios.create({
    baseURL: 'https://console.redhat.com',
    headers: {
      Authorization: 'Bearer test-token-for-cli-tests',
      'Content-Type': 'application/json',
    },
  });
}

// ============================================================================
// Mock Notify Function
// ============================================================================

export interface NotifyCall {
  variant: 'success' | 'danger' | 'warning' | 'info';
  title: string;
  description?: string;
}

/**
 * Creates a mock notify function that records all calls.
 */
export function createMockNotify(): { notify: NotifyFn; calls: NotifyCall[] } {
  const calls: NotifyCall[] = [];

  const notify: NotifyFn = (variant, title, description) => {
    calls.push({ variant, title, description });
  };

  return { notify, calls };
}

// ============================================================================
// Test Services
// ============================================================================

export interface TestServices extends AppServices {
  notifyCalls: NotifyCall[];
}

/**
 * Creates test services with a mock notify function.
 */
export function createTestServices(): TestServices {
  const { notify, calls } = createMockNotify();
  return {
    axios: createTestAxios(),
    notify,
    notifyCalls: calls,
  };
}

// ============================================================================
// Test Query Client
// ============================================================================

/**
 * Creates a QueryClient configured for testing.
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
        staleTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// ============================================================================
// Custom Render Function
// ============================================================================

export interface RenderOptions extends Omit<RTLRenderOptions, 'wrapper'> {
  initialEntries?: string[];
  services?: AppServices;
  queryClient?: QueryClient;
  locale?: string;
  messages?: Record<string, string>;
}

export interface RenderResult extends RTLRenderResult {
  queryClient: QueryClient;
  services: TestServices;
  notifyCalls: NotifyCall[];
}

function TestWrapper({
  children,
  services,
  queryClient,
  initialEntries,
  locale,
  messages,
}: {
  children: ReactNode;
  services: AppServices;
  queryClient: QueryClient;
  initialEntries: string[];
  locale: string;
  messages: Record<string, string>;
}): ReactElement {
  return (
    <IntlProvider locale={locale} messages={messages}>
      <ServiceProvider value={services}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={initialEntries} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            {children}
          </MemoryRouter>
        </QueryClientProvider>
      </ServiceProvider>
    </IntlProvider>
  );
}

/**
 * Custom render function for CLI component tests.
 *
 * Wraps the component with:
 * - IntlProvider (locale 'en')
 * - QueryClientProvider (retry: false)
 * - ServiceProvider (test axios + mock notify)
 * - MemoryRouter (accepts initialEntries)
 *
 * @example
 * ```tsx
 * import { render, screen, waitFor } from '../test-utils';
 * import { RolesList } from '../routes/RolesList';
 *
 * test('renders roles list', async () => {
 *   const queryClient = createTestQueryClient();
 *   render(<RolesList queryClient={queryClient} />, {
 *     initialEntries: ['/roles'],
 *     queryClient,
 *   });
 *
 *   await waitFor(() => {
 *     expect(screen.getByText('Test Role 1')).toBeInTheDocument();
 *   });
 * });
 * ```
 */
export function render(
  ui: ReactElement,
  {
    initialEntries = ['/'],
    services: providedServices,
    queryClient: providedQueryClient,
    locale = 'en',
    messages = {},
    ...rtlOptions
  }: RenderOptions = {},
): RenderResult {
  const services = (providedServices as TestServices) ?? createTestServices();
  const queryClient = providedQueryClient ?? createTestQueryClient();

  const wrapper = ({ children }: { children: ReactNode }) => (
    <TestWrapper services={services} queryClient={queryClient} initialEntries={initialEntries} locale={locale} messages={messages}>
      {children}
    </TestWrapper>
  );

  const rtlResult = rtlRender(ui, { wrapper, ...rtlOptions });

  return {
    ...rtlResult,
    queryClient,
    services,
    notifyCalls: services.notifyCalls ?? [],
  };
}

// Re-export from @testing-library/react
export { act, fireEvent, screen, waitFor, within } from '@testing-library/react';

// Re-export MSW server and helpers for custom handlers in tests
export { resetMockData, resetMockDataWithState, server } from './mocks/server';

// Re-export input simulation helpers
export { pressKey, typeText } from './setupTests';

// Re-export status tracking helpers
export { clearLastStatus, getLastStatus } from './setupTests';

// Re-export API request tracking helpers
export { clearTrackedRequests, expectApiCall, getRequestsMatching, getTrackedRequests } from './setupTests';
