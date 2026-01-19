import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { useQuery } from '@tanstack/react-query';
import { HttpResponse, delay, http } from 'msw';
import { expect, waitFor, within } from 'storybook/test';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { IntlProvider } from 'react-intl';
import messages from '../../locales/data.json';
import { locale } from '../../locales/locale';
import { ApiErrorBoundary, useApiError } from './ApiErrorBoundary';

// ============================================================================
// Test Components
// ============================================================================

/**
 * Component that triggers an API call to test error handling.
 */
const ApiTriggerComponent: React.FC<{ endpoint: string }> = ({ endpoint }) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['test', endpoint],
    queryFn: async () => {
      const response = await fetch(endpoint);
      if (!response.ok) {
        // Create an error object that looks like an Axios error
        const axiosLikeError = new Error('API Error') as Error & { response?: { status: number } };
        axiosLikeError.response = { status: response.status };
        throw axiosLikeError;
      }
      return response.json();
    },
    retry: false,
  });

  return (
    <div style={{ padding: '20px' }}>
      <h3>API Test Component</h3>
      {isLoading && <p>Loading...</p>}
      {error && (
        <Alert variant="danger" title="Query Error" isInline>
          {(error as Error).message}
        </Alert>
      )}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
      <Button onClick={() => refetch()} style={{ marginTop: '16px' }}>
        Retry Request
      </Button>
    </div>
  );
};

/**
 * Component that displays the current error state and provides a clear button.
 */
const ErrorStatusDisplay: React.FC = () => {
  const { errorCode, clearError } = useApiError();

  return (
    <div style={{ padding: '16px', background: '#f5f5f5', borderRadius: '4px', marginBottom: '16px' }}>
      <strong>Error State:</strong> <span data-testid="error-code">{errorCode ?? 'None'}</span>
      {errorCode && (
        <Button variant="link" onClick={clearError} style={{ marginLeft: '16px' }}>
          Clear Error
        </Button>
      )}
    </div>
  );
};

/**
 * Component that provides navigation controls for testing error clearing.
 */
const NavigationTestComponent: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '16px', background: '#e8f4f8', borderRadius: '4px', marginBottom: '16px' }}>
      <strong>Navigation Test:</strong>
      <Button variant="link" onClick={() => navigate('/users')}>
        Go to /users
      </Button>
      <Button variant="link" onClick={() => navigate('/groups')}>
        Go to /groups
      </Button>
      <Button variant="link" onClick={() => navigate('/other')}>
        Go to /other
      </Button>
    </div>
  );
};

// ============================================================================
// Story Wrapper
// ============================================================================

const StoryWrapper: React.FC<{ children: React.ReactNode; initialPath?: string }> = ({ children, initialPath = '/users' }) => (
  <IntlProvider locale={locale} messages={messages[locale]}>
    <MemoryRouter initialEntries={[initialPath]}>
      <ApiErrorBoundary>
        <ErrorStatusDisplay />
        <NavigationTestComponent />
        {children}
      </ApiErrorBoundary>
    </MemoryRouter>
  </IntlProvider>
);

// ============================================================================
// Meta
// ============================================================================

