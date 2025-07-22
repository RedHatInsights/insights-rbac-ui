# Storybook Development Guidelines

## Storybook Configuration Overview

Our Storybook setup uses **Storybook 9.x** with React and Webpack 5, providing a comprehensive development and testing environment.

### Core Configuration
- **Framework**: `@storybook/react-webpack5` with SWC compiler for fast builds
- **Stories Location**: All `*.stories.@(js|jsx|mjs|ts|tsx)` files under `src/` directory
- **Documentation**: MDX files supported in `src/docs/` and throughout the project
- **Static Assets**: Served from `./static` directory

### Key Addons & Features
- **@storybook/addon-docs**: Automatic documentation generation with `tags: ['autodocs']`
- **@storybook/addon-webpack5-compiler-swc**: Fast compilation using SWC
- **msw-storybook-addon**: API mocking capabilities for realistic story testing
- **MSW Integration**: Automatically initialized for all stories with `mswLoader`

### Development Context Providers
All stories are automatically wrapped with essential context providers:
- **IntlProvider**: Internationalization with locale data from `src/locales/data.json`
- **PermissionsContext**: User access control simulation
- **ChromeProvider**: Red Hat Cloud Services chrome environment simulation
- **FeatureFlagsProvider**: Feature flag testing capabilities

### Default Story Parameters
Every story automatically inherits these default configurations:
```typescript
parameters: {
  actions: { argTypesRegex: '^on.*' }, // Auto-detect event handlers
  permissions: {
    userAccessAdministrator: false,
    orgAdmin: false,
  },
  chrome: {
    environment: 'prod',
  },
  featureFlags: {
    'platform.rbac.itless': false,
  },
}
```

### Custom Webpack Configuration
- **SCSS Support**: Automatic compilation of `.scss` files with style-loader, css-loader, and sass-loader
- **Hook Mocking**: Development-specific versions of Red Hat hooks:
  - `@redhat-cloud-services/frontend-components/useChrome` → `.storybook/hooks/useChrome`
- `@unleash/proxy-client-react` → `.storybook/hooks/unleash`

### TypeScript Integration
- **react-docgen-typescript**: Automatic prop documentation generation
- **Type Safety**: Full TypeScript support with component type extraction
- **Prop Filtering**: Excludes node_modules props from documentation

### Testing Configuration
- **Test Runner**: `@storybook/test-runner` with custom configuration
- **Timeout**: 20 seconds for slower interactive stories
- **Error Detection**: Automatic console error checking after each story
- **Skip Tags**: Stories tagged with `skip-test` are excluded from test runs
- **MSW Integration**: API mocking works seamlessly in test environment

### Custom Styling
- **PatternFly Integration**: Core CSS automatically loaded (`@patternfly/react-core/dist/styles/base.css`)
- **Custom Theme**: Enhanced styling in `.storybook/storybook.css` with:
  - Improved documentation layout and typography
  - Dark mode support with `prefers-color-scheme`
  - Responsive design for mobile viewing
  - Enhanced code block and table styling
  - Accessibility focus improvements
  - Print-friendly styles

### Interactive Controls & Args
Stories can override default context values through args:
- `orgAdmin`, `userAccessAdministrator`: Permission controls
- `environment`: Chrome environment simulation
- Feature flag controls: Direct boolean controls for testing different states

## Story Development Principles

### Focus on the Component, Not Wrappers
- Stories should document the **actual component** being developed, not wrappers
- Set `component: ActualComponent` in meta object
- Avoid complex wrapper components like `TableToolbarView` in stories

### Title Generation (FORBIDDEN)
- **NEVER** use custom `title` in meta configuration
- **ALWAYS** let Storybook's automatic title generation do the work
- Automatic titles are generated from file paths and are consistent across the project

### File Naming Requirements
- Component files: `ComponentName.tsx` (MUST be capitalized and reflect component name)
- Story files: `ComponentName.stories.tsx` (MUST be capitalized and reflect component name)

