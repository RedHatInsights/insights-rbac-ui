import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { Button, Label } from '@patternfly/react-core';
import { PageLayout, PageTitle } from './PageLayout';

interface BreadcrumbItemProps {
  title?: string;
  to?: string;
  isActive?: boolean;
}

// Combined component for showcasing both toolbar components
const CombinedToolbar: React.FC<{
  title?: React.ReactNode;
  description?: React.ReactNode;
  breadcrumbs?: BreadcrumbItemProps[];
  renderTitleTag?: () => React.ReactNode;
  children?: React.ReactNode;
}> = ({ title, description, breadcrumbs, renderTitleTag, children }) => (
  <PageLayout breadcrumbs={breadcrumbs}>
    <PageTitle title={title} description={description} renderTitleTag={renderTitleTag}>
      {children}
    </PageTitle>
  </PageLayout>
);

const meta: Meta<typeof CombinedToolbar> = {
  component: CombinedToolbar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
PageLayout and PageTitle are layout components that provide consistent page headers throughout the RBAC application.

## Components

- **PageLayout**: Main container that handles breadcrumbs and page header layout
- **PageTitle**: Title section with support for descriptions, tags, and additional content

## Features
- Integrates with RBAC breadcrumb navigation
- Supports page titles with loading placeholders
- Flexible description content (string or ReactNode)
- Custom title tags and additional content areas
- Consistent styling with Red Hat design system
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
      control: 'text',
      description: 'Page title text or ReactNode',
    },
    description: {
      control: 'text',
      description: 'Page description (string or ReactNode)',
    },
    breadcrumbs: {
      control: 'object',
      description: 'Breadcrumb navigation object',
    },
    renderTitleTag: {
      description: 'Function that returns a tag component to display next to the title',
    },
    children: {
      description: 'Additional content to display below title and description',
    },
  },
} satisfies Meta<typeof CombinedToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic page header with title only
 */
export const Default: Story = {
  args: {
    title: 'User Access Management',
  },
};

/**
 * Complete page header with breadcrumbs and description
 */
export const WithBreadcrumbs: Story = {
  args: {
    title: 'Groups',
    description: 'Manage user groups and their access permissions.',
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
export const WithTitleTag: Story = {
  args: {
    title: 'Beta Features',
    description: 'Try out new functionality before it becomes generally available.',
    renderTitleTag: () => (
      <Label color="blue" isCompact>
        Beta
      </Label>
    ),
  },
};

/**
 * Deep navigation with multiple breadcrumb levels
 */
export const DeepNavigation: Story = {
  args: {
    title: 'Engineering Team',
    description: 'Manage members and permissions for the Engineering team group.',
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
    renderTitleTag: () => (
      <Label color="grey" isCompact>
        12 members
      </Label>
    ),
  },
};

/**
 * Complex description with ReactNode content
 */
export const ComplexDescription: Story = {
  args: {
    title: 'Service Accounts',
    description: (
      <div>
        <p>Service accounts provide programmatic access to Red Hat services.</p>
        <p style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>Create and manage service accounts for automated integrations.</p>
      </div>
    ),
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
 * With additional content/actions
 */
export const WithActions: Story = {
  args: {
    title: 'Roles',
    description: 'Define custom roles and permissions for your organization.',
    breadcrumbs: [
      {
        title: 'User Access',
        to: '/',
        isActive: false,
      },
      {
        title: 'Roles',
        isActive: true,
      },
    ],
    children: (
      <div style={{ marginTop: '16px' }}>
        <Button variant="primary" style={{ marginRight: '8px' }}>
          Create role
        </Button>
        <Button variant="link">View documentation</Button>
      </div>
    ),
  },
};

/**
 * Loading state (title will show placeholder)
 */
export const LoadingTitle: Story = {
  args: {
    title: undefined, // Will show ToolbarTitlePlaceholder
    description: 'Loading page information...',
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
    title: 'Dashboard',
  },
};

/**
 * Individual PageLayout component
 */
export const ToolbarOnly: StoryObj<typeof PageLayout> = {
  render: () => (
    <PageLayout
      breadcrumbs={[
        { title: 'User Access', to: '/', isActive: false },
        { title: 'Settings', isActive: true },
      ]}
    >
      <div style={{ padding: '16px', background: '#f0f0f0', borderRadius: '4px' }}>Custom toolbar content goes here</div>
    </PageLayout>
  ),
  parameters: {
    docs: {
      description: {
        story: 'PageLayout used independently with custom content.',
      },
    },
  },
};

/**
 * Individual PageTitle component
 */
export const TitleOnly: StoryObj<typeof PageTitle> = {
  render: () => (
    <div style={{ padding: '20px' }}>
      <PageTitle
        title="Standalone Title"
        description="This title component can be used outside of PageLayout."
        renderTitleTag={() => <Label color="green">Active</Label>}
      >
        <div style={{ marginTop: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>Additional content area</div>
      </PageTitle>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'PageTitle used independently for custom layouts.',
      },
    },
  },
};
