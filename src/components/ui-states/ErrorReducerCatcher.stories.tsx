import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { createStore } from 'redux';
import { DECORATOR_ARG_TYPES, DEFAULT_DECORATOR_ARGS, StoryArgs } from '../../../.storybook/types';
import ErrorReducerCatcher from './ErrorReducerCatcher';

// Mock Redux store for testing different error states
const createMockStore = (errorCode?: number) => {
  const initialState = {
    errorReducer: {
      errorCode,
    },
  };

  const rootReducer = (state = initialState, action: any) => {
    switch (action.type) {
      case 'API_ERROR':
        // In Storybook, we want to preserve the error state for demonstration
        // In real app, this would clear the error, but for stories we keep it
        if (action.payload === undefined && state.errorReducer.errorCode) {
          // Don't clear the error if we're trying to clear it and there's already an error
          // This allows us to see the error states in Storybook
          return state;
        }
        return {
          ...state,
          errorReducer: {
            errorCode: action.payload,
          },
        };
      default:
        return state;
    }
  };

  return createStore(rootReducer);
};

// Test component to show inside ErrorReducerCatcher
const TestContent: React.FC = () => (
  <div style={{ padding: '20px', border: '2px solid #0066cc', borderRadius: '8px', margin: '20px' }}>
    <h2>Application Content</h2>
    <p>This is the normal application content that would be displayed when there are no errors.</p>
    <p>The ErrorReducerCatcher component wraps this content and shows error states when needed.</p>
  </div>
);

// Component props + decorator arguments
type ErrorCatcherStoryArgs = StoryArgs<
  React.ComponentProps<typeof ErrorReducerCatcher> & {
    errorCode?: number;
    currentPath?: string;
  }
>;

