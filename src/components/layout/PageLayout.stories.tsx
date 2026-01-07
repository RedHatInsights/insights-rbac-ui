import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { Label } from '@patternfly/react-core/dist/dynamic/components/Label';
import { PageLayout } from './PageLayout';

const meta: Meta<typeof PageLayout> = {
  component: PageLayout,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
PageLayout is a layout component that provides consistent page structure throughout the RBAC application.

## Features
- Integrates with RBAC breadcrumb navigation
- Supports page titles with loading placeholders
- Flexible description content (string or ReactNode)
- Label/tag support for status indicators
- Action menu support for page-level actions
- Content area with proper spacing
- Wraps PageHeader from @patternfly/react-component-groups
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div style={{ minHeight: '200px' }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
  argTypes: {
    title: {
      control: 'object',
      description: 'Page title configuration object with title, description, label, and actionMenu',
    },
    breadcrumbs: {
      control: 'object',
      description: 'Breadcrumb navigation object',
    },
    children: {
      description: 'Page content that appears below the title',
    },
  },
} satisfies Meta<typeof PageLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic page header with title only
 */
export const Default: Story = {
  args: {
    title: {
      title: 'User Access Management',
    },
  },
};

/**
 * Complete page header with breadcrumbs and description
 */
export const WithBreadcrumbs: Story = {
  args: {
    title: {
      title: 'Groups',
      description: 'Manage user groups and their access permissions.',
    },
    breadcrumbs: [
      {
        title: 'User Access',
        to: '/',
        isActive: false,
      },
      {
        title: 'Groups',
        isActive: true,
      },
    ],
  },
};

/**
 * Page header with title tag/badge
 */
export const WithLabel: Story = {
  args: {
    title: {
      title: 'Beta Features',
      description: 'Try out new functionality before it becomes generally available.',
      label: (
        <Label color="blue" isCompact>
          Beta
        </Label>
      ),
    },
  },
};

/**
 * Deep navigation with multiple breadcrumb levels
 */
export const DeepNavigation: Story = {
  args: {
    title: {
      title: 'Engineering Team',
      description: 'Manage members and permissions for the Engineering team group.',
      label: (
        <Label color="grey" isCompact>
          12 members
        </Label>
      ),
    },
    breadcrumbs: [
      {
        title: 'User Access',
        to: '/',
        isActive: false,
      },
      {
        title: 'Groups',
        to: '/groups',
        isActive: false,
      },
      {
        title: 'Engineering Team',
        isActive: true,
      },
    ],
  },
};

/**
 * Complex description with ReactNode content
 */
export const ComplexDescription: Story = {
  args: {
    title: {
      title: 'Service Accounts',
      description: (
        <>
          <span>Service accounts provide programmatic access to Red Hat services.</span>
          <br />
          <span style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>Create and manage service accounts for automated integrations.</span>
        </>
      ),
    },
    breadcrumbs: [
      {
        title: 'User Access',
        to: '/',
        isActive: false,
      },
      {
        title: 'Service Accounts',
        isActive: true,
      },
    ],
  },
};

/**
 * Loading state (title will show placeholder)
 */
export const LoadingTitle: Story = {
  args: {
    title: {
      title: undefined, // Will show ToolbarTitlePlaceholder
      description: 'Loading page information...',
    },
    breadcrumbs: [
      {
        title: 'User Access',
        to: '/',
        isActive: false,
      },
      {
        // No title - will show placeholder in breadcrumbs too
        isActive: true,
      },
    ],
  },
};

/**
 * Minimal configuration
 */
export const Minimal: Story = {
  args: {
    title: {
      title: 'Dashboard',
    },
  },
};

/**
 * With page content
 */
export const WithContent: Story = {
  args: {
    title: {
      title: 'Settings',
      description: 'Manage your application settings.',
    },
    breadcrumbs: [
      { title: 'User Access', to: '/', isActive: false },
      { title: 'Settings', isActive: true },
    ],
    children: (
      <div style={{ padding: '16px', background: '#f0f0f0', borderRadius: '4px' }}>
        Page content goes here. The spacing between the title and this content is handled automatically by PageLayout.
      </div>
    ),
  },
};