### Story Requirements (MANDATORY)
- **REQUIRED**: All stories MUST use `tags: ['autodocs']` by default
- **REQUIRED**: All user interactions in components MUST have play functions to test them
- Stories must test actual user workflows, not just trigger events
- Cover all interactive states: hover, focus, disabled, error, etc.

### Story Structure Template
```typescript
const meta: Meta<typeof ComponentName> = {
  component: ComponentName,  // The actual component being documented
  tags: ['autodocs'],       // REQUIRED: All stories must use autodocs tag
  parameters: {
    docs: {
      description: {
        component: `Clear description of component purpose and usage`
      }
    }
  }
};
```

### User Interaction Testing Requirements
- **REQUIRED**: All user interactions (clicks, form inputs, etc.) must have play functions
- Play functions should test the actual user flows, not just trigger events
- Cover all interactive states: hover, focus, disabled, error, etc.

### Testing Imports (REQUIRED)
- **ALWAYS** import testing utilities from `storybook/test` package (no @ symbol)
- **NEVER** import from individual packages like `@storybook/testing-library` or `@storybook/jest`
- **NEVER** use `@storybook/test` (with @ symbol) - this is incorrect
- Standard imports: `import { userEvent, within, expect, fn } from 'storybook/test';`
- `storybook/test` consolidates all testing utilities in modern Storybook versions

## Avoiding Render Loops and Performance Issues

### CRITICAL: Decorator Store Memoization
- **ALWAYS** memoize store creation in decorators to prevent infinite render loops
- **NEVER** create new store instances on every render in decorators
- Use `useMemo` with proper dependencies to ensure stable store instances

```typescript
import { useMemo } from 'react';

const withProviders = (Story: any, context: any) => {
  const storeState = context.parameters?.storeState || {};
  
  // CRITICAL: Memoize store creation to prevent infinite re-renders
  const store = useMemo(() => createStoreWithState(storeState), [JSON.stringify(storeState)]);
  
  return (
    <Provider store={store}>
      <Story />
    </Provider>
  );
};
```

### Render Loop Symptoms and Debugging
- **Symptom**: Play functions don't execute or timeout
- **Symptom**: Components appear responsive but tests fail
- **Symptom**: Browser becomes unresponsive with infinite re-renders
- **Cause**: Creating new objects/functions on every render in decorators
- **Solution**: Memoize all expensive operations and object creation

### Common Render Loop Causes
```typescript
// ❌ BAD: Creates new store every render
const store = createStore(storeState);

// ✅ GOOD: Memoized store creation
const store = useMemo(() => createStore(storeState), [JSON.stringify(storeState)]);

// ❌ BAD: Creates new object every render
const chromeValue = { environment: 'test', ...chromeContext };

// ✅ GOOD: Memoized object creation
const chromeValue = useMemo(() => ({ environment: 'test', ...chromeContext }), [chromeContext]);
```

## Permission Testing Patterns

### Custom Chrome Context for Permission Scenarios
Test different permission states by overriding Chrome context in story parameters:

```typescript
export const NoPermissions: Story = {
  parameters: {
    chromeContext: {
      getUserPermissions: () => Promise.resolve([
        { permission: 'inventory:groups:read', resourceDefinitions: [] }
      ]),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Test that UI elements are hidden without proper permissions
    await expect(canvas.queryByText('Create workspace')).not.toBeInTheDocument();
  },
};

export const LimitedPermissions: Story = {
  parameters: {
    chromeContext: {
      getUserPermissions: () => Promise.resolve([
        {
          permission: 'inventory:groups:write',
          resourceDefinitions: [
            {
              attributeFilter: {
                key: 'workspace.id',
                operation: 'in',
                value: ['workspace-1'] // Limited to specific resources
              }
            }
          ]
        }
      ]),
    },
  },
};
```

### Permission-Based UI Testing
- **Test Visibility**: Verify buttons/actions appear/disappear based on permissions
- **Test Functionality**: Verify permission-gated features work correctly
- **Test Resource Limits**: Test both unlimited and resource-limited permissions
- **Test Edge Cases**: Test undefined/null permission scenarios