const meta: Meta<ErrorCatcherStoryArgs> = {
  component: ErrorReducerCatcher,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
ErrorReducerCatcher is a higher-order component that catches and displays API errors throughout the RBAC application.
It monitors the Redux error state and displays appropriate error pages while clearing errors when navigation occurs.

## Features
- Monitors Redux error state for API errors
- Displays contextual error pages based on current route
- Automatically clears errors on navigation
- Shows 403 Unauthorized pages with appropriate messaging
- Includes notification portal for displaying toast messages
- Falls back to normal content when no errors exist

## Error Handling
- **403 Errors**: Shows NotAuthorized component with contextual service name
- **Route Context**: Determines service name based on current URL path
- **Auto Clear**: Clears errors when user navigates to different pages
        `,
      },
    },
  },
  decorators: [
    (Story, { args }) => {
      const store = createMockStore(args.errorCode);
      const path = args.currentPath || '/';

      return (
        <Provider store={store}>
          <MemoryRouter initialEntries={[path]}>
            <Story />
          </MemoryRouter>
        </Provider>
      );
    },
  ],
  argTypes: {
    children: {
      description: 'Content to wrap and protect with error handling',
    },
    errorCode: {
      control: 'select',
      options: [undefined, 403, 404, 500],
      description: 'Simulated error code for testing',
      table: {
        category: 'Testing',
      },
    },
    currentPath: {
      control: 'text',
      description: 'Current route path for contextual error messages',
      table: {
        category: 'Testing',
      },
    },
    // Shared decorator controls
    ...DECORATOR_ARG_TYPES,
  },
  args: {
    // Default decorator values
    ...DEFAULT_DECORATOR_ARGS,
  },
} satisfies Meta<ErrorCatcherStoryArgs>;

export default meta;
type Story = StoryObj<ErrorCatcherStoryArgs>;

/**
 * Normal operation - no errors
 */
export const Default: Story = {
  args: {
    errorCode: undefined,
    currentPath: '/',
  },
  render: () => (
    <ErrorReducerCatcher>
      <TestContent />
    </ErrorReducerCatcher>
  ),
};

/**
 * 403 Unauthorized error in Users section
 */
export const UnauthorizedUsers: Story = {
  args: {
    errorCode: 403,
    currentPath: '/users',
  },
  render: () => (
    <ErrorReducerCatcher>
      <TestContent />
    </ErrorReducerCatcher>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows unauthorized access page when user lacks permissions in the Users section.',
      },
    },
  },
};

/**
 * 403 Unauthorized error in Groups section
 */
export const UnauthorizedGroups: Story = {
  args: {
    errorCode: 403,
    currentPath: '/groups',
  },
  render: () => (
    <ErrorReducerCatcher>
      <TestContent />
    </ErrorReducerCatcher>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows unauthorized access page when user lacks permissions in the Groups section.',
      },
    },
  },
};

/**
 * 403 Unauthorized error in general RBAC section
 */
export const UnauthorizedGeneral: Story = {
  args: {
    errorCode: 403,
    currentPath: '/roles',
  },
  render: () => (
    <ErrorReducerCatcher>
      <TestContent />
    </ErrorReducerCatcher>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows unauthorized access page with generic RBAC service name for unknown sections.',
      },
    },
  },
};

/**
 * Unsupported error code (should show nothing)
 */
export const UnsupportedError: Story = {
  args: {
    errorCode: 500,
    currentPath: '/',
  },
  render: () => (
    <ErrorReducerCatcher>
      <TestContent />
    </ErrorReducerCatcher>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows normal content when error code is not specifically handled (e.g., 500 errors).',
      },
    },
  },
};

/**
 * Interactive example showing error state transitions
 */
export const ErrorStateDemo: Story = {
  render: () => {
    const [currentError, setCurrentError] = React.useState<number | undefined>(undefined);
    const [currentPath, setCurrentPath] = React.useState('/');

    const store = createMockStore(currentError);

    return (
      <Provider store={store}>
        <div>
          <div
            style={{
              padding: '16px',
              background: '#f0f0f0',
              borderRadius: '4px',
              marginBottom: '20px',
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <strong>Simulate Error State:</strong>
            <button onClick={() => setCurrentError(undefined)} disabled={currentError === undefined}>
              No Error
            </button>
            <button onClick={() => setCurrentError(403)} disabled={currentError === 403}>
              403 Unauthorized
            </button>

            <span style={{ marginLeft: '16px' }}>
              <strong>Current Path:</strong>
            </span>
            <select value={currentPath} onChange={(e) => setCurrentPath(e.target.value)} style={{ padding: '4px 8px' }}>
              <option value="/">/</option>
              <option value="/users">/users</option>
              <option value="/groups">/groups</option>
              <option value="/roles">/roles</option>
            </select>
          </div>

          <ErrorReducerCatcher>
            <TestContent />
          </ErrorReducerCatcher>
        </div>
      </Provider>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo showing how ErrorReducerCatcher responds to different error states and paths.',
      },
    },
  },
};

/**
 * With different content types
 */
export const WithDifferentContent: Story = {
  args: {
    errorCode: undefined,
  },
  render: () => (
    <div>
      <h3>Different Content Examples:</h3>

      <div style={{ marginBottom: '24px' }}>
        <h4>With Form Content:</h4>
        <ErrorReducerCatcher>
          <form style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '4px' }}>
            <label>
              Username: <input type="text" />
            </label>
            <br />
            <label style={{ marginTop: '8px', display: 'inline-block' }}>
              Email: <input type="email" />
            </label>
            <br />
            <button type="submit" style={{ marginTop: '12px' }}>
              Submit
            </button>
          </form>
        </ErrorReducerCatcher>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h4>With Table Content:</h4>
        <ErrorReducerCatcher>
          <table style={{ width: '100%', border: '1px solid #ddd', borderRadius: '4px' }}>
            <thead style={{ background: '#f5f5f5' }}>
              <tr>
                <th style={{ padding: '8px', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Email</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Role</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '8px' }}>John Doe</td>
                <td style={{ padding: '8px' }}>john@example.com</td>
                <td style={{ padding: '8px' }}>Admin</td>
              </tr>
            </tbody>
          </table>
        </ErrorReducerCatcher>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'ErrorReducerCatcher can wrap any type of content and will display it normally when no errors occur.',
      },
    },
  },
};
