# Context Mocking in Storybook

This project provides a comprehensive context mocking system for Storybook that allows you to easily configure permissions, Chrome API behavior, and feature flags for your stories.

## Overview

The mocking system replaces external dependencies with context-aware implementations that read from configurable providers. This ensures consistent behavior across stories while maintaining the same API as the real implementations.

## Available Contexts

### 1. Permissions Context
Controls user permissions throughout the application.

**Available Permissions:**
- `orgAdmin` (boolean) - Organization admin permissions
- `userAccessAdministrator` (boolean) - User access admin permissions

### 2. Chrome Context
Mocks the Red Hat Cloud Services Chrome API for environment detection.

**Available Properties:**
- `environment` (string) - Environment name ('prod', 'stage', 'ci-beta', etc.)

**Generated Methods:**
- `getEnvironment()` - Returns the environment string
- `isProd()` - Returns true if environment is 'prod'
- `isBeta()` - Returns true if environment is not 'prod'

### 3. Feature Flags Context
Mocks Unleash feature flags for controlling feature availability.

**Available Flags:**
- `platform.rbac.itless` (boolean) - ITLess mode toggle
- Any other feature flag can be added as needed

## Configuration

### Global Defaults
Default values are set in `.storybook/preview.tsx`:

```typescript
// Default configurations
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
```

### Per-Story Configuration
Override defaults in individual stories using the `parameters` property:

```typescript
export const MyStory: Story = {
  parameters: {
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
    chrome: {
      environment: 'stage',
    },
    featureFlags: {
      'platform.rbac.itless': true,
    },
  },
};
```

## Usage Examples

### Basic Permission Control
```typescript
// Show admin view
export const AdminView: Story = {
  parameters: {
    permissions: {
      orgAdmin: true,
    },
  },
};

// Show regular user view
export const RegularUser: Story = {
  parameters: {
    permissions: {
      orgAdmin: false,
    },
  },
};
```

### Environment Testing
```typescript
// Production environment
export const Production: Story = {
  parameters: {
    chrome: {
      environment: 'prod',
    },
  },
};

// Staging environment
export const Staging: Story = {
  parameters: {
    chrome: {
      environment: 'stage',
    },
  },
};
```

### Feature Flag Testing
```typescript
// Feature enabled
export const WithFeature: Story = {
  parameters: {
    featureFlags: {
      'platform.rbac.itless': true,
    },
  },
};

// Feature disabled  
export const WithoutFeature: Story = {
  parameters: {
    featureFlags: {
      'platform.rbac.itless': false,
    },
  },
};
```

### Complex Scenarios
```typescript
// ITLess admin in staging
export const ComplexScenario: Story = {
  parameters: {
    permissions: {
      orgAdmin: true,
    },
    chrome: {
      environment: 'stage',
    },
    featureFlags: {
      'platform.rbac.itless': true,
    },
  },
};
```

## How It Works

### Webpack Aliases
The system uses webpack aliases to replace real imports with mock implementations:

```typescript
// .storybook/main.ts
webpackFinal: async (config) => {
  config.resolve.alias = {
    '@redhat-cloud-services/frontend-components/useChrome': 
      path.resolve(__dirname, '../src/test/storybook-hooks/useChrome'),
    '@unleash/proxy-client-react': 
      path.resolve(__dirname, '../src/test/storybook-hooks/unleash'),
  };
},
```

### Context Providers
Mock implementations read from React contexts that are provided globally:

```typescript
// src/test/storybook-context-providers.tsx
export const useChrome = () => {
  const chromeConfig = useContext(ChromeContext);
  return {
    getEnvironment: () => chromeConfig.environment,
    isProd: () => chromeConfig.environment === 'prod',
    // ... other methods
  };
};
```

### Global Decorators
All stories are wrapped with the context providers:

```typescript
// .storybook/preview.tsx
decorators: [
  (Story, { parameters }) => (
    <ChromeProvider value={chromeConfig}>
      <FeatureFlagsProvider value={featureFlags}>
        <PermissionsProvider value={permissions}>
          <Story />
        </PermissionsProvider>
      </FeatureFlagsProvider>
    </ChromeProvider>
  ),
],
```

## Benefits

1. **Consistent API**: Components work exactly the same as in production
2. **Easy Configuration**: Simple parameter-based configuration per story
3. **No Code Changes**: Components don't need modification for Storybook
4. **Comprehensive Coverage**: All external dependencies are mockable
5. **Realistic Testing**: Stories reflect actual application behavior
6. **Environment Simulation**: Can test different environments and configurations

## Adding New Contexts

To add new contexts or extend existing ones:

1. Update the interfaces in `src/test/storybook-context-providers.tsx`
2. Update the shared types in `src/test/storybook-types.ts`
3. Update default values in `.storybook/preview.tsx`
4. Create corresponding webpack aliases in `.storybook/main.ts` if needed
5. Document the new context in this file

## Reusable Story Types

The system provides reusable types for creating stories with decorator controls:

```typescript
// Import shared types
import { StoryArgs, DECORATOR_ARG_TYPES, DEFAULT_DECORATOR_ARGS } from '../../test/storybook-types';

// Extend component props with decorator arguments
type MyComponentStoryArgs = StoryArgs<React.ComponentProps<typeof MyComponent>>;

// Use in meta configuration
const meta: Meta<MyComponentStoryArgs> = {
  component: MyComponent,
  argTypes: {
    // Component-specific props
    myProp: { control: 'text' },
    // Shared decorator controls
    ...DECORATOR_ARG_TYPES,
  },
  args: {
    // Default decorator values
    ...DEFAULT_DECORATOR_ARGS,
  },
};
```

## Common Patterns

### Testing Permission Combinations
```typescript
export const AllPermissions: Story = {
  parameters: {
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: true,
    },
  },
};

export const NoPermissions: Story = {
  parameters: {
    permissions: {
      orgAdmin: false,
      userAccessAdministrator: false,
    },
  },
};
```

### Environment-Specific Features
```typescript
export const ProdOnlyFeature: Story = {
  parameters: {
    chrome: { environment: 'prod' },
    featureFlags: { 'some.prod.feature': true },
  },
};
```

### Flag Override Scenarios
```typescript
export const AdminOverriddenByFlag: Story = {
  parameters: {
    permissions: { orgAdmin: true }, // User is admin...
    featureFlags: { 'platform.rbac.itless': true }, // ...but flag overrides
  },
};
``` 