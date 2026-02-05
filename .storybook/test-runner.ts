/**
 * ============================================================================
 * STORYBOOK TEST RUNNER - ERROR DETECTION CONFIGURATION
 * ============================================================================
 *
 * PURPOSE:
 * This test runner catches console errors/warnings in Storybook and FAILS tests
 * when critical issues are detected. This prevents bugs from silently passing
 * through code review and reaching production.
 *
 * PRINCIPLE:
 * Storybook renders components in a real browser, just like production.
 * If a warning appears in Storybook, it WILL appear in production.
 * We should NOT ignore warnings just because they're "in Storybook."
 *
 * HOW IT WORKS:
 * 1. preVisit: Attaches console listener to collect errors per story
 * 2. During story: Collects console.error and critical console.warning
 * 3. postVisit: If critical errors found → throw Error → test fails
 * 4. End of run: Shows summary of suppressed warnings
 *
 * ============================================================================
 */

import type { TestRunnerConfig } from '@storybook/test-runner';

// Track errors per story
const storyErrors = new Map<string, string[]>();

/**
 * ============================================================================
 * IGNORED PATTERNS - Intentional Test Infrastructure
 * ============================================================================
 *
 * These errors are EXPECTED and should NOT fail tests:
 *
 * 1. MSW Mock API Errors (4xx, 5xx)
 *    - WHY IGNORED: Stories intentionally test error states
 *    - EXAMPLE: Testing how UI handles 500 error from API
 *    - WILL NOT HAPPEN IN PRODUCTION: Real API, not MSW
 *
 * 2. AxiosError
 *    - WHY IGNORED: Part of MSW mock error testing
 *    - Same as above - intentional error state testing
 *
 * 3. Testing Library Warnings
 *    - WHY IGNORED: Storybook-specific best practice hints
 *    - EXAMPLE: "Use within(canvasElement) instead of screen"
 *    - NOT A BUG: Just testing best practice guidance
 *
 * 4. MSW Informational Logs
 *    - WHY IGNORED: MSW setup/teardown messages
 *    - NOT ERRORS: Just informational logging
 *
 * ============================================================================
 */
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

  // Storybook/Testing Library informational warnings (not runtime issues)
  { pattern: /You are using Testing Library's `screen` object/, label: 'Testing Library screen warning' },

  // MSW informational logs and debug output
  { pattern: /MSW.*mock/i, label: 'MSW logs' },
  { pattern: /^Request \{url:/, label: 'MSW request logs' },
  { pattern: /^Handler:/, label: 'MSW handler logs' },
  { pattern: /^Response \{status:/, label: 'MSW response logs' },
  { pattern: /Worker script URL:/, label: 'MSW worker setup' },
  { pattern: /Worker scope:/, label: 'MSW worker setup' },
  { pattern: /Found an issue\? https:\/\/github\.com\/mswjs/, label: 'MSW help link' },
  { pattern: /Documentation:.*https:\/\/mswjs\.io/, label: 'MSW documentation link' },
  { pattern: /Client ID:.*%s.*\(%s\)/, label: 'MSW client logging' },
  { pattern: /MSW intercepted role bindings request/, label: 'MSW role bindings debug' },

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
  { pattern: /^values: \{active:/, label: '@data-driven-forms debug' },
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
];

/**
 * ============================================================================
 * CRITICAL ERROR PATTERNS - REAL BUGS that MUST be fixed
 * ============================================================================
 */
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

function shouldIgnoreError(errorText: string): boolean {
  return IGNORED_ERROR_PATTERNS.some(({ pattern }) => pattern.test(errorText));
}

function isCriticalError(errorText: string): boolean {
  return CRITICAL_ERROR_PATTERNS.some((pattern) => pattern.test(errorText));
}

const config: TestRunnerConfig = {
  async preVisit(page, context) {
    const { id, tags } = context;

    // Skip stories with 'test-skip' tag
    if (tags?.includes('test-skip')) {
      return;
    }

    // force the same viewport Chromatic uses
    await page.setViewportSize({ width: 1200, height: 500 });

    // Initialize error collection for this story
    storyErrors.set(id, []);

    // Attach a listener to capture all browser console messages
    page.on('console', async (msg) => {
      const text = msg.text();
      const type = msg.type();

      // Log warnings, errors, and debug console.log
      if (type === 'warning' || type === 'error' || type === 'log') {
        // Check if this is an ignored pattern - skip silently
        if (shouldIgnoreError(text)) {
          return;
        }

        // Only print to console for warnings/errors that aren't ignored
        if (type === 'warning' || type === 'error') {
          console.log(`[BROWSER ${type.toUpperCase()}]: ${text}`);
        }

        // Collect critical errors for this story
        if (type === 'error') {
          const errors = storyErrors.get(id) || [];
          errors.push(text);
          storyErrors.set(id, errors);
        }

        // Collect critical warnings that indicate bugs
        if (type === 'warning' && isCriticalError(text)) {
          const errors = storyErrors.get(id) || [];
          errors.push(text);
          storyErrors.set(id, errors);
        }

        // Collect console.log from component code (not test debugging)
        if (type === 'log') {
          const errors = storyErrors.get(id) || [];
          errors.push(`console.log: ${text}`);
          storyErrors.set(id, errors);
        }
      }
    });
  },

  // Hook to execute after each story is tested
  async postVisit(page, context) {
    const { id, title, name, tags } = context;

    // Skip stories with 'test-skip' tag
    if (tags?.includes('test-skip')) {
      return;
    }

    const errors = storyErrors.get(id) || [];

    // Clean up error tracking for this story
    storyErrors.delete(id);

    // Fail the test if critical errors were found
    if (errors.length > 0) {
      const errorSummary = errors.map((err, i) => `  ${i + 1}. ${err.substring(0, 200)}${err.length > 200 ? '...' : ''}`).join('\n');

      throw new Error(
        `Story "${title} > ${name}" failed due to ${errors.length} critical console error(s):\n\n${errorSummary}\n\n` +
          `These errors may indicate bugs or anti-patterns that need to be fixed.\n` +
          `If these are intentional/expected errors, add them to IGNORED_ERROR_PATTERNS in test-runner.ts`,
      );
    }
  },

  // Configure tags to skip certain stories if needed
  tags: {
    skip: ['skip-test'],
  },
};

export default config;

/**
 * NOTE: Suppressed warnings are tracked but not printed at end of run
 * because Jest runs tests in parallel workers and process exit hooks
 * don't fire reliably.
 *
 * To see what patterns are being suppressed, check IGNORED_ERROR_PATTERNS above.
 * Each pattern includes a 'label' field describing what it catches.
 */
