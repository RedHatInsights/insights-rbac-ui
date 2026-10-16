/**
 * ============================================================================
 * STORYBOOK VITEST CONSOLE GUARD
 * ============================================================================
 *
 * Ported from the retired jest-based `@storybook/test-runner` harness
 * (`.storybook/test-runner.ts`, pre-migration). Same policy, new runtime:
 * instead of a playwright `page.on('console')` listener in Node, we wrap the
 * browser console directly — the test, the story, and the app share one
 * iframe, so every console call flows through here.
 *
 * POLICY (unchanged):
 * - console.error                       → fails the story
 * - console.warn matching CRITICAL_*    → fails the story
 * - console.log (unignored)             → fails the story (noise policy)
 * - anything matching IGNORED_*         → suppressed silently
 *
 * NOT ported: browser-generated network errors ("Failed to load resource")
 * never reach the JS console API in this runtime. Every network-error
 * pattern in IGNORED_ERROR_PATTERNS is kept for documentation; MSW mock
 * 4xx/5xx responses no longer need it.
 *
 * HOW TO WORK WITH FAILURES:
 * Real bug → fix the component. Intentional/expected output → add the
 * pattern to IGNORED_ERROR_PATTERNS below, with a label saying why.
 * ============================================================================
 */

import { afterEach, beforeEach } from 'vitest';

