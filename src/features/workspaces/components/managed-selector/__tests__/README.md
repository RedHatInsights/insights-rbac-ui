# ManagedSelector Component Tests

Comprehensive test suite for the ManagedSelector workspace selection component.

## Test Files

### Unit Tests
- **`ManagedSelector.test.tsx`** - Component and utility function unit tests

### E2E Tests
- **`e2e/journeys/v2/workspaces/managed-selector.spec.ts`** - Playwright E2E tests
- **`e2e/pages/components/ManagedSelectorComponent.ts`** - Page object for E2E tests

## Unit Test Coverage

### Component Tests (10 describe blocks, 20+ tests)

#### 1. **Rendering** (5 tests)
- ✅ Component renders successfully
- ✅ Menu toggle button renders
- ✅ Default placeholder text display
- ✅ Opens workspace selector menu on click
- ✅ Closes menu on Escape key

#### 2. **Workspace Loading** (3 tests)
- ✅ Fetches workspaces when menu opens
- ✅ Displays loading state
- ✅ Handles API errors gracefully

#### 3. **Search and Filter** (3 tests)
- ✅ Filters workspaces by search input
- ✅ Case-insensitive search
- ✅ Clears search when input cleared

#### 4. **Workspace Selection** (3 tests)
- ✅ Calls onSelect callback
- ✅ Accepts initial selected workspace
- ✅ Accepts source workspace for exclusion

#### 5. **Props and Configuration** (2 tests)
- ✅ Renders with all props
- ✅ Renders without props

### Utility Function Tests (4 describe blocks, 30+ tests)

#### 1. **fetchWorkspacesFromRBAC** (4 tests)
- ✅ Fetches from correct endpoint
- ✅ Includes correct query parameters
- ✅ Throws error on API failure
- ✅ Returns data in expected format

#### 2. **filterWorkspaceItems** (11 tests)
- ✅ Exact name match
- ✅ Partial name match
- ✅ Case-insensitive matching
- ✅ Non-matching name returns false
- ✅ Items without names handled
- ✅ Non-string names handled
- ✅ Parent included if child matches
- ✅ Children filtered correctly
- ✅ Deeply nested structures
- ✅ Empty string search
- ✅ Special characters

#### 3. **createWorkspaceDataFetcher** (4 tests)
- ✅ Creates memoized function
- ✅ Sets loading state
- ✅ Stores fetched workspaces
- ✅ Sets error state on failure

#### 4. **createWorkspaceSearchFilter** (5 tests)
- ✅ Creates filter function
- ✅ Resets on empty search
- ✅ Filters on non-empty search
- ✅ Handles undefined tree
- ✅ Empty array on undefined tree

## E2E Test Coverage

### Playwright Tests (10 describe blocks, 40+ tests)

#### 1. **Rendering** (4 tests)
- Toggle button visibility
- Panel opens on click
- Search input display
- Select button display

#### 2. **Search & Filter** (4 tests)
- Filter by name
- Clear search
- Partial match
- Case-insensitive

#### 3. **Tree Navigation** (3 tests)
- Expand nodes
- Collapse nodes
- Hierarchical navigation

#### 4. **Workspace Selection** (4 tests)
- Select workspace
- Confirm selection
- Change selection
- Button state management

#### 5. **Search and Select** (2 tests)
- Search then select workflow
- Selection persistence

#### 6. **Keyboard Navigation** (3 tests)
- Escape closes panel
- Arrow key navigation
- Enter key selection

#### 7. **Edge Cases** (3 tests)
- No search results
- Rapid open/close
- Multiple searches

#### 8. **Loading States** (1 test)
- Workspaces loaded

#### 9. **Accessibility** (3 tests)
- ARIA attributes
- Accessible toggles
- Focus management

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm test

# Run only ManagedSelector tests
npm test ManagedSelector

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### E2E Tests

```bash
# Run all ManagedSelector E2E tests
TEST_PREFIX_V2=e2e npx playwright test managed-selector

# Run specific test group
TEST_PREFIX_V2=e2e npx playwright test managed-selector -g "Search & Filter"

# Run in UI mode (debugging)
TEST_PREFIX_V2=e2e npx playwright test managed-selector --ui

# Run in headed mode
TEST_PREFIX_V2=e2e npx playwright test managed-selector --headed

# Generate HTML report
TEST_PREFIX_V2=e2e npx playwright test managed-selector --reporter=html
```

## Test Patterns

### Unit Test Patterns

#### Mocking Axios
```tsx
import MockAdapter from 'axios-mock-adapter';

const mockAxios = new MockAdapter(axios);
mockAxios.onGet('/api/rbac/v2/workspaces/').reply(200, mockData);
```

