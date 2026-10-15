import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { IntlProvider } from 'react-intl';
import { GroupMembersEmptyState } from './GroupMembersEmptyState';

const meta: Meta<typeof GroupMembersEmptyState> = {
  title: 'Features/Groups/Members/Components/GroupMembersEmptyState',
  component: GroupMembersEmptyState,
  parameters: {
    docs: {
      description: {
        component: `
**GroupMembersEmptyState** is an empty state component for the GroupMembers table.

### Key Features
- **Conditional Messaging**: Different messages for filtered vs unfiltered empty states  
- **Internationalization**: Uses react-intl for localized messages
- **Proper Accessibility**: Uses EmptyState components with appropriate heading levels

### Usage
This component is designed to be used with \`TableView\`'s empty state props:

\`\`\`tsx
<TableView
  emptyStateNoData={<GroupMembersEmptyState hasActiveFilters={false} />}
  emptyStateNoResults={<GroupMembersEmptyState hasActiveFilters={true} />}
/>
\`\`\`
        `,
      },
    },
  },
  args: {
    hasActiveFilters: false,
  },
  argTypes: {
    hasActiveFilters: {
      control: 'boolean',
      description: 'Whether there are active filters applied (changes the message)',
    },
  },
  decorators: [
    (Story) => (
      <IntlProvider locale="en">
        <Story />
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
    hasActiveFilters: false,
  },
};

/**
 * Empty state shown when filters are applied but no matching members found
 */
export const NoMatchingMembers: Story = {
  args: {
    hasActiveFilters: true,
  },
};
