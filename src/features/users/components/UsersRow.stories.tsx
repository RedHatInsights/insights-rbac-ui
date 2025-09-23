import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { Label } from '@patternfly/react-core/dist/dynamic/components/Label';
import { Table, TableBody, TableHeader } from '@patternfly/react-table/deprecated';
import { UsersRow } from './UsersRow';

const meta: Meta<typeof UsersRow> = {
  component: UsersRow,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The UsersRow component is a table row wrapper that applies styling based on user active status.
It reads the active state from \`row.status.props['data-is-active']\` and applies
the \`ins-m-inactive\` CSS class when the user is inactive.

This component is used as a \`rowWrapper\` prop in PatternFly tables. It receives the entire row object
and passes it through to PatternFly's RowWrapper with additional CSS classes.

**Expected data structure:**
- \`row.status.props['data-is-active']\`: boolean indicating if user is active
- When \`true\`: Normal appearance
- When \`false\` or missing: Dimmed appearance with \`ins-m-inactive\` class

**Note:** The \`ins-m-inactive\` CSS class is not currently defined in the codebase.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof UsersRow>;

const columns = [{ title: 'Status' }, { title: 'Username' }, { title: 'Email' }, { title: 'Last name' }, { title: 'First name' }];

/**
 * Active user - should appear normal
 */
export const ActiveUser: Story = {
  render: (args) => (
    <Table aria-label="Users table" cells={columns} rowWrapper={UsersRow} rows={[args.row!]}>
      <TableHeader />
      <TableBody />
    </Table>
  ),
  args: {
    row: {
      uuid: 'john.doe',
      cells: [
        <Label key="status" color="green">
          Active
        </Label>,
        'john.doe',
        'john.doe@example.com',
        'Doe',
        'John',
      ],
      status: {
        props: {
          'data-is-active': true,
        },
      },
    },
  },
};

/**
 * Inactive user - should appear dimmed with ins-m-inactive class
 */
export const InactiveUser: Story = {
  render: (args) => (
    <Table aria-label="Users table" cells={columns} rowWrapper={UsersRow} rows={[args.row!]}>
      <TableHeader />
      <TableBody />
    </Table>
  ),
  args: {
    row: {
      uuid: 'jane.smith',
      cells: [<Label key="status">Inactive</Label>, 'jane.smith', 'jane.smith@example.com', 'Smith', 'Jane'],
      status: {
        props: {
          'data-is-active': false,
        },
      },
    },
  },
};

/**
 * User with no status - should appear dimmed (treated as inactive)
 */
export const NoStatus: Story = {
  render: (args) => (
    <Table aria-label="Users table" cells={columns} rowWrapper={UsersRow} rows={[args.row!]}>
      <TableHeader />
      <TableBody />
    </Table>
  ),
  args: {
    row: {
      uuid: 'no.status',
      cells: [<Label key="status">Unknown</Label>, 'no.status', 'no.status@example.com', 'Status', 'No'],
      // No status property - should appear inactive
    },
  },
};

/**
 * Test with undefined status - should appear dimmed
 */
export const UndefinedStatus: Story = {
  render: (args) => (
    <Table aria-label="Users table" cells={columns} rowWrapper={UsersRow} rows={[args.row!]}>
      <TableHeader />
      <TableBody />
    </Table>
  ),
  args: {
    row: {
      uuid: 'undefined.status',
      cells: [<Label key="status">Undefined</Label>, 'undefined.status', 'undefined.status@example.com', 'Status', 'Undefined'],
      status: {
        props: {
          'data-is-active': undefined,
        },
      },
    },
  },
};

/**
 * Multiple users showing the difference between active and inactive
 */
export const Comparison: Story = {
  render: () => (
    <Table
      aria-label="Users table"
      cells={columns}
      rowWrapper={UsersRow}
      rows={[
        {
          uuid: 'john.doe',
          cells: [
            <Label key="status" color="green">
              Active
            </Label>,
            'john.doe',
            'john.doe@example.com',
            'Doe',
            'John',
          ],
          status: {
            props: {
              'data-is-active': true,
            },
          },
        },
        {
          uuid: 'jane.smith',
          cells: [<Label key="status">Inactive</Label>, 'jane.smith', 'jane.smith@example.com', 'Smith', 'Jane'],
          status: {
            props: {
              'data-is-active': false,
            },
          },
        },
        {
          uuid: 'no.status',
          cells: [<Label key="status">Unknown</Label>, 'no.status', 'no.status@example.com', 'Status', 'No'],
          // No status property - should appear inactive
        },
      ]}
    >
      <TableHeader />
      <TableBody />
    </Table>
  ),
};
