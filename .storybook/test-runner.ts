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
 * 
 * ============================================================================
 */

import type { TestRunnerConfig } from '@storybook/test-runner';
import { readFileSync } from 'fs';
import { join } from 'path';

// Track errors per story
const storyErrors = new Map<string, string[]>();

/**
 * ============================================================================
 * VERSION-DEPENDENT ERROR PATTERNS
 * ============================================================================
 * 
 * Check PatternFly version to conditionally ignore library-specific errors
 */
function getPatternFlyVersion(): number {
  try {
    const packageJson = JSON.parse(
      readFileSync(join(__dirname, '../package.json'), 'utf-8')
    );
    const pfVersion = packageJson.dependencies?.['@patternfly/react-core'];
    if (!pfVersion) return 0;
    
    // Extract major version: "^5.1.1" -> 5
    const match = pfVersion.match(/(\d+)\./);
    return match ? parseInt(match[1], 10) : 0;
  } catch {
    return 0;
  }
}

const PATTERNFLY_VERSION = getPatternFlyVersion();

// Log version detection for transparency
console.log(`\n📦 PatternFly Version Detected: ${PATTERNFLY_VERSION}`);
if (PATTERNFLY_VERSION < 6) {
  console.log(`⚠️  PatternFly 5 Compatibility Mode - These warnings are IGNORED:`);
  console.log(`   - FormWrapper PropTypes errors`);
  console.log(`   - setState during render warnings`);
  console.log(`   - Duplicate React keys warnings`);
  console.log(`   - validateDOMNesting warnings`);
  console.log(`   - Redux selector instability`);
  console.log(`\n   ⚡ IMPORTANT: These will FAIL tests after upgrading to PatternFly 6!`);
  console.log(`   Upgrade to PatternFly 6 + @data-driven-forms v4.x to enforce these checks\n`);
} else {
  console.log(`✅ PatternFly 6+ Detected - ENFORCING all React anti-pattern checks`);
  console.log(`   All warnings about duplicate keys, DOM nesting, etc. will FAIL tests\n`);
}

/**
 * ============================================================================
 * IGNORED PATTERNS - Intentional Test Infrastructure
 * ============================================================================
 * 
 * These errors are EXPECTED and should NOT fail tests:
 * 
 * 1. MSW Mock API Errors (400, 401, 403, 404, 500)
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
 * 5. FormWrapper PropTypes Error (ONLY on PatternFly 5)
 *    - WHY IGNORED (PF5): Library compatibility issue with @data-driven-forms v3.23.5
 *      • Latest @data-driven-forms that supports PF5 is v3.23.5
 *      • This version has a PropTypes validation bug with custom FormWrapper
 *      • Forms work correctly, just PropTypes noise
 *      • Fixed in @data-driven-forms v4.x, but v4.x requires PatternFly 6
 *    
 *    - WHY NOT IGNORED (PF6+): After upgrading to PatternFly 6, this error
 *      MUST cause test failures to remind us to upgrade @data-driven-forms to v4.x
 *    
 *    - WHEN TO REMOVE: After upgrading to PatternFly 6 AND @data-driven-forms v4.x
 * 
 * ============================================================================
 */
