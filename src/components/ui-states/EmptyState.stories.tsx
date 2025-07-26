import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { Button } from '@patternfly/react-core';
import { ExclamationTriangleIcon, LockIcon, PlusCircleIcon, SearchIcon } from '@patternfly/react-icons';
import { action } from 'storybook/actions';
import { EmptyWithAction } from './EmptyState';

const meta: Meta<typeof EmptyWithAction> = {
  component: EmptyWithAction,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
EmptyWithAction is a flexible empty state component that displays a title, description, and action buttons.
It's commonly used throughout the RBAC application to show empty states with clear calls-to-action.

## Features
- Customizable icon and title
- Supports multiple description lines
- Flexible action button configuration
- Small variant optimized for inline use
- Consistent styling with PatternFly EmptyState
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '20px', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    title: {
      control: 'text',
      description: 'The main title displayed in the empty state',
    },
    icon: {
      control: 'select',
      options: ['SearchIcon', 'PlusCircleIcon', 'ExclamationTriangleIcon', 'LockIcon'],
      mapping: {
        SearchIcon,
        PlusCircleIcon,
        ExclamationTriangleIcon,
        LockIcon,
      },
      description: 'Icon to display in the empty state header',
    },
    description: {
      control: 'object',
      description: 'Array of description lines to display in the body',
    },
    actions: {
      control: 'object',
      description: 'Action elements to display in the footer',
    },
  },
} satisfies Meta<typeof EmptyWithAction>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default empty state with search context
 */
export const Default: Story = {
  args: {
    title: 'No matching items found',
    icon: SearchIcon,
    description: ['No items match the current filter criteria.', 'Try adjusting your search or clearing filters to see more results.'],
    actions: (
      <Button variant="link" onClick={action('clear-filters')}>
        Clear all filters
      </Button>
    ),
  },
};

/**
 * Create new item empty state
 */
export const CreateNew: Story = {
  args: {
    title: 'No groups configured',
    icon: PlusCircleIcon,
    description: ['To configure user access and permissions,', 'create at least one group to get started.'],
    actions: (
      <Button variant="primary" icon={<PlusCircleIcon />} onClick={action('create-group')}>
        Create group
      </Button>
    ),
  },
};

/**
 * Warning/Error state
 */
export const Warning: Story = {
  args: {
    title: 'Access restricted',
    icon: ExclamationTriangleIcon,
    description: ['You do not have permission to view this content.', 'Contact your administrator for assistance.'],
    actions: (
      <Button variant="secondary" onClick={action('contact-admin')}>
        Contact administrator
      </Button>
    ),
  },
};

/**
 * Unauthorized access state
 */
export const Unauthorized: Story = {
  args: {
    title: 'Authentication required',
    icon: LockIcon,
    description: ['You must be signed in to access this resource.', 'Please log in to continue.'],
    actions: (
      <Button variant="primary" onClick={action('sign-in')}>
        Sign in
      </Button>
    ),
  },
};

/**
 * Multiple actions example
 */
export const MultipleActions: Story = {
  args: {
    title: 'No users found',
    icon: SearchIcon,
    description: ['There are no users in this organization.', 'You can invite users or import from another system.'],
    actions: (
      <div>
        <Button variant="primary" style={{ marginRight: '8px' }} onClick={action('invite-users')}>
          Invite users
        </Button>
        <Button variant="link" onClick={action('import-users')}>
          Import users
        </Button>
      </div>
    ),
  },
};

/**
 * Single line description
 */
export const SimpleDescription: Story = {
  args: {
    title: 'No data available',
    description: ['No information to display at this time.'],
    actions: (
      <Button variant="link" onClick={action('refresh')}>
        Refresh
      </Button>
    ),
  },
};

/**
 * No actions (read-only state)
 */
export const ReadOnly: Story = {
  args: {
    title: 'Empty workspace',
    icon: SearchIcon,
    description: ['This workspace contains no resources.', 'Resources will appear here once they are created.'],
    actions: null,
  },
};

/**
 * Custom icon with long description
 */
export const CustomIcon: Story = {
  args: {
    title: 'Service temporarily unavailable',
    icon: ExclamationTriangleIcon,
    description: [
      'The user management service is currently undergoing maintenance.',
      'This may affect your ability to create or modify user accounts.',
      'Please try again in a few minutes.',
    ],
    actions: (
      <Button variant="link" onClick={action('retry')}>
        Try again
      </Button>
    ),
  },
};

/**
 * Interactive example showing different use cases
 */
export const UseCases: Story = {
  render: () => {
    const [currentState, setCurrentState] = React.useState<'empty' | 'error' | 'loading' | 'success'>('empty');

    const stateConfigs = {
      empty: {
        title: 'No roles configured',
        icon: PlusCircleIcon,
        description: ['Create your first role to get started with access management.'],
        actions: (
          <Button variant="primary" onClick={() => setCurrentState('success')}>
            Create role
          </Button>
        ),
      },
      error: {
        title: 'Failed to load roles',
        icon: ExclamationTriangleIcon,
        description: ['Unable to retrieve role information.', 'Please check your connection and try again.'],
        actions: (
          <Button variant="secondary" onClick={() => setCurrentState('empty')}>
            Retry
          </Button>
        ),
      },
      loading: {
        title: 'Loading roles...',
        description: ['Please wait while we fetch your role information.'],
        actions: null,
      },
      success: {
        title: 'Role created successfully!',
        icon: PlusCircleIcon,
        description: ['Your new role has been created and is ready to use.'],
        actions: (
          <Button variant="link" onClick={() => setCurrentState('empty')}>
            Create another
          </Button>
        ),
      },
    };

    const config = stateConfigs[currentState];

    return (
      <div>
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <Button
            variant={currentState === 'empty' ? 'primary' : 'secondary'}
            onClick={() => setCurrentState('empty')}
            style={{ marginRight: '8px' }}
          >
            Empty
          </Button>
          <Button
            variant={currentState === 'error' ? 'primary' : 'secondary'}
            onClick={() => setCurrentState('error')}
            style={{ marginRight: '8px' }}
          >
            Error
          </Button>
          <Button
            variant={currentState === 'loading' ? 'primary' : 'secondary'}
            onClick={() => setCurrentState('loading')}
            style={{ marginRight: '8px' }}
          >
            Loading
          </Button>
          <Button variant={currentState === 'success' ? 'primary' : 'secondary'} onClick={() => setCurrentState('success')}>
            Success
          </Button>
        </div>

        <EmptyWithAction {...config} />
      </div>
    );
  },
};