const meta: Meta<typeof ApiErrorBoundary> = {
  title: 'Components/UI States/ApiErrorBoundary',
  component: ApiErrorBoundary,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
**ApiErrorBoundary** provides React Query client with built-in API error handling.

## Features
- Catches **403 Forbidden** errors and shows UnauthorizedAccess component
- Catches **500 Server Error** and shows UnavailableContent component
- **401 Unauthorized** errors trigger page reload (handled by axios interceptor)
- Errors are automatically cleared on navigation
- Provides \`useApiError\` hook for accessing error state

## Usage
\`\`\`tsx
<ApiErrorBoundary>
  <App />
</ApiErrorBoundary>
\`\`\`

## Error Context
Components can access error state via the \`useApiError\` hook:
\`\`\`tsx
const { errorCode, clearError } = useApiError();
\`\`\`
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ApiErrorBoundary>;

// ============================================================================
// Stories
// ============================================================================

/**
 * Normal operation - children render correctly when no errors occur.
 */
export const NormalOperation: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/test/success', async () => {
          await delay(100);
          return HttpResponse.json({ message: 'Success!' });
        }),
      ],
    },
  },
  render: () => (
    <StoryWrapper>
      <ApiTriggerComponent endpoint="/api/test/success" />
    </StoryWrapper>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for loading to complete
    await waitFor(() => {
      expect(canvas.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Verify success message is displayed
    await expect(canvas.findByText(/"message": "Success!"/)).resolves.toBeInTheDocument();

    // Verify no error state (text is split across nodes, so we check for "None" presence)
    await expect(canvas.getByText('None')).toBeInTheDocument();
  },
};

/**
 * 403 Forbidden error shows UnauthorizedAccess component.
 */
export const Error403Forbidden: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/test/forbidden', async () => {
          await delay(100);
          return HttpResponse.json({ error: 'Forbidden' }, { status: 403 });
        }),
      ],
    },
  },
  render: () => (
    <StoryWrapper initialPath="/users">
      <ApiTriggerComponent endpoint="/api/test/forbidden" />
    </StoryWrapper>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for the 403 error state to be displayed
    await waitFor(
      () => {
        // UnauthorizedAccess component should show
        expect(canvas.getByText(/you do not have access/i)).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Verify the service name is derived from the path (/users -> "Users")
    await expect(canvas.getByText(/Users/)).toBeInTheDocument();
  },
};

/**
 * 500 Server Error shows UnavailableContent component.
 */
export const Error500ServerError: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/test/server-error', async () => {
          await delay(100);
          return HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }),
      ],
    },
  },
  render: () => (
    <StoryWrapper initialPath="/groups">
      <ApiTriggerComponent endpoint="/api/test/server-error" />
    </StoryWrapper>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for the 500 error state to be displayed
    await waitFor(
      () => {
        // UnavailableContent component should show
        expect(canvas.getByText(/temporarily unavailable/i)).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Verify the service name includes "Groups" from the path
    await expect(canvas.getByText(/Groups/i)).toBeInTheDocument();
  },
};

/**
 * 502 Bad Gateway also triggers the 500 error state.
 */
export const Error502BadGateway: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/test/bad-gateway', async () => {
          await delay(100);
          return HttpResponse.json({ error: 'Bad Gateway' }, { status: 502 });
        }),
      ],
    },
  },
  render: () => (
    <StoryWrapper>
      <ApiTriggerComponent endpoint="/api/test/bad-gateway" />
    </StoryWrapper>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for the 500 error state (502 triggers the same UI)
    await waitFor(
      () => {
        expect(canvas.getByText(/temporarily unavailable/i)).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  },
};

/**
 * Error clearing via useApiError hook's clearError function.
 */
export const ClearErrorProgrammatically: Story = {
  parameters: {
    docs: {
      description: {
        story: `
Demonstrates clearing an error programmatically using the \`useApiError\` hook.
Click "Clear Error" to dismiss the error state.
        `,
      },
    },
    msw: {
      handlers: [
        http.get('/api/test/forbidden', async () => {
          await delay(100);
          return HttpResponse.json({ error: 'Forbidden' }, { status: 403 });
        }),
      ],
    },
  },
  render: () => (
    <StoryWrapper>
      <ApiTriggerComponent endpoint="/api/test/forbidden" />
    </StoryWrapper>
  ),
};

/**
 * 404 Not Found errors are NOT caught by ApiErrorBoundary
 * (they're handled by individual components).
 */
