import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { BrowserRouter } from 'react-router-dom';
import { Table } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Thead } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Tr } from '@patternfly/react-table/dist/dynamic/components/Table';
import { Th } from '@patternfly/react-table/dist/dynamic/components/Table';
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
- **Table Context**: Renders as \`<Tbody>\` to work within PatternFly table structure
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <BrowserRouter>
        <Table aria-label="Empty state demo">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Description</Th>
              <Th>Groups</Th>
              <Th>Permissions</Th>
              <Th>Last Modified</Th>
            </Tr>
          </Thead>
          <Story />
        </Table>
      </BrowserRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RolesEmptyState>;

export const NoRoles: Story = {
  args: {
    colSpan: 5,
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
    colSpan: 6,
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
    colSpan: 5,
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
    colSpan: 6,
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
