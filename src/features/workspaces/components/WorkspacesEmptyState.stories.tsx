import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { IntlProvider } from 'react-intl';
import { DataView, DataViewTable } from '@patternfly/react-data-view';
import { WorkspacesEmptyState } from './WorkspacesEmptyState';

const meta: Meta<typeof WorkspacesEmptyState> = {
  title: 'Features/Workspaces/Components/WorkspacesEmptyState',
  component: WorkspacesEmptyState,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**WorkspacesEmptyState** is an empty state component for the Workspaces table with custom formatted subtitle content.

### Key Features
- **Custom EmptyState**: Uses PatternFly's EmptyState components for consistency
- **Internationalization**: Uses react-intl for localized messages with formatted content
- **Customizable**: Supports custom title text and subtitle content overrides
- **Table Layout Compatibility**: Works within DataViewTable bodyStates
- **Rich Content**: Supports line breaks and formatted text in subtitle

### Usage
This component is designed to be used within \`DataViewTable\` bodyStates configuration:

\`\`\`tsx
<DataViewTable
  bodyStates={{
    empty: <WorkspacesEmptyState />
  }}
/>
\`\`\`

The component automatically handles:
- Default localized title and subtitle from messages
- Formatted subtitle content with line breaks
- Proper table layout compatibility
- Consistent styling with other empty states
        `,
      },
    },
  },
  args: {
    titleText: undefined,
    subtitleContent: undefined,
  },
  argTypes: {
    titleText: {
      control: 'text',
      description: 'Custom title text (optional, defaults to localized message)',
    },
    subtitleContent: {
      control: 'text',
      description: 'Custom subtitle content (optional, defaults to formatted message)',
    },
  },
  decorators: [
    (Story) => (
      <IntlProvider locale="en">
        <DataView>
          <DataViewTable
            aria-label="Example workspaces table"
            columns={[{ cell: 'Workspace Name' }, { cell: 'Type' }, { cell: 'Members' }, { cell: 'Actions' }]}
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
 * Default empty state with standard localized messages and formatted subtitle
 */
export const Default: Story = {
  args: {
    titleText: undefined,
    subtitleContent: undefined,
  },
};

/**
 * Empty state with custom title text but default subtitle
 */
export const CustomTitle: Story = {
  args: {
    titleText: 'No workspaces available',
    subtitleContent: undefined,
  },
};

/**
 * Empty state with both custom title and subtitle content
 */
export const CustomContent: Story = {
  args: {
    titleText: 'Get started with workspaces',
    subtitleContent: (
      <>
        Create workspaces to organize your resources and teams.
        <br />
        Contact your administrator if you need help getting started.
      </>
    ),
  },
};

/**
 * Empty state with very long custom content to test text wrapping
 */
export const LongContent: Story = {
  args: {
    titleText: 'No workspaces have been configured for your organization yet',
    subtitleContent: (
      <>
        Workspaces help you organize users, roles, and permissions across different business units or projects.
        <br />
        Contact your system administrator to create your first workspace or check if you have the necessary permissions.
      </>
    ),
  },
};
