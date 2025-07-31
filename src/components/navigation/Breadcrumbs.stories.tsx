import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { RbacBreadcrumbs } from './Breadcrumbs';

const meta: Meta<typeof RbacBreadcrumbs> = {
  component: RbacBreadcrumbs,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
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
      description: 'Array of breadcrumb items to display',
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
    breadcrumbs: [
      {
        title: 'User Access Management',
        to: '/',
      },
      {
        title: 'Groups',
        to: '/groups',
      },
      {
        title: 'Engineering Team',
        isActive: true,
      },
    ],
  },
};

/**
 * Simple two-level breadcrumbs
 */
export const Simple: Story = {
  args: {
    breadcrumbs: [
      {
        title: 'Home',
        to: '/',
      },
      {
        title: 'Current Page',
        isActive: true,
      },
    ],
  },
};

/**
 * Single breadcrumb (active only)
 */
export const Single: Story = {
  args: {
    breadcrumbs: [
      {
        title: 'Dashboard',
        isActive: true,
      },
    ],
  },
};

/**
 * With loading placeholder
 */
export const WithPlaceholder: Story = {
  args: {
    breadcrumbs: [
      {
        title: 'User Access',
        to: '/',
      },
      {
        title: 'Groups',
        to: '/groups',
      },
      {
        // No title - will show placeholder
        isActive: true,
      },
    ],
  },
};

/**
 * Complex navigation path
 */
export const ComplexPath: Story = {
  args: {
    breadcrumbs: [
      {
        title: 'Console',
        to: '/',
      },
      {
        title: 'User Access Management',
        to: '/access',
      },
      {
        title: 'Groups',
        to: '/groups',
      },
      {
        title: 'Engineering',
        to: '/groups/engineering',
      },
      {
        title: 'Members',
        isActive: true,
      },
    ],
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
          breadcrumbs={[
            { title: 'Home', to: '/', isActive: false },
            { title: 'Users', to: '/users', isActive: false },
            { title: 'John Doe', isActive: true },
          ]}
        />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ marginBottom: '8px', color: '#151515' }}>With Loading State:</h4>
        <RbacBreadcrumbs
          breadcrumbs={[
            { title: 'Home', to: '/', isActive: false },
            {}, // No title - shows placeholder
            { title: 'Current Page', isActive: true },
          ]}
        />
      </div>

      <div>
        <h4 style={{ marginBottom: '8px', color: '#151515' }}>Single Active Item:</h4>
        <RbacBreadcrumbs breadcrumbs={[{ title: 'Dashboard', isActive: true }]} />
      </div>
    </div>
  ),
};
