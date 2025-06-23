import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import RbacBreadcrumbs from './breadcrumbs';

const meta: Meta<typeof RbacBreadcrumbs> = {
  component: RbacBreadcrumbs,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
RbacBreadcrumbs component displays navigation breadcrumbs for the RBAC application.
It supports both simple text breadcrumbs and clickable navigation links.

## Features
- Renders breadcrumb navigation using PatternFly components
- Supports clickable NavLink items that integrate with React Router
- Shows loading placeholders for items without titles
- Handles both active and inactive breadcrumb states
- Automatically maps over breadcrumb objects
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div style={{ padding: '20px', maxWidth: '800px' }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
  argTypes: {
    breadcrumbs: {
      description: 'Object containing breadcrumb items with title, to, and isActive properties',
      control: 'object',
    },
  },
} satisfies Meta<typeof RbacBreadcrumbs>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default breadcrumbs with multiple levels
 */
export const Default: Story = {
  args: {
    breadcrumbs: {
      home: {
        title: 'User Access',
        to: '/',
        isActive: false,
      },
      groups: {
        title: 'Groups',
        to: '/groups',
        isActive: false,
      },
      current: {
        title: 'Group Details',
        isActive: true,
      },
    },
  },
};

/**
 * Simple two-level breadcrumb
 */
export const Simple: Story = {
  args: {
    breadcrumbs: {
      home: {
        title: 'User Access',
        to: '/',
        isActive: false,
      },
      current: {
        title: 'Users',
        isActive: true,
      },
    },
  },
};

/**
 * Single breadcrumb item (typically the current page)
 */
export const SingleItem: Story = {
  args: {
    breadcrumbs: {
      current: {
        title: 'Dashboard',
        isActive: true,
      },
    },
  },
};

/**
 * All items with navigation links (none active)
 */
export const AllNavigable: Story = {
  args: {
    breadcrumbs: {
      home: {
        title: 'User Access',
        to: '/',
        isActive: false,
      },
      section: {
        title: 'Access Management',
        to: '/access-management',
        isActive: false,
      },
      subsection: {
        title: 'User Groups',
        to: '/access-management/user-groups',
        isActive: false,
      },
    },
  },
};

/**
 * With loading placeholders for missing titles
 */
export const WithPlaceholders: Story = {
  args: {
    breadcrumbs: {
      home: {
        title: 'User Access',
        to: '/',
        isActive: false,
      },
      loading: {
        // No title - will show placeholder
        isActive: false,
      },
      current: {
        title: 'Loading Page',
        isActive: true,
      },
    },
  },
};

/**
 * Deep navigation example
 */
export const DeepNavigation: Story = {
  args: {
    breadcrumbs: {
      root: {
        title: 'Identity & Access Management',
        to: '/iam',
        isActive: false,
      },
      userAccess: {
        title: 'User Access',
        to: '/iam/user-access',
        isActive: false,
      },
      groups: {
        title: 'Groups',
        to: '/iam/user-access/groups',
        isActive: false,
      },
      groupDetail: {
        title: 'Engineering Team',
        to: '/iam/user-access/groups/123',
        isActive: false,
      },
      editMembers: {
        title: 'Edit Members',
        isActive: true,
      },
    },
  },
};

/**
 * Empty breadcrumbs (returns null)
 */
export const Empty: Story = {
  args: {
    breadcrumbs: undefined,
  },
};

/**
 * Interactive example showing different states
 */
export const Interactive: Story = {
  render: () => (
    <div>
      <h3>Different Breadcrumb Configurations:</h3>

      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ marginBottom: '8px', color: '#151515' }}>Standard Navigation:</h4>
        <RbacBreadcrumbs
          breadcrumbs={{
            home: { title: 'Home', to: '/', isActive: false },
            users: { title: 'Users', to: '/users', isActive: false },
            current: { title: 'John Doe', isActive: true },
          }}
        />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ marginBottom: '8px', color: '#151515' }}>With Loading State:</h4>
        <RbacBreadcrumbs
          breadcrumbs={{
            home: { title: 'Home', to: '/', isActive: false },
            loading: {}, // No title - shows placeholder
            current: { title: 'Current Page', isActive: true },
          }}
        />
      </div>

      <div>
        <h4 style={{ marginBottom: '8px', color: '#151515' }}>Single Active Item:</h4>
        <RbacBreadcrumbs
          breadcrumbs={{
            dashboard: { title: 'Dashboard', isActive: true },
          }}
        />
      </div>
    </div>
  ),
};
