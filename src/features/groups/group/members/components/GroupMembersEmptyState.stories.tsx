import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { Table, Th, Thead, Tr } from '@patternfly/react-table/dist/dynamic/components/Table';
import { IntlProvider } from 'react-intl';
import { GroupMembersEmptyState } from './GroupMembersEmptyState';

const meta: Meta<typeof GroupMembersEmptyState> = {
  title: 'Features/Groups/Members/Components/GroupMembersEmptyState',
  component: GroupMembersEmptyState,
  parameters: {
    docs: {
      description: {
        component: `
**GroupMembersEmptyState** is a table-aware empty state component specifically designed for the GroupMembers table.

### Key Features
- **Table Layout Compatibility**: Properly wrapped with \`tbody\` and \`td\` elements
- **Conditional Messaging**: Different messages for filtered vs unfiltered empty states  
- **Internationalization**: Uses react-intl for localized messages
- **Proper Accessibility**: Uses EmptyState components with appropriate heading levels

### Usage
This component is designed to be used within \`DataViewTable\` bodyStates configuration:

\`\`\`tsx
<DataViewTable
  bodyStates={{
    empty: <GroupMembersEmptyState colSpan={columns.length} hasActiveFilters={hasFilters} />
  }}
/>
\`\`\`

The component automatically handles:
- Column spanning for full-width display
- Proper table DOM structure
- Filter-aware messaging
- Consistent styling with PatternFly EmptyState
        `,
      },
    },
  },
  args: {
    colSpan: 4,
    hasActiveFilters: false,
  },
  argTypes: {
    colSpan: {
      control: { type: 'number', min: 1, max: 10 },
      description: 'Number of table columns for proper colSpan',
    },
    hasActiveFilters: {
      control: 'boolean',
      description: 'Whether there are active filters applied (changes the message)',
    },
  },
  decorators: [
    (Story, { args }) => (
      <IntlProvider locale="en">
        <Table aria-label="Example table for empty state">
          <Thead>
            <Tr>
              <Th>Status</Th>
              <Th>Username</Th>
              <Th>Email</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Story {...args} />
        </Table>
      </IntlProvider>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default empty state shown when no members exist and no filters are applied
 */
export const NoMembers: Story = {
  args: {
    colSpan: 4,
    hasActiveFilters: false,
  },
};

/**
 * Empty state shown when filters are applied but no matching members found
 */
export const NoMatchingMembers: Story = {
  args: {
    colSpan: 4,
    hasActiveFilters: true,
  },
};

/**
 * Example with different column count (demonstrates responsive colSpan)
 */
export const WideTable: Story = {
  args: {
    colSpan: 8,
    hasActiveFilters: false,
  },
};

/**
 * Example with filtered state on wide table
 */
export const WideTableFiltered: Story = {
  args: {
    colSpan: 8,
    hasActiveFilters: true,
  },
};
