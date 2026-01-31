import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { HttpResponse, delay, http } from 'msw';
import { expect, waitFor, within } from 'storybook/test';
import { MemoryRouter } from 'react-router-dom';
import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { IntlProvider } from 'react-intl';
import messages from '../../locales/data.json';
import { locale } from '../../locales/locale';
import { ApiErrorBoundary } from './ApiErrorBoundary';
import { useGroupsQuery } from '../../data/queries/groups';

// ============================================================================
// Test Component - Uses real useGroupsQuery
// ============================================================================

/**
 * Simple component that fetches groups using the real query.
 * Errors flow through: QueryClient.onError → handleError → ApiErrorContext → ApiErrorBoundary
 */
const GroupsList: React.FC = () => {
  const { data, isLoading, error } = useGroupsQuery({ limit: 10 });

  if (isLoading) return <p>Loading groups...</p>;
  if (error)
    return (
      <Alert variant="danger" title="Query Error" isInline>
        {(error as Error).message}
      </Alert>
    );
  if (data?.data) return <p>Loaded {data.data.length} groups</p>;
  return null;
};

// ============================================================================
// Story Wrapper - Only adds MemoryRouter and ApiErrorBoundary
// preview.tsx provides: ServiceProvider, QueryClientSetup, ApiErrorProvider
// ============================================================================

const StoryWrapper: React.FC<{ children: React.ReactNode; initialPath?: string }> = ({ children, initialPath = '/users' }) => (
  <MemoryRouter initialEntries={[initialPath]}>
    <ApiErrorBoundary>{children}</ApiErrorBoundary>
  </MemoryRouter>
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
        http.get('/api/rbac/v1/groups/', async () => {
          await delay(100);
          return HttpResponse.json({
            meta: { count: 2 },
            data: [
              { uuid: '1', name: 'Group 1' },
              { uuid: '2', name: 'Group 2' },
            ],
          });
        }),
      ],
    },
  },
  render: () => (
    <StoryWrapper>
      <GroupsList />
    </StoryWrapper>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for loading to complete and verify groups loaded
    await waitFor(() => {
      expect(canvas.queryByText('Loading groups...')).not.toBeInTheDocument();
    });
    await expect(canvas.findByText(/Loaded 2 groups/)).resolves.toBeInTheDocument();
  },
};

/**
 * 403 Forbidden error shows UnauthorizedAccess component.
 */
export const Error403Forbidden: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/', async () => {
          await delay(100);
          return HttpResponse.json({ error: 'Forbidden' }, { status: 403 });
        }),
      ],
    },
  },
  render: () => (
    <StoryWrapper initialPath="/groups">
      <GroupsList />
    </StoryWrapper>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for the 403 error state to be displayed
    await waitFor(
      () => {
        expect(canvas.getByText(/you do not have access/i)).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  },
};

/**
 * 500 Server Error shows UnavailableContent component.
 */
export const Error500ServerError: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/', async () => {
          await delay(100);
          return HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }),
      ],
    },
  },
  render: () => (
    <StoryWrapper initialPath="/groups">
      <GroupsList />
    </StoryWrapper>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for the 500 error state to be displayed
    await waitFor(
      () => {
        expect(canvas.getByText(/temporarily unavailable/i)).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  },
};

/**
 * 502 Bad Gateway also triggers the 500 error state.
 */
export const Error502BadGateway: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/', async () => {
          await delay(100);
          return HttpResponse.json({ error: 'Bad Gateway' }, { status: 502 });
        }),
      ],
    },
  },
  render: () => (
    <StoryWrapper>
      <GroupsList />
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
        http.get('/api/rbac/v1/groups/', async () => {
          await delay(100);
          return HttpResponse.json({ error: 'Not Found' }, { status: 404 });
        }),
      ],
    },
  },
  render: () => (
    <StoryWrapper>
      <GroupsList />
    </StoryWrapper>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for the error to appear in the component (not caught by ApiErrorBoundary)
    await waitFor(
      () => {
        expect(canvas.getByText(/Query Error/)).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
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
- \`/user-access/groups\` → "Groups"
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
