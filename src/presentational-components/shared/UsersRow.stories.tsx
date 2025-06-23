import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { Table, TableVariant, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import UsersRow from './UsersRow';

// Mock table data for demonstration
const mockTableData = {
  activeRow: {
    cells: ['John Doe', 'john.doe@example.com', 'Engineering'],
    status: {
      props: {
        'data-is-active': true,
      },
    },
  },
  inactiveRow: {
    cells: ['Jane Smith', 'jane.smith@example.com', 'Marketing'],
    status: {
      props: {
        'data-is-active': false,
      },
    },
  },
  unknownStatusRow: {
    cells: ['Bob Johnson', 'bob.johnson@example.com', 'Sales'],
    // No status property - should default to inactive
  },
};

// Wrapper component to demonstrate UsersRow in context
const UsersTableExample: React.FC<{
  rows: any[];
  showInactive?: boolean;
}> = ({ rows }) => (
  <div style={{ padding: '20px' }}>
    <style>
      {`
        .rbac__user-row.ins-m-inactive {
          opacity: 0.6;
          background-color: #f5f5f5;
        }
        .rbac__user-row.ins-m-inactive td {
          color: #666;
        }
      `}
    </style>
    <Table variant={TableVariant.compact}>
      <Thead>
        <Tr>
          <Th>Name</Th>
          <Th>Email</Th>
          <Th>Department</Th>
          <Th>Status</Th>
        </Tr>
      </Thead>
      <Tbody>
        {rows.map((row, index) => (
          <UsersRow key={index} row={row} rowIndex={index}>
            <Td>{row.cells[0]}</Td>
            <Td>{row.cells[1]}</Td>
            <Td>{row.cells[2]}</Td>
            <Td>
              {row.status?.props?.['data-is-active'] ? (
                <span style={{ color: 'green' }}>Active</span>
              ) : (
                <span style={{ color: 'red' }}>Inactive</span>
              )}
            </Td>
          </UsersRow>
        ))}
      </Tbody>
    </Table>
  </div>
);

const meta: Meta<typeof UsersTableExample> = {
  component: UsersTableExample,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
UsersRow is a specialized table row wrapper that applies conditional styling based on user status.
It extends PatternFly's RowWrapper with custom CSS classes for active/inactive user states.

## Features
- Conditional styling based on user active status
- Integrates with PatternFly table components
- Applies 'ins-m-inactive' class for inactive users
- Maintains all standard RowWrapper functionality

## Usage
The component reads the \`data-is-active\` prop from the row's status object and applies
appropriate styling to indicate user state visually.
        `,
      },
    },
  },
  argTypes: {
    rows: {
      control: 'object',
      description: 'Array of row data objects with status information',
    },
    showInactive: {
      control: 'boolean',
      description: 'Whether to show inactive users (for demo purposes)',
    },
  },
} satisfies Meta<typeof UsersTableExample>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Mixed table with active and inactive users
 */
export const Default: Story = {
  args: {
    rows: [mockTableData.activeRow, mockTableData.inactiveRow, mockTableData.activeRow, mockTableData.unknownStatusRow],
    showInactive: true,
  },
};

/**
 * Active users only
 */
export const ActiveUsers: Story = {
  args: {
    rows: [
      mockTableData.activeRow,
      {
        cells: ['Alice Cooper', 'alice.cooper@example.com', 'Design'],
        status: { props: { 'data-is-active': true } },
      },
      {
        cells: ['David Wilson', 'david.wilson@example.com', 'Engineering'],
        status: { props: { 'data-is-active': true } },
      },
    ],
  },
};

/**
 * Inactive users only
 */
export const InactiveUsers: Story = {
  args: {
    rows: [
      mockTableData.inactiveRow,
      {
        cells: ['Former Employee', 'former@example.com', 'N/A'],
        status: { props: { 'data-is-active': false } },
      },
      {
        cells: ['Suspended User', 'suspended@example.com', 'HR'],
        status: { props: { 'data-is-active': false } },
      },
    ],
  },
};

/**
 * Users with unknown status (no status prop)
 */
export const UnknownStatus: Story = {
  args: {
    rows: [
      mockTableData.unknownStatusRow,
      {
        cells: ['New User', 'new@example.com', 'Onboarding'],
        // No status - should be treated as inactive
      },
      {
        cells: ['Pending User', 'pending@example.com', 'Temp'],
        status: {}, // Empty status object
      },
    ],
  },
};

/**
 * Large dataset example
 */
export const LargeDataset: Story = {
  args: {
    rows: Array.from({ length: 10 }, (_, i) => ({
      cells: [`User ${i + 1}`, `user${i + 1}@example.com`, ['Engineering', 'Marketing', 'Sales', 'Design', 'HR'][i % 5]],
      status: {
        props: {
          'data-is-active': Math.random() > 0.3, // 70% active
        },
      },
    })),
  },
};

/**
 * Individual UsersRow component demonstration
 */
export const SingleRowExample: StoryObj<typeof UsersRow> = {
  render: () => (
    <div style={{ padding: '20px' }}>
      <style>
        {`
          .rbac__user-row.ins-m-inactive {
            opacity: 0.6;
            background-color: #f5f5f5;
          }
          .demo-row {
            display: block;
            padding: 12px;
            border: 1px solid #ddd;
            margin: 8px 0;
            border-radius: 4px;
          }
        `}
      </style>
      <h3>Individual UsersRow Components:</h3>

      <div>
        <h4>Active User Row:</h4>
        <UsersRow row={mockTableData.activeRow} className="demo-row">
          <div>Active user content</div>
        </UsersRow>
      </div>

      <div>
        <h4>Inactive User Row:</h4>
        <UsersRow row={mockTableData.inactiveRow} className="demo-row">
          <div>Inactive user content</div>
        </UsersRow>
      </div>

      <div>
        <h4>Unknown Status Row:</h4>
        <UsersRow row={mockTableData.unknownStatusRow} className="demo-row">
          <div>Unknown status content</div>
        </UsersRow>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Individual UsersRow components showing different status states.',
      },
    },
  },
};

/**
 * Styling demonstration
 */
export const StylingDemo: Story = {
  render: () => (
    <div style={{ padding: '20px' }}>
      <style>
        {`
          .rbac__user-row {
            display: block;
            padding: 16px;
            margin: 8px 0;
            border: 2px solid #0066cc;
            border-radius: 8px;
            background: white;
            transition: all 0.2s ease;
          }
          .rbac__user-row.ins-m-inactive {
            opacity: 0.5;
            background-color: #f0f0f0;
            border-color: #ccc;
            border-style: dashed;
          }
          .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
          }
          .status-active { background-color: #4caf50; }
          .status-inactive { background-color: #f44336; }
        `}
      </style>

      <h3>Custom Styling Examples:</h3>

      <UsersRow row={mockTableData.activeRow}>
        <div>
          <span className="status-indicator status-active"></span>
          <strong>John Doe</strong> - Active user with custom styling
        </div>
      </UsersRow>

      <UsersRow row={mockTableData.inactiveRow}>
        <div>
          <span className="status-indicator status-inactive"></span>
          <strong>Jane Smith</strong> - Inactive user with custom styling
        </div>
      </UsersRow>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Demonstration of how UsersRow applies CSS classes that can be styled.',
      },
    },
  },
};
