/**
 * CLI Test Setup for Vitest
 *
 * Configures test environment for CLI tests with input simulation support.
 */

import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { server } from './mocks/server';

// ============================================================================
// Input Simulation System
// ============================================================================

type InputHandler = (input: string, key: KeyInfo) => void;

interface KeyInfo {
  upArrow: boolean;
  downArrow: boolean;
  leftArrow: boolean;
  rightArrow: boolean;
  return: boolean;
  escape: boolean;
  tab: boolean;
  backspace: boolean;
  delete: boolean;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
}

// Store all registered input handlers
let inputHandlers: InputHandler[] = [];

// Reset handlers between tests
beforeEach(() => {
  inputHandlers = [];
});

/**
 * Simulate user pressing a key in the CLI
 */
export function pressKey(key: string): void {
  const keyInfo: KeyInfo = {
    upArrow: key === 'up',
    downArrow: key === 'down',
    leftArrow: key === 'left',
    rightArrow: key === 'right',
    return: key === 'enter' || key === 'return',
    escape: key === 'escape' || key === 'esc',
    tab: key === 'tab',
    backspace: key === 'backspace',
    delete: key === 'delete',
    ctrl: false,
    meta: false,
    shift: false,
  };

  // For regular character keys, pass the character
  const input =
    keyInfo.return ||
    keyInfo.escape ||
    keyInfo.upArrow ||
    keyInfo.downArrow ||
    keyInfo.leftArrow ||
    keyInfo.rightArrow ||
    keyInfo.tab ||
    keyInfo.backspace ||
    keyInfo.delete
      ? ''
      : key;

  // Call all registered handlers
  inputHandlers.forEach((handler) => handler(input, keyInfo));
}

/**
 * Type a string character by character
 */
export function typeText(text: string): void {
  for (const char of text) {
    pressKey(char);
  }
}

// ============================================================================
// MSW Setup with Request Tracking
// ============================================================================

interface TrackedRequest {
  method: string;
  url: string;
  body?: unknown;
  timestamp: number;
}

let trackedRequests: TrackedRequest[] = [];

/**
 * Get all API requests made since the last reset
 */
export function getTrackedRequests(): TrackedRequest[] {
  return [...trackedRequests];
}

/**
 * Get requests matching a pattern
 */
export function getRequestsMatching(method: string, urlPattern: string | RegExp): TrackedRequest[] {
  return trackedRequests.filter((req) => {
    const methodMatches = req.method.toUpperCase() === method.toUpperCase();
    const urlMatches = typeof urlPattern === 'string' ? req.url.includes(urlPattern) : urlPattern.test(req.url);
    return methodMatches && urlMatches;
  });
}

/**
 * Assert that a specific API call was made
 */
export function expectApiCall(method: string, urlPattern: string | RegExp, options?: { count?: number }): void {
  const matching = getRequestsMatching(method, urlPattern);
  const expectedCount = options?.count ?? 1;

  if (matching.length !== expectedCount) {
    const allUrls = trackedRequests.map((r) => `${r.method} ${r.url}`).join('\n  ');
    throw new Error(
      `Expected ${expectedCount} ${method} request(s) matching "${urlPattern}", found ${matching.length}.\n` +
        `All requests:\n  ${allUrls || '(none)'}`,
    );
  }
}

/**
 * Clear tracked requests (called automatically between tests)
 */
export function clearTrackedRequests(): void {
  trackedRequests = [];
}

beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'warn',
  });

  // Track all requests using MSW's lifecycle events
  server.events.on('request:start', async ({ request }) => {
    let body: unknown = undefined;
    try {
      const cloned = request.clone();
      const text = await cloned.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch {
      // Ignore parse errors for non-JSON bodies
    }

    trackedRequests.push({
      method: request.method,
      url: request.url,
      body,
      timestamp: Date.now(),
    });
  });
});

afterEach(() => {
  server.resetHandlers();
  clearTrackedRequests();
});

afterAll(() => {
  server.close();
});

// ============================================================================
// Ink Component Mocks
// ============================================================================

// Ink-specific props that should NOT be passed to DOM elements
const INK_PROPS = new Set([
  // Layout
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'margin',
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'padding',
  'flexDirection',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'flexWrap',
  'alignItems',
  'alignSelf',
  'justifyContent',
  'gap',
  'columnGap',
  'rowGap',
  'width',
  'height',
  'minWidth',
  'minHeight',
  'borderStyle',
  'borderColor',
  'overflowX',
  'overflowY',
  'overflow',
  'display',
  // Text styling
  'bold',
  'italic',
  'underline',
  'strikethrough',
  'inverse',
  'wrap',
  'dimColor',
  'backgroundColor',
  'color',
]);

// Filter out Ink-specific props before passing to DOM
function filterInkProps(props: Record<string, unknown>): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (!INK_PROPS.has(key)) {
      filtered[key] = value;
    }
  }
  return filtered;
}

vi.mock('ink', () => ({
  Box: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'ink-box', ...filterInkProps(props) }, children);
  },
  Text: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => {
    const React = require('react');
    return React.createElement('span', { 'data-testid': 'ink-text', ...filterInkProps(props) }, children);
  },
  useInput: (handler: InputHandler) => {
    // Register the handler so tests can trigger it
    const React = require('react');
    React.useEffect(() => {
      inputHandlers.push(handler);
      return () => {
        const idx = inputHandlers.indexOf(handler);
        if (idx >= 0) inputHandlers.splice(idx, 1);
      };
    }, [handler]);
  },
  useApp: () => ({ exit: vi.fn() }),
  useFocus: () => ({ isFocused: true }),
  useFocusManager: () => ({ focusNext: vi.fn(), focusPrevious: vi.fn() }),
}));

vi.mock('ink-text-input', () => ({
  default: ({ value, onChange, onSubmit }: { value: string; onChange: (value: string) => void; onSubmit?: () => void }) => {
    const React = require('react');
    return React.createElement('input', {
      'data-testid': 'ink-text-input',
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value),
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && onSubmit) onSubmit();
      },
    });
  },
}));

// ============================================================================
// Status Message Tracking
// ============================================================================

interface StatusMessage {
  message: string;
  type: string;
}

let lastStatus: StatusMessage | null = null;

/**
 * Get the last status message set by a component
 */
export function getLastStatus(): StatusMessage | null {
  return lastStatus;
}

/**
 * Clear the last status message (called automatically between tests)
 */
export function clearLastStatus(): void {
  lastStatus = null;
}

// Mock the AppLayout - use a persistent setStatus function
const mockSetStatus = vi.fn((status: StatusMessage) => {
  lastStatus = status;
  // Keep globalThis for backward compatibility with existing tests
  (globalThis as Record<string, unknown>).__lastStatus = status;
});

// Reset status between tests
beforeEach(() => {
  clearLastStatus();
});

vi.mock('./layouts/AppLayout', () => {
  return {
    colors: {
      primary: '#00A4FF',
      success: '#3E8635',
      danger: '#C9190B',
      warning: '#F0AB00',
      muted: '#6A6E73',
      highlight: '#06C',
      cyan: '#00BCD4',
      purple: '#8A508F',
    },
    useStatus: () => ({
      setStatus: mockSetStatus,
      status: { message: null, type: 'info' },
    }),
    useInputFocus: () => ({
      isInputFocused: false,
      setInputFocused: () => {},
    }),
    AppLayout: ({ children }: { children: React.ReactNode }) => {
      const React = require('react');
      return React.createElement('div', { 'data-testid': 'app-layout' }, children);
    },
  };
});

// pressKey and typeText are exported inline above