### Enhanced Decorator for Permission Testing
```typescript
const withProviders = (Story: any, context: any) => {
  const chromeContext = context.parameters?.chromeContext;
  
  const chromeValue = useMemo(() => {
    if (chromeContext) {
      return {
        environment: 'test',
        getUserPermissions: chromeContext.getUserPermissions || (() => Promise.resolve([])),
        // ... other Chrome methods
      };
    }
    return null;
  }, [chromeContext]);
  
  const content = (/* Your component tree */);
  
  // Wrap in custom Chrome context if provided
  if (chromeValue) {
    return <ChromeProvider value={chromeValue}>{content}</ChromeProvider>;
  }
  
  return content;
};
```

## Navigation and Action Testing

### Testing Navigation Actions
- **Test Clickability**: Verify buttons are clickable without errors
- **Don't Test Routing**: Avoid testing actual navigation in component stories
- **Test Functionality**: Focus on the component behavior, not routing effects

```typescript
// ✅ GOOD: Test button clickability
await userEvent.click(canvas.getByText('Create workspace'));
// Button should be clickable without crashes

// ❌ BAD: Don't test routing behavior in component stories
// await expect(mockNavigate).toHaveBeenCalledWith('/create-workspace');
```

### Navigation Button Patterns
- Navigation buttons should be tested for presence and clickability
- Use `onClick={() => navigate({ pathname: path })}` pattern
- Permission-based visibility should be thoroughly tested
- Focus on component behavior, not routing integration

## Component Bug Detection Through Stories

### Defensive Component Patterns
Stories often reveal component bugs that should be fixed in the component:

```typescript
// ❌ Component Bug: No null check
setUserPermissions(permissions.find(({permission}) => condition));

// ✅ Fixed Component: Defensive null handling  
const foundPermission = permissions.find(({permission}) => condition);
setUserPermissions(foundPermission || { permission: '', resourceDefinitions: [] });
```

### Common Component Issues Found in Stories
- **Undefined Permission Handling**: Components crash when permissions.find() returns undefined
- **Missing Permission Checks**: UI elements always visible regardless of permissions
- **Resource Definition Handling**: Components assume resourceDefinitions is always an array
- **Render Dependencies**: Components re-render unnecessarily due to object recreation

### Bug-Finding Story Patterns
- **Permission Edge Cases**: Test with no permissions, undefined permissions
- **Empty Data States**: Test with empty arrays, null values
- **Error Conditions**: Test with malformed data
- **Loading States**: Test interruption and cancellation scenarios

## Story Quality and Meaningful Testing

### Avoiding Pointless Stories
- **Don't Test Framework Behavior**: Don't test PatternFly responsive behavior unless custom logic exists
- **Don't Test External Libraries**: Focus on your component's behavior, not dependencies
- **Don't Test Static Content**: Avoid stories that only verify text is visible
- **Focus on Component Logic**: Test state changes, user interactions, conditional rendering

### Examples of Pointless vs. Meaningful Stories
```typescript
// ❌ POINTLESS: Only tests text visibility
export const ResponsiveLayout: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  play: async ({ canvasElement }) => {
    // Just checks that text is still visible on mobile
    await expect(canvas.getByText('Some Text')).toBeInTheDocument();
  },
};

// ✅ MEANINGFUL: Tests actual component behavior
export const SearchFunctionality: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const searchInput = canvas.getByPlaceholderText('Filter by name');
    
    // Test actual filtering logic
    await userEvent.type(searchInput, 'Web');
    await waitFor(async () => {
      await expect(canvas.getByText('Web Services')).toBeInTheDocument();
      await expect(canvas.queryByText('Development Environment')).not.toBeInTheDocument();
    });
  },
};
```

### Story Value Assessment
Ask these questions before creating a story:
1. **Does this test component logic?** (not framework/library behavior)
2. **Does this test user interaction?** (not just static rendering)
3. **Does this test conditional behavior?** (different states/props)
4. **Would this catch a regression?** (actual functionality that could break)

If the answer to all is "no", don't create the story.

## Feature Flag Handling in Stories

