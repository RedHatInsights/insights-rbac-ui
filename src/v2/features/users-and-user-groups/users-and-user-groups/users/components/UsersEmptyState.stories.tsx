import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { IntlProvider } from 'react-intl';
import { DataView, DataViewTable } from '@patternfly/react-data-view';
import { UsersEmptyState } from './UsersEmptyState';

const meta: Meta<typeof UsersEmptyState> = {
  title: 'Features/Access-Management/Users/Components/UsersEmptyState',
  component: UsersEmptyState,
  parameters: {
    docs: {
      description: {
        component: `
**UsersEmptyState** is a simple empty state component for the Users table using the PatternFly EmptyTable component.

### Key Features
- **Standard EmptyTable**: Uses PatternFly's EmptyTable component for consistency
- **Internationalization**: Uses react-intl for localized messages
- **Customizable**: Supports custom title text override
- **Table Layout Compatibility**: Works within DataViewTable bodyStates

### Usage
This component is designed to be used within \`DataViewTable\` bodyStates configuration:

\`\`\`tsx
<DataViewTable
  bodyStates={{
    empty: <UsersEmptyState />
  }}
/>
\`\`\`

The component automatically handles:
- Default localized title from messages
- Proper table layout compatibility
- Consistent styling with other empty states
        `,
      },
    },
  },
  args: {
    titleText: undefined,
  },
  argTypes: {
    titleText: {
      control: 'text',
      description: 'Custom title text (optional, defaults to localized message)',
    },
  },
  decorators: [
    (Story) => (
      <IntlProvider locale="en">
        <DataView>
          <DataViewTable
            aria-label="Example users table"
            columns={[{ cell: 'Username' }, { cell: 'Email' }, { cell: 'Status' }, { cell: 'Actions' }]}
            rows={[]}
            bodyStates={{
              empty: <Story />,
            }}
          />
        </DataView>
      </IntlProvider>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default empty state with standard localized message
 */
export const Default: Story = {
  args: {
    titleText: undefined,
  },
};

/**
 * Empty state with custom title text
 */
export const CustomTitle: Story = {
  args: {
    titleText: 'No users found in your organization',
  },
};

/**
 * Empty state with very long custom title to test text wrapping
 */
export const LongTitle: Story = {
  args: {
    titleText: 'No users have been added to your organization yet. Contact your administrator to add users or check your permissions.',
  },
};
