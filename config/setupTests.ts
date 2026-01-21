/**
 * Vitest Test Setup
 *
 * Global test configuration for all tests.
 */

import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import { TextDecoder, TextEncoder } from 'util';

// ============================================================================
// Environment Variables
// ============================================================================

process.env.BASE_PATH = '/api';

// ============================================================================
// Mock Data
// ============================================================================

export const entitlementsMock = {
  bundle1: {
    is_entitled: false,
    is_trial: false,
  },
  bundle2: {
    is_entitled: true,
    is_trial: false,
  },
};

export const getUserMock = {
  entitlements: { ...entitlementsMock },
  identity: { user: { is_org_admin: true } },
};

// ============================================================================
// Global Mocks
// ============================================================================

// Mock insights chrome object (Red Hat Console environment)
(globalThis as Record<string, unknown>).insights = {
  chrome: {
    auth: {
      getUser: () => new Promise((res) => res(getUserMock)),
    },
    appNavClick: () => Promise.resolve(),
    getUserPermissions: () => Promise.resolve([]),
    isBeta: () => true,
    isProd: () => true,
    getEnvironment: () => 'test',
    appAction: () => {},
    appObjectId: () => {},
  },
};

// Mock scrollTo
Element.prototype.scrollTo = () => {};

// Mock matchMedia
(globalThis as Record<string, unknown>).matchMedia =
  (globalThis as Record<string, unknown>).matchMedia ||
  function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {},
    };
  };

// TextEncoder/TextDecoder polyfill
Object.assign(globalThis, { TextDecoder, TextEncoder });

// ============================================================================
// Module Mocks
// ============================================================================

// Mock Unleash feature flags
vi.mock('@unleash/proxy-client-react', () => ({
  __esModule: true,
  useFlag: () => false,
  useFlagsStatus: () => ({ flagsReady: true, flagsError: null }),
  useUnleashContext: () => ({ updateContext: vi.fn() }),
  FlagProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock CSS/SCSS imports
vi.mock('*.scss', () => ({}));
vi.mock('*.css', () => ({}));
