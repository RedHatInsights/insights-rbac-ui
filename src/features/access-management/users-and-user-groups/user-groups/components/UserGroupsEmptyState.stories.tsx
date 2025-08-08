import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { IntlProvider } from 'react-intl';
import { DataView, DataViewTable } from '@patternfly/react-data-view';
import { UserGroupsEmptyState } from './UserGroupsEmptyState';

const meta: Meta<typeof UserGroupsEmptyState> = {
  title: 'Features/Access-Management/UserGroups/Components/UserGroupsEmptyState',
  component: UserGroupsEmptyState,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**UserGroupsEmptyState** is a simple empty state component for the UserGroups table using the PatternFly EmptyTable component.

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
    empty: <UserGroupsEmptyState />
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
            aria-label="Example user groups table"
            columns={[{ cell: 'Group Name' }, { cell: 'Members' }, { cell: 'Roles' }, { cell: 'Actions' }]}
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
    titleText: 'No user groups found in your organization',
  },
};

/**
 * Empty state with very long custom title to test text wrapping
 */
export const LongTitle: Story = {
  args: {
    titleText: 'No user groups have been created yet. Create user groups to organize users and manage permissions efficiently.',
  },
};