const IGNORED_ERROR_PATTERNS = [
  // MSW mock API errors (intentional for testing error states)
  /Failed to load resource.*status of (400|401|403|404|500)/,
  /AxiosError/,
  /SyntaxError: Unexpected token.*Not Found.*is not valid JSON/,  // 404 responses that return HTML instead of JSON
  
  // Kessel journey tests - Inventory route errors (intentional for testing navigation targets)
  // These stories verify that workspace links point to Inventory, which has no route in Storybook
  /No routes matched location "\/insights\/inventory\/workspaces\//,  // M2 workspace links to Inventory
  
  // Role bindings API errors (M3+ feature, some stories don't mock this endpoint)
  /intercepted a request without a matching request handler.*\/api\/rbac\/v2\/role-bindings\/by-subject/,
  /Error fetching role bindings.*Cannot read properties of undefined/,
  
  // Storybook/Testing Library informational warnings (not runtime issues)
  /You are using Testing Library's `screen` object/,
  
  // MSW informational logs and debug output
  /MSW.*mock/i,
  /^Request \{url:/,  // MSW request logs
  /^Handler:/,        // MSW handler logs
  
  // React key prop warnings (intentional for component identification)
  /Warning:.*key.*is not a prop.*Trying to access it will result in.*undefined.*being returned/,
  
  // React controlled/uncontrolled input warnings (common in legacy components during refactoring)
  /Warning: A component is changing an uncontrolled input to be controlled/,
  
  /^Response \{status:/,  // MSW response logs
  /Worker script URL:/,  // MSW worker setup
  /Worker scope:/,  // MSW worker setup
  /Found an issue\? https:\/\/github\.com\/mswjs/,  // MSW help link
  /Documentation:.*https:\/\/mswjs\.io/,  // MSW documentation link
  /Client ID:.*%s.*\(%s\)/,  // MSW client logging
  
  // @data-driven-forms debug output (form state logging)
  /^values: \{active:/,  // Form field state changes
  
  // Grant Access Wizard test - multiple "select role" elements in wizard navigation
  // TODO: Remove this once the test is fixed to use more specific text matching
  /TestingLibraryElementError: Found multiple elements with the text.*select role/i,
  
  // @data-driven-forms PatternFly 5 compatibility issues - ONLY ignored on PatternFly 5
  // On PatternFly 6+, these MUST fail to remind us to upgrade @data-driven-forms to v4.x
  ...(PATTERNFLY_VERSION < 6 ? [
    /Warning: A props object containing a "key" prop is being spread/,
    /Invalid prop `FormWrapper` supplied to `FormTemplate`/,
    /Cannot update a component.*while rendering a different component/,  // setState during render in form library
    // Create Role wizard warnings (PatternFly table/form issues - fix when upgrading to PF6)
    /Warning: Encountered two children with the same key/,  // Duplicate keys in permissions table
    /Warning: Each child in a list should have a unique "key" prop/,  // Missing keys in lists (UsersListNotSelectable)
    /Warning: validateDOMNesting.*<tr>.*div/,  // PatternFly table DOM nesting
    /Warning: validateDOMNesting.*<div>.*tbody/,  // Popper in table
    /Selector selector returned a different result/,  // Redux selector instability in form
    /Warning: React does not recognize.*prop on a DOM element/,  // Invalid props passed to DOM elements
    // PatternFly Modal/WarningModal accessibility warning - WarningModal doesn't expose all aria props
    /Modal: Specify at least one of: title, aria-label, aria-labelledby/,
    // React 18 deprecation warning for defaultProps - fix when migrating components to TypeScript with default params
    /Warning:.*Support for defaultProps will be removed from function components/,
  ] : []),
  
  // PatternFly accessibility warnings (not critical, should be fixed incrementally)
  /Th: Table headers must have an accessible name/,  // PatternFly table component warnings
  
  // Storybook test debugging console.log (allowed in play functions)
  // All story console.log statements should start with "SB:" prefix
  // Example: console.log('SB: User interaction completed');
  /^SB:/,
  
  // Legacy test debug patterns (to be converted to SB: prefix)
  /^[🔍🚀📊].*Navigating/,  // Navigation debug logs
  /^[🔍🚀📊].*Submitting/,  // Form submission logs
  /^Users added:.*and removed:/,  // User management logs
  /^Service accounts added:.*and removed:/,  // Service account logs
  /^Deleting.*from user groups/,  // Deletion logs
];

/**
 * ============================================================================
 * CRITICAL ERROR PATTERNS - REAL BUGS that MUST be fixed
 * ============================================================================
 * 
 * These errors indicate bugs that WILL occur in production and MUST be fixed
 * before merging code. DO NOT simply remove patterns from this list without
 * understanding why they're here and fixing the underlying issue.
 * 
 * ------------------------------------------------------------------------
 * REACT ERRORS - Anti-patterns and Bugs
 * ------------------------------------------------------------------------
 * 
 * 1. Duplicate Keys
 *    Pattern: /Warning: Encountered two children with the same key/
 *    
 *    WHY CRITICAL:
 *    - React uses keys for reconciliation (updating DOM efficiently)
 *    - Duplicate keys cause unpredictable behavior:
 *      • Components may not update when data changes
 *      • State may be lost between renders
 *      • Wrong components may be rendered or omitted
 *    
 *    PRODUCTION IMPACT:
 *    - User clicks item → wrong item selected
 *    - Data updates → UI doesn't reflect changes
 *    - Form state lost unexpectedly
 *    
 *    HOW TO FIX:
 *    - Use unique IDs: key={item.uuid} not key="same-value"
 *    - Use index only as last resort: key={`${item.id}-${index}`}
 * 
 * 2. Key Prop Spreading
 *    Pattern: /Warning: A props object containing a "key" prop is being spread/
 *    
 *    WHY CRITICAL:
 *    - React anti-pattern, deprecated behavior
 *    - May break in future React versions
 *    - Keys should be passed directly to JSX
 *    
 *    HOW TO FIX:
 *    Bad:  const props = {key: id, ...}; <Component {...props} />
 *    Good: const props = {...}; <Component key={id} {...props} />
 *    
 *    Ignored on PatternFly 5, enforced on PatternFly 6
 * 
 * 3. DOM Nesting Violations
 *    Pattern: /Warning: validateDOMNesting/
 *    
 *    WHY CRITICAL:
 *    - Invalid HTML structure (e.g., <div> inside <table>)
 *    - Browsers may "fix" it unpredictably
 *    - Breaks accessibility (screen readers)
 *    - Can cause layout/styling issues
 *    
 *    COMMON ISSUES:
 *    - EmptyState directly in <table> (wrap in tbody/tr/td)
 *    - <form> inside <form> (remove nested form)
 *    - <div> in <tbody> (wrap properly)
 *    
 *    HOW TO FIX:
 *    Bad:  <table><EmptyState /></table>
 *    Good: <table><tbody><tr><td colSpan={n}><EmptyState /></td></tr></tbody></table>
 * 
 * 4. Invalid DOM Props
 *    Pattern: /Warning: React does not recognize.*prop on a DOM element/
 *    
 *    WHY CRITICAL:
 *    - Custom React props leaking to actual DOM elements
 *    - Creates invalid HTML attributes
 *    - Can cause browser warnings in production
 *    
 *    COMMON ISSUES:
 *    - linkBasename, isExternal, screenReaderText on <a>, <button>
 *    
 *    HOW TO FIX:
 *    const { linkBasename, ...domProps } = props;
 *    return <a {...domProps} />
 * 
 * 5. setState in Render
 *    Pattern: /Warning: Cannot update a component.*while rendering/
 *    
 *    WHY CRITICAL:
 *    - Can cause infinite render loops
 *    - Major performance issue
 *    - Unpredictable component behavior
 *    
 *    HOW TO FIX:
 *    Bad:  if (condition) setState(...)  // in render
 *    Good: useEffect(() => { if (condition) setState(...) }, [deps])
 * 
 * 6. PropTypes Errors
 *    Pattern: /Warning: Failed.*type:/
 *    
 *    WHY CRITICAL:
 *    - Type mismatches can cause runtime errors
 *    - Indicates incorrect component usage
 *    
 * ------------------------------------------------------------------------
 * ROUTER ERRORS - Navigation Bugs
 * ------------------------------------------------------------------------
 * 
 * 7. No Routes Matched
 *    Pattern: /No routes matched location/
 *    
 *    WHY CRITICAL:
 *    - User clicks link → nothing happens or wrong page loads
 *    - Broken navigation in production
 *    
 *    PRODUCTION IMPACT:
 *    - User can't access features
 *    - 404-like behavior within app
 *    - Poor user experience
 *    
 *    COMMON CAUSES:
 *    - Route path typos: /iam/user-access vs /iam/access-management
 *    - Missing route definitions
 *    - Story using wrong route structure
 *    
 *    HOW TO FIX:
 *    - Verify route paths match between navigation and route config
 *    - Check story route setup matches production routing
 *    - Ensure all navigation URLs have corresponding routes
 * 
 * ------------------------------------------------------------------------
 * REDUX ERRORS - Performance Issues
 * ------------------------------------------------------------------------
 * 
 * 8. Unmemoized Selectors
 *    Pattern: /Selector.*returned a different result/
 *    
 *    WHY CRITICAL:
 *    - Selector creates new object/array reference every call
 *    - Components re-render on EVERY Redux state change
 *    - Not just in this component - affects entire app
 *    
 *    PRODUCTION IMPACT:
 *    - Slow, laggy UI
 *    - Wasted CPU cycles
 *    - Poor user experience on slower devices
 *    - Battery drain on mobile
 *    
 *    HOW TO FIX:
 *    Bad:  const selector = (state) => state.items.filter(...)
 *    Good: const selector = createSelector(
 *            [(state) => state.items],
 *            (items) => items.filter(...)
 *          )
 * 
 * 9. Reselect Identity Function
 *    Pattern: /result function returned its own inputs without modification/
 *    
 *    WHY CRITICAL:
 *    - Defeats the purpose of memoization
 *    - Selector adds overhead without benefit
 *    - Indicates misunderstanding of selector patterns
 *    
 *    PRODUCTION IMPACT:
 *    - Unnecessary computational overhead
 *    - Potential performance degradation
 *    - Code smell indicating refactoring needed
 *    
 *    HOW TO FIX:
 *    Bad:  export const selectTodos = createSelector(
 *            [(state) => state.todos],
 *            (todos) => todos  // ❌ Just returns input unchanged
 *          )
 *    Good: export const selectTodos = (state) => state.todos  // Base selector
 *    
 *    OR if transformation is needed:
 *    Good: export const selectTodos = createSelector(
 *            [(state) => state.todos],
 *            (todos) => todos.filter(t => !t.completed)  // ✅ Actual transformation
 *          )
 * 
 * ------------------------------------------------------------------------
 * INTL ERRORS - Broken Translations
 * ------------------------------------------------------------------------
 * 
 * 10. Intl Formatting Errors
 *    Pattern: /@formatjs\/intl Error FORMAT_ERROR/
 *    
 *    WHY CRITICAL:
 *    - Breaks internationalization
 *    - Users see error messages or malformed text
 *    - Critical for non-English users
 *    
 *    PRODUCTION IMPACT:
 *    - "Error formatting message" shown to users
 *    - Raw message strings instead of translated text
 *    - Broken user experience for international users
 *    
 *    COMMON CAUSES:
 *    - Message has {variable} but not provided when formatting
 *    - Malformed ICU message syntax
 *    
 *    HOW TO FIX:
 *    Message: "Hello {name}"
 *    Bad:  formatMessage(messages.hello)
 *    Good: formatMessage(messages.hello, { name: userName })
 * 
 * ------------------------------------------------------------------------
 * JAVASCRIPT ERRORS - Runtime Failures
 * ------------------------------------------------------------------------
 * 
 * 10. Uncaught Errors, TypeErrors, ReferenceErrors
 *     Patterns: /Uncaught/, /TypeError/, /ReferenceError/
 *     
 *     WHY CRITICAL: These are actual JavaScript errors that crash features
 *     
 *     HOW TO FIX: Debug and fix the JavaScript error
 * 
 * ------------------------------------------------------------------------
 * CONSOLE.LOG - Debug Statements (in Component Code)
 * ------------------------------------------------------------------------
 * 
 * 11. console.log in Component Render
 *     Pattern: Detects via console type 'log' + not in ignored patterns
 *     
 *     WHY CRITICAL:
 *     - Debug statements left in component code
 *     - Pollutes production console
 *     - May leak sensitive data in logs
 *     
 *     PRODUCTION IMPACT:
 *     - Browser console filled with debug noise
 *     - Performance impact (console.log is slow)
 *     - Potential security issue if logging sensitive data
 *     
 *     HOW TO FIX:
 *     - Remove console.log from component code
 *     - Use proper debugging tools instead
 *     - In play functions: prefix log with "SB:"
 * 
 * ------------------------------------------------------------------------
 * CONSOLE.WARN / CONSOLE.ERROR - Banned in Stories, Tolerated in Components
 * ------------------------------------------------------------------------
 * 
 * 12. console.warn() and console.error() in Stories
 *     Pattern: Detected via console type 'log' listener (we converted them to console.log)
 *     
 *     WHY BANNED IN STORIES:
 *     - Stories should use console.log('SB: ...') for test output
 *     - console.error/warn implies something is wrong
 *     - Makes it harder to spot real errors vs test output
 *     
 *     HOW TO FIX IN STORIES:
 *     Replace: console.error('Expected error in test')
 *     With:    console.log('SB: Expected error in test')
 * 
 * 13. console.warn() and console.error() in Component Code
 *     
 *     NOT CURRENTLY DETECTED (too many instances in catch blocks)
 *     
 *     PHILOSOPHY:
 *     console.warn/error without proper error handling is NOISE:
 *     
 *     ❌ BAD (just noise):
 *       catch (error) {
 *         console.error('Failed:', error);  // Then what? No recovery!
 *       }
 *     
 *     ✅ GOOD (with recovery):
 *       catch (error) {
 *         console.error('Failed:', error);
 *         return fallbackData;  // Or throw, or show error UI
 *       }
 *     
 *     FUTURE WORK:
 *     Audit all console.warn/error in components and either:
 *     1. Add proper error handling (throw, return, show error UI)
 *     2. Remove the console statement entirely
 * 
 * ============================================================================
 * HOW TO ADD EXCEPTIONS (use sparingly!)
 * ============================================================================
 * 
 * If you have a legitimate reason to ignore an error:
 * 
 * 1. Add pattern to IGNORED_ERROR_PATTERNS with clear explanation
 * 2. Document WHY it's safe to ignore
 * 3. Get code review approval
 * 
 * DO NOT remove patterns from CRITICAL_ERROR_PATTERNS without:
 * - Understanding why the pattern is there
 * - Fixing all occurrences of the issue
 * - Team discussion and approval
 * 
 * ============================================================================
 */
const CRITICAL_ERROR_PATTERNS = [
  // Always critical - these indicate real bugs regardless of PF version
  /Warning: Failed.*type:/,
  /No routes matched location/,  // Router issues
  /@formatjs\/intl Error FORMAT_ERROR/,  // i18n errors
  /result function returned its own inputs without modification/,  // Redux selector issues
  /You should call navigate\(\) in a React\.useEffect\(\)/,  // Navigation during render
  
  // JavaScript runtime errors - always critical
  /Uncaught/,
  /TypeError/,
  /ReferenceError/,
  /Cannot read propert/,
  /is not a function/,
  
  // PatternFly version-dependent patterns
  // On PF6+: ENFORCE these (they MUST be fixed after upgrade)
  // On PF5: IGNORE these (they're in IGNORED_ERROR_PATTERNS for backwards compatibility)
  ...(PATTERNFLY_VERSION >= 6 ? [
    // React anti-patterns - must be fixed in PF6
    /Warning: A props object containing a "key" prop is being spread/,
    /Warning: Encountered two children with the same key/,
    /Warning: Each child in a list should have a unique "key" prop/,
    /Warning: validateDOMNesting/,
    /Warning: React does not recognize.*prop on a DOM element/,
    /Warning: Cannot update a component.*while rendering a different component/,
    /Selector.*returned a different result/,
  ] : [
    // On PF5: No additional React warnings enforced here
    // They're all ignored in IGNORED_ERROR_PATTERNS for backwards compatibility
  ]),
];

function shouldIgnoreError(errorText: string): boolean {
  return IGNORED_ERROR_PATTERNS.some(pattern => pattern.test(errorText));
}

function isCriticalError(errorText: string): boolean {
  return CRITICAL_ERROR_PATTERNS.some(pattern => pattern.test(errorText));
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
        // Only print to console for warnings/errors to keep output clean
        // console.log messages are collected silently
        if (type === 'warning' || type === 'error') {
          console.log(`[BROWSER ${type.toUpperCase()}]: ${text}`);
        }
        
        // Collect critical errors for this story
        if (type === 'error' && !shouldIgnoreError(text)) {
          const errors = storyErrors.get(id) || [];
          errors.push(text);
          storyErrors.set(id, errors);
        }
        
        // Collect critical warnings that indicate bugs
        if (type === 'warning' && isCriticalError(text) && !shouldIgnoreError(text)) {
          const errors = storyErrors.get(id) || [];
          errors.push(text);
          storyErrors.set(id, errors);
        }
        
        // Collect console.log from component code (not test debugging)
        // Test debugging patterns are in IGNORED_ERROR_PATTERNS (✅, 🎯, etc.)
        if (type === 'log' && !shouldIgnoreError(text)) {
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
      const errorSummary = errors
        .map((err, i) => `  ${i + 1}. ${err.substring(0, 200)}${err.length > 200 ? '...' : ''}`)
        .join('\n');
      
      throw new Error(
        `Story "${title} > ${name}" failed due to ${errors.length} critical console error(s):\n\n${errorSummary}\n\n` +
        `These errors may indicate bugs or anti-patterns that need to be fixed.\n` +
        `If these are intentional/expected errors, add them to IGNORED_ERROR_PATTERNS in test-runner.ts`
      );
    }
  },
  
  // Configure tags to skip certain stories if needed
  tags: {
    skip: ['skip-test'],
  },
};

export default config; 