### The Problem with Feature Flag Mocking
- **DON'T**: Rely on `parameters.unleash.flags` alone for testing feature flag logic
- Feature flag mocking in test runners often doesn't work reliably
- Container components need explicit feature flag simulation for proper testing

### The Solution: Custom Render Components
When components have feature flag logic, create a custom render component that simulates the exact logic:

```typescript
interface ComponentArgs {
  isFeatureEnabled: boolean;
  isUserEligible: boolean;
}

// Custom render component that simulates the container's feature flag logic
const ComponentWithFeatureFlags: React.FC<ComponentArgs> = ({ isFeatureEnabled, isUserEligible }) => {
  const shouldShowAlert = isUserEligible && !isFeatureEnabled;

  return (
    <React.Fragment>
      {shouldShowAlert && <FeatureAlert />}
      <MainComponent />
    </React.Fragment>
  );
};

const meta: Meta<ComponentArgs> = {
  component: MainComponent,
  argTypes: {
    isFeatureEnabled: {
      control: 'boolean',
      description: 'Whether feature is enabled (platform.feature.flag)',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    isUserEligible: {
      control: 'boolean',
      description: 'Whether user is eligible for feature (platform.feature.eligible)',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
  },
  render: (args) => <ComponentWithFeatureFlags {...args} />,
};

export const WithFeatureEnabled: Story = {
  args: {
    isFeatureEnabled: true,
    isUserEligible: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // Test the feature flag logic directly
    expect(canvas.queryByText('Feature alert text')).not.toBeInTheDocument();
  },
};
```

### Feature Flag Best Practices
- **Document Logic**: Clearly explain the feature flag combinations in component docs
- **Use Controls**: Add `argTypes` for interactive boolean controls
- **Test All States**: Create stories for each meaningful flag combination
- **Explicit Logic**: Don't rely on unleash mocking - implement the logic explicitly
- **Realistic Text**: Use actual component text in assertions, not generic selectors

### Common Feature Flag Patterns
```typescript
// Pattern 1: Simple enable/disable
const shouldShow = isFeatureEnabled;

// Pattern 2: Eligibility + enable (common for opt-in features)  
const shouldShowAlert = isEligible && !isEnabled;

// Pattern 3: Multiple conditions
const shouldShowBeta = isBetaUser && isBetaEnabled && !isProduction;
```

## Storybook Actions & Event Handling

### Automatic Actions Configuration
- Actions are **automatically configured** for all `on*` props
- Props starting with `on` (onClick, onChange, etc.) automatically log to Actions panel
- **Don't use `console.log`** in story event handlers
- **Don't use manual `action()` calls for `on*` props**

### Play Functions for Testing
```typescript
import { userEvent, within, expect, fn } from 'storybook/test';

export const ClickableStory: Story = {
  args: {
    onClick: fn(),  // Testable spy function
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText('5', { selector: 'a' }));
    await expect(args.onClick).toHaveBeenCalled();
  }
};
```

### Play Function Guidelines
- **Use `fn()` for individual stories** - creates testable spy functions
- **Use specific selectors** - `{ selector: 'a' }` to target exact elements
- **Test both positive and negative cases**
- **Never add play functions to comparison stories**

## Quality Requirements for Stories

### Before Submitting Stories
- [ ] **Check dependency versions** in `package.json` for correct API usage
- [ ] Stories document target component, not wrappers
- [ ] No custom `title` in meta (using autotitle)
- [ ] All TypeScript errors resolved
- [ ] `npm run build` passes
- [ ] `npm run lint:js` passes (no errors, warnings OK)
- [ ] `npm run test-storybook:ci` passes (REQUIRED after adding any story)
- [ ] Realistic data structures used
- [ ] PatternFly components properly integrated
- [ ] JSX elements in arrays have `key` props

### Story Testing
- **REQUIRED**: Run `npm run test-storybook:ci` after adding any new story
- This command tests all play functions and interactions in your stories
- All Storybook tests must pass before considering the story complete
- Fix any failing interactions or accessibility issues before proceeding

### Story Organization