const IGNORED_ERROR_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  // ═══════════════════════════════════════════════════════════════════════════
  // INTENTIONAL TEST INFRASTRUCTURE - These are expected and correct
  // ═══════════════════════════════════════════════════════════════════════════

  // MSW mock API errors (intentional for testing error states)
  { pattern: /Failed to load resource.*status of (4\d{2}|5\d{2})/, label: 'MSW HTTP errors (intentional)' },
  { pattern: /Failed to load resource.*net::ERR_FAILED/, label: 'Network failures (MSW)' },
  { pattern: /AxiosError/, label: 'Axios errors (MSW mock)' },
  { pattern: /SyntaxError: Unexpected token.*Not Found.*is not valid JSON/, label: '404 HTML responses' },

  // Kessel journey tests - Inventory route errors (intentional for testing navigation targets)
  { pattern: /No routes matched location "\/insights\/inventory\/workspaces\//, label: 'Inventory routes (intentional)' },

  // OrganizationManagement error state testing (intentional for testing error handling)
  {
    pattern: /OrganizationManagement: (Failed to fetch user data|No user data received|User identity not available)/,
    label: 'OrganizationManagement error testing (intentional)',
  },

  // Play function assertion errors re-logged to console.error by Storybook's runtime.
  // The play function itself already throws — the test runner reports that failure.
  // Without this ignore, postVisit double-counts the error with a less useful message.
  { pattern: /HtmlElementTypeError/, label: 'jest-dom assertion (play function)' },
  { pattern: /TestingLibraryElementError/, label: 'testing-library assertion (play function)' },

  // Storybook/Testing Library informational warnings (not runtime issues)
  { pattern: /You are using Testing Library's `screen` object/, label: 'Testing Library screen warning' },

  // formatjs falls back to defaultMessage for keys missing from partial locale catalogs
  // (FEO handoff). The old runner never saw these: `storybook build` is a production bundle,
  // and formatjs only logs them when NODE_ENV !== 'production'. Vitest runs test-mode.
  { pattern: /\[@formatjs\/intl Error MISSING_TRANSLATION\]/, label: 'Missing translation (partial catalog, defaultMessage fallback)' },
  { pattern: /\[@formatjs\/intl Error MISSING_DATA\]/, label: 'Unknown locale data (tested fallback behavior)' },

  // React Router dev-mode diagnostics. The retired runner tested production builds, where
  // react-router strips these entirely; vitest runs test-mode. Unmatched locations fall
  // through to the catch-all <Navigate>. NOTE: handleClose in RoutedOrgRoleAccessModal
  // navigates to org-management-group, which has no <Route> — latent routing gap, tracked
  // as a follow-up; production falls back to the my-access redirect.
  { pattern: /No routes matched location/, label: 'React Router dev diagnostic (stripped in production builds)' },

  // MSW informational logs and debug output
  { pattern: /MSW.*mock/i, label: 'MSW logs' },
  { pattern: /^Request \{/, label: 'MSW request logs' },
  { pattern: /^Handler:/, label: 'MSW handler logs' },
  { pattern: /^Response \{/, label: 'MSW response logs' },
  { pattern: /Worker script URL:/, label: 'MSW worker setup' },
  { pattern: /Worker scope:/, label: 'MSW worker setup' },
  { pattern: /Found an issue\? https:\/\/github\.com\/mswjs/, label: 'MSW help link' },
  { pattern: /Documentation:.*https:\/\/mswjs\.io/, label: 'MSW documentation link' },
  { pattern: /Client ID:/, label: 'MSW client logging' },

  // Storybook test debugging console.log (allowed in play functions)
  { pattern: /^SB:/, label: 'Storybook test debug' },

  // Legacy test debug patterns (to be converted to SB: prefix)
  { pattern: /^[🔍🚀📊].*Navigating/, label: 'Navigation debug logs' },
  { pattern: /^[🔍🚀📊].*Submitting/, label: 'Form submission logs' },
  { pattern: /^Users added:.*and removed:/, label: 'User management logs' },
  { pattern: /^Service accounts added:.*and removed:/, label: 'Service account logs' },
  { pattern: /^Deleting.*from user groups/, label: 'Deletion logs' },

  // ═══════════════════════════════════════════════════════════════════════════
  // REAL BUGS - These should be fixed incrementally
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * BUG: Role bindings API not mocked in some stories
   * WHERE: Stories that don't mock /api/rbac/v2/role-bindings/by-subject
   * HOW TO FIX: Add MSW handler for role-bindings endpoint to affected stories:
   *   http.get(`${RBAC_API_BASE_V2}/role-bindings/by-subject`, () =>
   *     HttpResponse.json({ data: [] })
   *   )
   */
  {
    pattern: /intercepted a request without a matching request handler.*\/api\/rbac\/v2\/role-bindings\/by-subject/,
    label: 'Role bindings unmocked',
  },
  { pattern: /Error fetching role bindings.*Cannot read properties of undefined/, label: 'Role bindings fetch error' },

  /**
   * BUG: Empty <Th> elements missing accessible names
   * WHERE: Tables with action columns that have empty headers
   * HOW TO FIX: Add screenReaderText prop to empty Th elements:
   *   <Th screenReaderText="Actions" />
   * FIXED IN: src/features/users/components/GroupsNestedTable.tsx
   * REMAINING: Search for "<Th />" or "<Th></Th>" and add screenReaderText
   */
  { pattern: /Th: Table headers must have an accessible name/, label: 'Th accessibility (fix incrementally)' },

  /**
   * BUG: React key prop being accessed as a prop
   * WHERE: Components spreading props that include key
   * HOW TO FIX: Don't spread props containing key. Extract key separately:
   *   const { key, ...rest } = props;
   *   <Component key={key} {...rest} />
   */
  { pattern: /Warning:.*key.*is not a prop.*Trying to access it will result in.*undefined.*being returned/, label: 'React key access warning' },

  /**
   * EXTERNAL: PatternFly DataViewCheckboxFilter key warning
   * WHERE: AddRolePermissionWizard filters using ToolbarFilter
   * UPSTREAM: https://github.com/patternfly/react-data-view
   * WORKAROUND: None, issue is in PatternFly library
   */
  { pattern: /Each child in a list should have a unique "key" prop/, label: 'Duplicate key warning (PatternFly ToolbarFilter)' },

  /**
   * BUG: Controlled/uncontrolled input switching
   * WHERE: Form inputs that start undefined then get a value
   * HOW TO FIX: Initialize form values to empty string instead of undefined:
   *   const [value, setValue] = useState('');  // not useState()
   */
  { pattern: /Warning: A component is changing an uncontrolled input to be controlled/, label: 'Controlled input warning' },

  /**
   * BUG: DOM nesting violations (div inside p, p inside p)
   * WHERE: Components rendering Skeleton inside DescriptionListDescription or subtitle
   * HOW TO FIX: Use <span> or <div> wrapper instead of <p> for content that may contain blocks:
   *   <DescriptionListDescription>
   *     <div>{isLoading ? <Skeleton /> : value}</div>  // not inline
   *   </DescriptionListDescription>
   */
  { pattern: /validateDOMNesting.*<div>.*p/, label: 'DOM nesting: div in p' },
  { pattern: /validateDOMNesting.*<p>.*p/, label: 'DOM nesting: p in p' },

  /**
   * BUG: Selector returning new object references on every call
   * WHERE: Redux selectors or React Query select functions
   * HOW TO FIX: Memoize selectors properly or use stable references:
   *   // Bad: select: (data) => ({ ...data, transformed: true })
   *   // Good: Use useMemo or createSelector for derived data
   */
  { pattern: /Selector unknown returned a different result/, label: 'Selector instability' },

  // ═══════════════════════════════════════════════════════════════════════════
  // EXTERNAL LIBRARY ISSUES - Can't fix directly, track for upgrades
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * EXTERNAL: @data-driven-forms v4.x issues
   * UPSTREAM: https://github.com/data-driven-forms/react-forms
   * WORKAROUND: None, these come from the library itself
   * TRACK: Check if fixed in newer versions during dependency updates
   */
  { pattern: /^values: \{/, label: '@data-driven-forms debug' },
  { pattern: /FormWrapper.*FormTemplate/, label: '@data-driven-forms PropTypes' },
  { pattern: /Cannot update a component.*TextField/, label: '@data-driven-forms TextField' },
  { pattern: /Cannot update a component.*Textarea/, label: '@data-driven-forms Textarea' },
  { pattern: /disableforwardjumping/i, label: '@data-driven-forms custom prop' },
  { pattern: /labelicon/i, label: '@data-driven-forms custom prop' },

  /**
   * EXTERNAL: @patternfly/react-component-groups ResponsiveActions
   * UPSTREAM: https://github.com/patternfly/react-component-groups
   * WORKAROUND: None, issue is in the library
   * TRACK: Check if fixed in newer versions during dependency updates
   */
  { pattern: /`key` is not a prop.*ResponsiveAction/, label: 'ResponsiveAction key warning' },

  /**
   * EXTERNAL: MSW Storybook addon deprecation warning
   * UPSTREAM: https://github.com/mswjs/msw-storybook-addon
   * HOW TO FIX: Update to msw-storybook-addon v2.x when ready
   */
  { pattern: /\[msw-storybook-addon\].*deprecated/, label: 'MSW addon deprecation' },

  /**
   * EXTERNAL: React unrecognized DOM props from external components
   * WHERE: @data-driven-forms and other libraries passing custom props
   * WORKAROUND: None, these come from external libraries
   */
  { pattern: /React does not recognize the .* prop on a DOM element/, label: 'Unrecognized DOM prop' },

  // ═══════════════════════════════════════════════════════════════════════════
  // INFORMATIONAL - Not bugs, just noise
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * INFO: React Router v7 migration warnings
   * WHEN TO ADDRESS: When upgrading to React Router v7
   * DOC: https://reactrouter.com/en/main/upgrading/v6
   */
  { pattern: /React Router Future Flag Warning/, label: 'React Router v7 migration' },

  /**
   * INFO: Grant Access Wizard has multiple "select role" elements
   * WHY: Wizard navigation and form both contain this text
   * NOT A BUG: Test should use more specific selectors
   */
  { pattern: /TestingLibraryElementError: Found multiple elements with the text.*select role/i, label: 'Multiple select role elements' },

  /**
   * EXTERNAL: React act() warning in test environment
   * WHERE: Stories with async state updates during Playwright evaluation
   * WORKAROUND: None — Storybook test-runner doesn't configure act() support
   */
  { pattern: /The current testing environment is not configured to support act/, label: 'React act() warning' },

  /**
   * EXTERNAL: Storybook Story Store deprecation warning
   * WHERE: Stories that access the deprecated Story Store API
   * WORKAROUND: Will be resolved when upgrading to Storybook 9.x
   */
  { pattern: /Accessing the Story Store is deprecated/, label: 'Storybook Story Store deprecation' },
];
const CRITICAL_ERROR_PATTERNS = [
  // Always critical - these indicate real bugs
  /Warning: Failed.*type:/,
  /No routes matched location/, // Router issues (except intentionally ignored ones)
  /@formatjs\/intl Error FORMAT_ERROR/, // i18n errors
  /result function returned its own inputs without modification/, // Redux selector issues
  /You should call navigate\(\) in a React\.useEffect\(\)/, // Navigation during render

  // JavaScript runtime errors - always critical
  /Uncaught/,
  /TypeError/,
  /ReferenceError/,
  /Cannot read propert/,
  /is not a function/,

  // React anti-patterns - enforced on PatternFly 6
  /Warning: A props object containing a "key" prop is being spread/,
  /Warning: Encountered two children with the same key/,
  /Warning: Each child in a list should have a unique "key" prop/,
  /Warning: validateDOMNesting/,
  /Warning: React does not recognize.*prop on a DOM element/,
  /Warning: Cannot update a component.*while rendering a different component/,
  /Selector.*returned a different result/,
];

// ============================================================================
// Collection
// ============================================================================

type Level = 'error' | 'warn' | 'log';

let collected: string[] = [];
let originals: Record<Level, (...args: unknown[]) => void> | undefined;

function formatArg(arg: unknown): string {
  if (typeof arg === 'string') return arg;
  if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
  try {
    return JSON.stringify(arg);
  } catch {
    return String(arg);
  }
}

function shouldFailStory(text: string, level: Level): boolean {
  if (IGNORED_ERROR_PATTERNS.some(({ pattern }) => pattern.test(text))) return false;
  if (level === 'error') return true;
  if (level === 'warn') return CRITICAL_ERROR_PATTERNS.some((pattern) => pattern.test(text));
  return true; // console.log: fail unless ignored (noise policy)
}

function record(level: Level, args: unknown[]): void {
  const text = args.map(formatArg).join(' ');
  if (shouldFailStory(text, level)) {
    collected.push(text);
  } else if (level !== 'log') {
    // Keep the old harness's visibility for non-ignored warnings/errors.
    originals?.[level](`[BROWSER ${level.toUpperCase()}]: ${text}`);
  }
}

beforeEach(() => {
  collected = [];
  originals = {
    error: console.error.bind(console),
    warn: console.warn.bind(console),
    log: console.log.bind(console),
  };
  console.error = (...args: unknown[]) => record('error', args);
  console.warn = (...args: unknown[]) => record('warn', args);
  console.log = (...args: unknown[]) => record('log', args);
});

afterEach((context) => {
  const task = context as unknown as { task?: { name?: string }; name?: string };
  const name = task?.task?.name ?? task?.name ?? 'story';
  // Restore before asserting so the failure message itself can use console.
  if (originals) {
    console.error = originals.error;
    console.warn = originals.warn;
    console.log = originals.log;
    originals = undefined;
  }

  if (collected.length > 0) {
    const errorSummary = collected.map((err, i) => `  ${i + 1}. ${err.substring(0, 200)}${err.length > 200 ? '...' : ''}`).join('\n');

    throw new Error(
      `Story "${name}" failed due to ${collected.length} critical console error(s):\n\n${errorSummary}\n\n` +
        `These errors may indicate bugs or anti-patterns that need to be fixed.\n` +
        `If these are intentional/expected errors, add them to IGNORED_ERROR_PATTERNS in .storybook/vitest.setup.ts`,
    );
  }
});
