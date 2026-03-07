import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { BrowserRouter } from 'react-router-dom';
import { RolesEmptyState } from './RolesEmptyState';
import { fn } from 'storybook/test';

const meta: Meta<typeof RolesEmptyState> = {
  component: RolesEmptyState,
  parameters: {
    docs: {
      description: {
        component: `
**RolesEmptyState** displays empty state messages for the roles table.

## Responsibilities
- **No Data State**: Shows when no roles exist at all
- **Filtered State**: Shows when filtering results in no matches
- **Admin Actions**: Provides "Create Role" button for admin users

### Usage with TableView
\`\`\`tsx
<TableView
  emptyStateNoData={<RolesEmptyState hasActiveFilters={false} isAdmin={isAdmin} />}
  emptyStateNoResults={<RolesEmptyState hasActiveFilters={true} isAdmin={isAdmin} onClearFilters={handleClear} />}
/>
\`\`\`
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RolesEmptyState>;

export const NoRoles: Story = {
  args: {
    hasActiveFilters: false,
    isAdmin: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state when no roles exist in the system.',
      },
    },
  },
};

export const NoRolesAdmin: Story = {
  args: {
    hasActiveFilters: false,
    isAdmin: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state for admin users with "Create Role" action button.',
      },
    },
  },
};

export const NoMatchingRoles: Story = {
  args: {
    hasActiveFilters: true,
    isAdmin: false,
    onClearFilters: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Empty state when filtering results in no matches.',
      },
    },
  },
};

export const NoMatchingRolesAdmin: Story = {
  args: {
    hasActiveFilters: true,
    isAdmin: true,
    onClearFilters: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Filtered empty state for admin users with clear filters action.',
      },
    },
  },
};