#### File Structure for Good Auto-Titles
- Place stories next to components: `ComponentName.stories.tsx`
- Use descriptive directory names that will generate good titles
- Example: `src/presentational-components/shared/UsersRow.stories.tsx` 
  → Auto-title: "Presentational Components/Shared/Users Row"

#### Story Naming Conventions
- Use descriptive story names that explain the state/scenario
- Examples: `ActiveUser`, `InactiveUser`, `NoStatus`, `Comparison`
- Avoid generic names like `Default`, `Example`, `Basic`

## Common Pitfalls to Avoid

- ❌ Don't use `TableToolbarView` or complex wrappers in stories
- ❌ Don't set custom `title` in meta object
- ❌ Don't use `console.log` in story event handlers
- ❌ **NEVER start the Storybook server** - Always ask the user to handle it
- ❌ Don't create stores in decorators without memoization (causes render loops)
- ❌ Don't test framework behavior (PatternFly responsive, etc.) unless custom logic exists
- ❌ Don't create stories that only test static text visibility

**Goal**: Create focused, realistic, maintainable component stories that serve as documentation and testing tools. Let Storybook handle titles automatically for consistency.

## Redux Integration in Storybook Stories

### Redux Store Configuration
- **NEVER** use `@reduxjs/toolkit` or `configureStore` - this app uses classic Redux
- **ALWAYS** use `createStore` from the `redux` package for mock stores
- **ALWAYS** match the actual app store structure from `src/redux/`

### Mock Store Creation Pattern
```typescript
import { createStore } from "redux";

// Mock Redux store setup (NOT using Redux Toolkit)
const createMockStore = (initialState = {}) => {
  const mockReducer = (state = initialState) => state;
  return createStore(mockReducer);
};

// Example: Mock store with workspace data
const withProviders = (Story: StoryFn, context: StoryContext) => {
  const storeState = context.parameters.storeState || {};
  const store = createMockStore(storeState);
  
  return (
    <Provider store={store}>
      <BrowserRouter>
        <IntlProvider locale="en" messages={{}}>
          <Story />
        </IntlProvider>
      </BrowserRouter>
    </Provider>
  );
};
```

### Decorator Pattern for Context Providers
```typescript
const meta: Meta<typeof ComponentName> = {
  component: ComponentName,
  decorators: [withProviders],
  parameters: {
    storeState: {
      workspaces: mockWorkspaces, // Match actual reducer structure
      isLoading: false,
    },
  },
};
```

## Chrome Context Enhancement

### Missing Functions in Chrome Mock
When stories fail with "chrome.someFunction is not a function", enhance the Chrome mock:

```typescript
// In .storybook/context-providers.tsx
const mockChrome = {
  // ... existing mock functions
  getUserPermissions: () => Promise.resolve({
    isOrgAdmin: chromeConfig.orgAdmin || false,
    userAccessAdministrator: chromeConfig.userAccessAdministrator || false,
  }),
  // Add other missing functions as needed
};
```

## Story Verification Requirements

### ALWAYS Verify Before Continuing
- **REQUIRED**: Test stories immediately after creation using tags
- **REQUIRED**: Fix all failing tests before moving to next component
- **NEVER** create multiple stories without verifying each one works

### Verification Process
1. Add descriptive tags to stories for targeted testing:
   ```typescript
   const meta: Meta<typeof ComponentName> = {
     component: ComponentName,
     tags: ["autodocs", "component-name"], // Add specific tag
   };
   ```

2. Test specific stories with tags:
   ```bash
   npm run test-storybook:ci -- --includeTags="component-name"
   ```

3. Fix any failing tests before proceeding to next component

### IntlMessage Parameter Requirements
- **ALWAYS** check message definitions for required parameters
- **ALWAYS** provide `count` parameter when messages expect it:
  ```typescript
  intl.formatMessage(messages.workspaceNotEmptyWarning, { count: 1 })
  ```

## Common Redux/Storybook Errors and Fixes

### Error: "configureStore is not a function"
- **Cause**: Using Redux Toolkit syntax in non-toolkit app
- **Fix**: Use `createStore` from `redux` package

