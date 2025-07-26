import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, userEvent, within } from 'storybook/test';
import { Alert, Button, Spinner } from '@patternfly/react-core';
import { SuspendComponent } from './SuspendComponent';

// Mock data that would be loaded asynchronously
const mockUserData = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  role: 'Administrator',
};

const mockPermissions = [
  { id: 1, name: 'Read Users', resource: 'users' },
  { id: 2, name: 'Write Users', resource: 'users' },
  { id: 3, name: 'Delete Users', resource: 'users' },
];

// Mock async functions that simulate API calls
const loadUserData =
  (delay = 1000) =>
  () =>
    new Promise((resolve) => {
      setTimeout(() => resolve(mockUserData), delay);
    });

const loadPermissions =
  (delay = 1500) =>
  () =>
    new Promise((resolve) => {
      setTimeout(() => resolve(mockPermissions), delay);
    });

// Unused function - keeping for potential future use
// const loadWithError =
//   (delay = 800) =>
//   () =>
//     new Promise((_, reject) => {
//       setTimeout(() => reject(new Error('Failed to load data')), delay);
//     });

// Callback components that render the loaded data
const UserProfile = (userData: typeof mockUserData, props: any) => (
  <div data-testid="user-profile" style={{ padding: '16px', border: '1px solid #ccc', borderRadius: '4px' }}>
    <h3>User Profile {props.title && `- ${props.title}`}</h3>
    <p>
      <strong>Name:</strong> {userData.name}
    </p>
    <p>
      <strong>Email:</strong> {userData.email}
    </p>
    <p>
      <strong>Role:</strong> {userData.role}
    </p>
  </div>
);

const PermissionsList = (permissions: typeof mockPermissions) => (
  <div data-testid="permissions-list" style={{ padding: '16px', border: '1px solid #ccc', borderRadius: '4px' }}>
    <h3>Permissions</h3>
    <ul>
      {permissions.map((permission) => (
        <li key={permission.id}>
          {permission.name} ({permission.resource})
        </li>
      ))}
    </ul>
  </div>
);

// Unused component - keeping for potential future use
// const ErrorComponent = () => (
//   <Alert variant="danger" title="Failed to load component" data-testid="error-alert">
//     Something went wrong while loading the async component.
//   </Alert>
// );

// Loading spinners for different scenarios
const SimpleSpinner = () => <Spinner size="md" data-testid="simple-spinner" />;

const DetailedLoader = () => (
  <div data-testid="detailed-loader" style={{ textAlign: 'center', padding: '20px' }}>
    <Spinner size="lg" />
    <p style={{ marginTop: '8px' }}>Loading user data...</p>
  </div>
);

// Interactive demo wrapper
const InteractiveDemo: React.FC<{
  asyncFunction: () => Promise<any>;
  callback: (data: any, props?: any) => JSX.Element;
  fallback?: React.ReactNode;
  title?: string;
}> = ({ asyncFunction, callback, fallback, title }) => {
  const [key, setKey] = React.useState(0);

  return (
    <div style={{ padding: '20px' }}>
      <Alert variant="info" isInline title="Suspend Component Demo" style={{ marginBottom: '16px' }}>
        This demonstrates async component loading with React Suspense
      </Alert>

      <Button variant="primary" onClick={() => setKey((k) => k + 1)} style={{ marginBottom: '16px' }} data-testid="reload-button">
        Reload Component
      </Button>

      <div style={{ minHeight: '120px', border: '1px dashed #ccc', padding: '16px', borderRadius: '4px' }}>
        <SuspendComponent key={key} asyncFunction={asyncFunction} callback={callback} fallback={fallback} title={title} />
      </div>
    </div>
  );
};

const meta: Meta<typeof SuspendComponent> = {
  component: SuspendComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
SuspendComponent is a utility component that wraps React Suspense to handle asynchronous component loading. It provides a clean way to load components dynamically with loading states.

## Features
- Wraps React.Suspense for async component loading
- Supports custom fallback components during loading
- Passes props to the loaded component
- Handles promise-based async functions
- Provides error boundaries for failed loads

## Usage
Provide an async function that returns a Promise, a callback function that renders the loaded data, and an optional fallback component for the loading state.
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '20px', maxWidth: '800px' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    asyncFunction: loadUserData(500),
    callback: UserProfile,
    fallback: <SimpleSpinner />,
  },
  argTypes: {
    asyncFunction: {
      description: 'Function that returns a Promise resolving to data',
      control: false,
      table: {
        type: { summary: '() => Promise<any>' },
      },
    },
    callback: {
      description: 'Function that renders the loaded data',
      control: false,
      table: {
        type: { summary: '(data: any, props: any) => JSX.Element' },
      },
    },
    fallback: {
      description: 'React node to show while loading (defaults to empty Fragment)',
      control: false,
      table: {
        type: { summary: 'ReactNode' },
      },
    },
  },
} satisfies Meta<typeof SuspendComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default usage with a simple loading spinner
 */
