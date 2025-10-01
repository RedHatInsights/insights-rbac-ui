import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { expect, within } from 'storybook/test';
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

/**
 * Test story to verify links are properly constructed with basename
 */
export const LinkGenerationTest: Story = {
  name: 'Link Generation Test',
  args: {
    breadcrumbs: [
      {
        title: 'Groups',
        to: '/groups',
      },
      {
        title: 'Test Group',
        to: '/groups/detail/test-id/roles',
      },
      {
        title: 'Current Page',
        isActive: true,
      },
    ],
  },
  parameters: {
    docs: { disable: true }, // Hide from docs as this is a test story
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find the breadcrumb links
    const groupsLink = await canvas.findByRole('link', { name: 'Groups' });
    const testGroupLink = await canvas.findByRole('link', { name: 'Test Group' });

    // Verify that links have proper basename prefixes
    // The useAppLink hook should convert "/groups" to "/iam/user-access/groups"
    expect(groupsLink.getAttribute('href')).toBe('/iam/user-access/groups');
    expect(testGroupLink.getAttribute('href')).toBe('/iam/user-access/groups/detail/test-id/roles');

    console.log('✅ Breadcrumb links properly generated with basename');
  },
};