export const Error404NotCaught: Story = {
  parameters: {
    docs: {
      description: {
        story: `
404 errors are NOT caught by ApiErrorBoundary - they pass through to the component
for local handling. This allows components to show "not found" states specific to
their context.
        `,
      },
    },
    msw: {
      handlers: [
        http.get('/api/test/not-found', async () => {
          await delay(100);
          return HttpResponse.json({ error: 'Not Found' }, { status: 404 });
        }),
      ],
    },
  },
  render: () => (
    <StoryWrapper>
      <ApiTriggerComponent endpoint="/api/test/not-found" />
    </StoryWrapper>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for the error to appear
    await waitFor(
      () => {
        expect(canvas.getByText(/Query Error/)).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Verify error state is still "None" - 404 is not caught globally (text is split across nodes)
    await expect(canvas.getByText('None')).toBeInTheDocument();
  },
};

/**
 * Visual test: 403 error state appearance.
 */
export const Visual403State: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Visual test showing the 403 Unauthorized error state appearance.',
      },
    },
  },
  render: () => {
    // Direct render of the 403 error component for visual testing
    const UnauthorizedAccess = require('@patternfly/react-component-groups/dist/dynamic/UnauthorizedAccess').default;
    const { FormattedMessage } = require('react-intl');
    const messagesModule = require('../../Messages').default;
    const pathnamesModule = require('../../utilities/pathnames').default;
    const { AppLink } = require('../navigation/AppLink');

    return (
      <IntlProvider locale={locale} messages={messages[locale]}>
        <MemoryRouter>
          <div style={{ padding: '20px' }}>
            <Alert variant="info" title="Visual Test" style={{ marginBottom: '16px' }}>
              This shows the 403 error state component directly for visual verification.
            </Alert>
            <UnauthorizedAccess
              data-codemods
              serviceName="Users"
              bodyText={
                <FormattedMessage
                  {...messagesModule.contactOrgAdmin}
                  values={{
                    link: (
                      <AppLink to={pathnamesModule['my-user-access'].link} linkBasename="/iam">
                        My User Access
                      </AppLink>
                    ),
                  }}
                />
              }
            />
          </div>
        </MemoryRouter>
      </IntlProvider>
    );
  },
};

/**
 * Visual test: 500 error state appearance.
 */
export const Visual500State: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Visual test showing the 500 Server Error state appearance.',
      },
    },
  },
  render: () => {
    const UnavailableContent = require('@patternfly/react-component-groups/dist/dynamic/UnavailableContent').default;

    return (
      <IntlProvider locale={locale} messages={messages[locale]}>
        <MemoryRouter>
          <div style={{ padding: '20px' }}>
            <Alert variant="info" title="Visual Test" style={{ marginBottom: '16px' }}>
              This shows the 500 error state component directly for visual verification.
            </Alert>
            <UnavailableContent
              data-codemods
              headingLevel="h1"
              titleText="Groups is temporarily unavailable"
              bodyText="We're working to restore service. Please try again later."
            />
          </div>
        </MemoryRouter>
      </IntlProvider>
    );
  },
};

/**
 * Section name detection based on URL path.
 */
export const SectionNameDetection: Story = {
  parameters: {
    docs: {
      description: {
        story: `
The error state displays a service name based on the current URL path:
- \`/users\` → "Users"
- \`/groups\` → "Groups"
- Other paths → "RBAC"
        `,
      },
    },
  },
  render: () => (
    <div style={{ padding: '20px' }}>
      <Alert variant="info" title="Section Name Detection">
        The ApiErrorBoundary detects the current section from the URL path and displays an appropriate service name in error messages:
      </Alert>
      <ul style={{ marginTop: '16px' }}>
        <li>
          <code>/users</code> or <code>/users/...</code> → Shows &quot;Users&quot;
        </li>
        <li>
          <code>/groups</code> or <code>/groups/...</code> → Shows &quot;Groups&quot;
        </li>
        <li>Any other path → Shows &quot;RBAC&quot;</li>
      </ul>
      <p style={{ marginTop: '16px' }}>
        See the <strong>Error403Forbidden</strong> and <strong>Error500ServerError</strong>
        stories for examples with different paths.
      </p>
    </div>
  ),
};