export const Default: Story = {
  args: {
    asyncFunction: loadUserData(500),
    callback: UserProfile,
    fallback: <SimpleSpinner />,
  },
};

/**
 * Interactive demo showing loading behavior
 */
export const InteractiveDemoStory: Story = {
  render: () => <InteractiveDemo asyncFunction={loadUserData(1000)} callback={UserProfile} fallback={<DetailedLoader />} title="Interactive Demo" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for initial load
    await expect(canvas.getByTestId('detailed-loader')).toBeInTheDocument();

    // Wait for component to load
    await expect(canvas.findByTestId('user-profile')).resolves.toBeInTheDocument();

    // Verify loaded content
    expect(canvas.getByText('John Doe')).toBeInTheDocument();
    expect(canvas.getByText('john.doe@example.com')).toBeInTheDocument();

    // Test reload functionality
    await userEvent.click(canvas.getByTestId('reload-button'));

    // Should show loader again
    await expect(canvas.getByTestId('detailed-loader')).toBeInTheDocument();
  },
};

/**
 * Different types of loading fallbacks
 */
export const CustomFallbacks: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: '1fr 1fr' }}>
      <div>
        <h4>Simple Spinner</h4>
        <SuspendComponent asyncFunction={loadUserData(800)} callback={UserProfile} fallback={<SimpleSpinner />} />
      </div>

      <div>
        <h4>Detailed Loader</h4>
        <SuspendComponent asyncFunction={loadPermissions(1200)} callback={PermissionsList} fallback={<DetailedLoader />} />
      </div>
    </div>
  ),
};

/**
 * No fallback (uses default empty Fragment)
 */
export const NoFallback: Story = {
  args: {
    asyncFunction: loadUserData(300),
    callback: UserProfile,
    // No fallback prop - will use default Fragment
  },
  parameters: {
    docs: {
      description: {
        story: 'When no fallback is provided, an empty Fragment is used as the default.',
      },
    },
  },
};

/**
 * Loading different types of data
 */
export const DifferentDataTypes: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '20px' }}>
      <div>
        <h4>User Data</h4>
        <SuspendComponent
          asyncFunction={loadUserData(600)}
          callback={UserProfile}
          fallback={<div data-testid="user-loader">Loading user...</div>}
          title="From Async Load"
        />
      </div>

      <div>
        <h4>Permissions List</h4>
        <SuspendComponent
          asyncFunction={loadPermissions(900)}
          callback={PermissionsList}
          fallback={<div data-testid="permissions-loader">Loading permissions...</div>}
        />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Check that loaders are shown initially
    expect(canvas.getByTestId('user-loader')).toBeInTheDocument();
    expect(canvas.getByTestId('permissions-loader')).toBeInTheDocument();

    // Wait for user data to load
    await expect(canvas.findByTestId('user-profile')).resolves.toBeInTheDocument();

    // Wait for permissions to load
    await expect(canvas.findByTestId('permissions-list')).resolves.toBeInTheDocument();
  },
};

/**
 * Fast loading (almost no loading state visible)
 */
export const FastLoading: Story = {
  args: {
    asyncFunction: loadUserData(50), // Very fast load
    callback: UserProfile,
    fallback: <div data-testid="fast-loader">Quick load...</div>,
  },
  parameters: {
    docs: {
      description: {
        story: 'For very fast loading, the fallback might barely be visible.',
      },
    },
  },
};

/**
 * Props passing demonstration
 */
export const PropsPassingDemo: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '20px' }}>
      <SuspendComponent asyncFunction={loadUserData(600)} callback={UserProfile} fallback={<SimpleSpinner />} title="Admin Dashboard" theme="dark" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Additional props are passed through to the callback component.',
      },
    },
  },
};