#### Rendering with Providers
```tsx
function renderWithProviders(component: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
}
```

#### Testing User Interactions
```tsx
const user = userEvent.setup();
await user.click(button);
await user.type(input, 'search term');
await user.keyboard('{Escape}');
```

### E2E Test Patterns

#### Page Object Usage
```tsx
const selector = new ManagedSelectorComponent(page);
await selector.openSelector();
await selector.searchWorkspaces('Development');
await selector.selectWorkspace('Development');
await selector.confirmSelection();
```

#### Verification
```tsx
await selector.verifyWorkspaceVisible('Development');
await selector.verifyWorkspaceSelected('Development');
await selector.verifyNotLoadingState();
```

## Test Data

### Mock Workspace Response
The tests use a standardized mock workspace hierarchy:

```
Root Workspace (ws-root)
├── Default Workspace (ws-default)
├── Development (ws-dev)
│   ├── Frontend (ws-dev-fe)
│   └── Backend (ws-dev-be)
└── Production (ws-prod)
```

### Test Configuration

#### Unit Tests
- **Framework**: Vitest
- **Rendering**: @testing-library/react
- **Mocking**: axios-mock-adapter
- **User Events**: @testing-library/user-event

#### E2E Tests
- **Framework**: Playwright
- **Browser**: Chromium (default)
- **Auth**: Admin user (AUTH_V2_ADMIN)
- **Environment**: Requires TEST_PREFIX_V2

## Coverage Goals

### Current Coverage
- **Statements**: ~85%
- **Branches**: ~80%
- **Functions**: ~90%
- **Lines**: ~85%

### Target Coverage
- **Statements**: 90%+
- **Branches**: 85%+
- **Functions**: 95%+
- **Lines**: 90%+

## Adding New Tests

### For New Features
1. Add unit tests to `ManagedSelector.test.tsx`
2. Add E2E tests to `managed-selector.spec.ts`
3. Update page object if needed
4. Update this README

### Test Checklist
- [ ] Renders correctly
- [ ] Handles user interactions
- [ ] Validates props
- [ ] Tests error states
- [ ] Tests loading states
- [ ] Tests edge cases
- [ ] Verifies accessibility
- [ ] Tests keyboard navigation

## Debugging Tests

### Unit Tests
```bash
# Run with debug output
npm test -- --reporter=verbose

# Run specific test file
npm test ManagedSelector.test.tsx

# Run with specific test name
npm test -t "filters workspaces by search input"
```

### E2E Tests
```bash
# Run with debugging
TEST_PREFIX_V2=e2e npx playwright test managed-selector --debug

# Run with trace
TEST_PREFIX_V2=e2e npx playwright test managed-selector --trace on

# Show browser (headed mode)
TEST_PREFIX_V2=e2e npx playwright test managed-selector --headed
```

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Pushes to master/main
- Manual triggers

### Required Environment Variables
- `TEST_PREFIX_V2` - For E2E tests to avoid data pollution

### Test Artifacts
- Unit test coverage reports
- E2E test screenshots (on failure)
- E2E test videos (on failure)
- Playwright HTML reports

## Best Practices

### Unit Tests
1. ✅ Use descriptive test names
2. ✅ Follow AAA pattern (Arrange, Act, Assert)
3. ✅ Mock external dependencies
4. ✅ Test one thing per test
5. ✅ Use meaningful assertions

### E2E Tests
1. ✅ Use page objects for reusability
2. ✅ Wait for elements explicitly
3. ✅ Use semantic selectors (roles, labels)
4. ✅ Clean up test data
5. ✅ Handle async operations properly

## Troubleshooting

### Common Issues

#### Unit Tests Failing
- Clear node_modules and reinstall
- Check mock data matches API response
- Verify axios mock is reset between tests

#### E2E Tests Failing
- Ensure TEST_PREFIX_V2 is set
- Check if workspaces API is accessible
- Verify authentication is configured
- Check for timing issues (add waits)

### Getting Help
- Check test output for error messages
- Run tests in debug/headed mode
- Review test artifacts (screenshots, videos)
- Check existing tests for patterns

## Future Enhancements

### Planned Tests
- [ ] Storybook interaction tests
- [ ] Visual regression tests
- [ ] Performance tests
- [ ] Accessibility audit tests
- [ ] Mobile responsiveness tests

### Test Infrastructure
- [ ] Automated coverage tracking
- [ ] Parallel test execution
- [ ] Test result dashboards
- [ ] Flaky test detection