### Error: "chrome.getUserPermissions is not a function"  
- **Cause**: Incomplete Chrome mock
- **Fix**: Add missing function to `.storybook/context-providers.tsx`

### Error: Missing "count" variable in message
- **Cause**: IntlMessage expects parameters not provided
- **Fix**: Add required parameters to `formatMessage` call

### Error: Play functions not executing/timing out
- **Cause**: Render loop preventing component stabilization
- **Fix**: Memoize store creation and object creation in decorators

### Error: Component crashes with undefined permissions
- **Cause**: Component doesn't handle permissions.find() returning undefined
- **Fix**: Add defensive null checks in component code

## Container/Presentational Component Pattern (CRITICAL)

### When Components Are Too Complex for Storybook
If a component has **Redux dependencies** that make Storybook testing difficult, apply the **container/presentational pattern**:

### The Problem: Mixed Concerns
Components that mix UI logic with Redux/business logic are hard to test:
- Redux dependencies require complex mocking
- Business logic mixed with presentation logic
- Difficult to test UI states in isolation

### The Solution: Separate Concerns
**Split into two components:**

#### 1. Presentational Component (in /components/)
**Pure UI component with NO Redux dependencies:**
```typescript
interface ComponentProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DataType) => void;
  selectedItem: ItemType | null;
  onItemChange: (item: ItemType | null) => void;
  availableItems: ItemType[];
  isSubmitting?: boolean;
}

export const Component: React.FC<ComponentProps> = ({
  isOpen,
  onClose,
  onSubmit,
  // ... all data via props
}) => {
  // Pure UI logic only
  return <Modal>...</Modal>;
};
```

#### 2. Container Component (at feature level)
**Smart component that handles business logic:**
```typescript
export const ComponentContainer: React.FC<ContainerProps> = ({ isOpen, onClose, itemToProcess }) => {
  const dispatch = useDispatch();
  const [selectedItem, setSelectedItem] = useState<ItemType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // All Redux/business logic here
  const items = useSelector((state: RBACStore) => state.itemsReducer.items || []);
  
  const handleSubmit = async (item: ItemType) => {
    setIsSubmitting(true);
    try {
      await dispatch(processItem(item));
      dispatch(fetchItems());
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Component
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      selectedItem={selectedItem}
      onItemChange={setSelectedItem}
      availableItems={items}
      isSubmitting={isSubmitting}
    />
  );
};
```

### File Organization
- **Presentational**: `src/features/[feature]/components/ComponentName.tsx`
- **Container**: `src/features/[feature]/ComponentName.tsx` (feature level)
- **Stories**: `src/features/[feature]/components/ComponentName.stories.tsx`

### Testing Benefits
- **Presentational component**: Easy to test in Storybook with mock props
- **Container component**: Handles Redux complexity, tested separately
- **Clean separation**: UI logic separate from business logic
- **Reusability**: Presentational component can be reused with different data sources

### Story Creation for Presentational Components
```typescript
// Wrapper component manages state for story testing
const ComponentWrapper = ({ ...storyArgs }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(storyArgs.selectedItem || null);
  
  const handleSubmit = (item: ItemType) => {
    console.log('Submitted:', item);
    setIsOpen(false);
  };
  
  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Open Component</Button>
      <Component
        {...storyArgs}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
        selectedItem={selectedItem}
        onItemChange={setSelectedItem}
      />
    </div>
  );
};

export const Default: Story = {
  render: (args) => <ComponentWrapper {...args} />,
  args: {
    availableItems: mockItems,
    selectedItem: null,
    isSubmitting: false,
  },
};
```

### When to Apply This Pattern
Apply container/presentational pattern when:
- Component uses `useDispatch` or `useSelector`
- Component makes API calls directly
- Component has complex state management
- Storybook stories are failing due to Redux dependencies
- Testing requires extensive mocking of external dependencies

### Do NOT Apply When
- Component is already pure (no Redux dependencies)
- Component only uses props passed from parent
- Simple components with minimal logic
- Components that are already working well in Storybook

This pattern follows React best practices and makes components much more maintainable and testable. 