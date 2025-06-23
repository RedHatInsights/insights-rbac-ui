import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { AppPlaceholder, BreadcrumbPlaceholder, FormItemLoader, PolicyRolesLoader, ToolbarTitlePlaceholder } from './loader-placeholders';

// Create a wrapper component to showcase all placeholders
const AllPlaceholders: React.FC = () => (
  <div>
    <h3>App Placeholder</h3>
    <AppPlaceholder />

    <h3 style={{ marginTop: '24px' }}>Toolbar Title Placeholder</h3>
    <ToolbarTitlePlaceholder />

    <h3 style={{ marginTop: '24px' }}>Breadcrumb Placeholder</h3>
    <BreadcrumbPlaceholder />

    <h3 style={{ marginTop: '24px' }}>Form Item Loader</h3>
    <FormItemLoader />

    <h3 style={{ marginTop: '24px' }}>Policy Roles Loader</h3>
    <PolicyRolesLoader />
  </div>
);

const meta: Meta<typeof AllPlaceholders> = {
  component: AllPlaceholders,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
Collection of loading placeholder components used throughout the RBAC application.
These components provide skeleton loading states while data is being fetched.

## Available Placeholders

- **AppPlaceholder**: Full app loading state with title and table skeleton
- **ToolbarTitlePlaceholder**: Small skeleton for toolbar titles
- **BreadcrumbPlaceholder**: Skeleton for breadcrumb items
- **FormItemLoader**: Loading state for form fields
- **PolicyRolesLoader**: Form with multiple loading form items

All placeholders use consistent styling with PatternFly and Red Hat design system.
        `,
      },
    },
  },
} satisfies Meta<typeof AllPlaceholders>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Overview of all loading placeholders
 */
export const AllLoaders: Story = {};

// Individual component stories

export const AppLoader: StoryObj<typeof AppPlaceholder> = {
  render: () => <AppPlaceholder />,
  parameters: {
    docs: {
      description: {
        story: 'Used when loading the main application content including data tables.',
      },
    },
  },
};

export const ToolbarTitleLoader: StoryObj<typeof ToolbarTitlePlaceholder> = {
  render: () => <ToolbarTitlePlaceholder />,
  parameters: {
    docs: {
      description: {
        story: 'Used when page titles or toolbar headers are loading.',
      },
    },
  },
};

export const BreadcrumbLoader: StoryObj<typeof BreadcrumbPlaceholder> = {
  render: () => <BreadcrumbPlaceholder />,
  parameters: {
    docs: {
      description: {
        story: 'Used within breadcrumb navigation when route titles are loading.',
      },
    },
  },
};

export const FormItemSkeleton: StoryObj<typeof FormItemLoader> = {
  render: () => <FormItemLoader />,
  parameters: {
    docs: {
      description: {
        story: 'Used when form field options or values are being loaded.',
      },
    },
  },
};

export const PolicyRolesForm: StoryObj<typeof PolicyRolesLoader> = {
  render: () => <PolicyRolesLoader />,
  parameters: {
    docs: {
      description: {
        story: 'Used when loading forms with multiple fields, particularly role and policy forms.',
      },
    },
  },
};

/**
 * Usage examples in different contexts
 */
export const UsageExamples: Story = {
  render: () => (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h3>Loading States in Different Contexts:</h3>
      </div>

      <div style={{ marginBottom: '24px', padding: '16px', border: '1px solid #d2d2d2', borderRadius: '4px' }}>
        <h4 style={{ marginTop: '0', marginBottom: '16px' }}>Page Header Loading</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <BreadcrumbPlaceholder />
          <span>→</span>
          <ToolbarTitlePlaceholder />
        </div>
      </div>

      <div style={{ marginBottom: '24px', padding: '16px', border: '1px solid #d2d2d2', borderRadius: '4px' }}>
        <h4 style={{ marginTop: '0', marginBottom: '16px' }}>Form Loading State</h4>
        <PolicyRolesLoader />
      </div>

      <div style={{ marginBottom: '24px', padding: '16px', border: '1px solid #d2d2d2', borderRadius: '4px' }}>
        <h4 style={{ marginTop: '0', marginBottom: '16px' }}>Multiple Form Items</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <FormItemLoader />
          <FormItemLoader />
          <FormItemLoader />
        </div>
      </div>

      <div style={{ padding: '16px', border: '1px solid #d2d2d2', borderRadius: '4px' }}>
        <h4 style={{ marginTop: '0', marginBottom: '16px' }}>Full App Loading</h4>
        <AppPlaceholder />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Examples of how different loading placeholders are used in various UI contexts.',
      },
    },
  },
};
