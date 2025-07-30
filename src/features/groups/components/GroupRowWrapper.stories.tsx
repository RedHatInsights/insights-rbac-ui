import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, within } from 'storybook/test';
import React from 'react';
import { GroupRowWrapper } from './GroupRowWrapper';

const meta: Meta<typeof GroupRowWrapper> = {
  component: GroupRowWrapper,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A table row wrapper component for groups that adds conditional CSS styling. Features:
- Adds 'rbac-c-group-default' class for platform default or admin default groups
- Passes through all other props to PatternFly's RowWrapper
- Provides visual distinction for special group types in tables
- Maintains full compatibility with PatternFly table components

Note: This component is specifically designed to work within PatternFly Table components.
For demonstration purposes, we show the rendered output and class application.
        `,
      },
    },
  },
  args: {
    row: {
      cells: ['Default Group', 'System Administrator', '5 members', 'Yesterday'],
      isPlatformDefault: false,
      isAdminDefault: false,
    },
  },
};

export default meta;
type Story = StoryObj<typeof GroupRowWrapper>;

export const Default: Story = {
  args: {
    row: {
      cells: ['Regular Group', 'Custom Role', '3 members', 'Today'],
      isPlatformDefault: false,
      isAdminDefault: false,
    },
  },
  render: (args) => (
    <div>
      <p>
        <strong>Row Properties:</strong>
      </p>
      <ul>
        <li>isPlatformDefault: {String(args.row.isPlatformDefault)}</li>
        <li>isAdminDefault: {String(args.row.isAdminDefault)}</li>
        <li>className: {args.className || 'none'}</li>
      </ul>
      <p>
        <strong>Applied CSS Classes:</strong>
      </p>
      <GroupRowWrapper {...args}>
        <div style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
          Sample row content - inspect element to see applied classes
        </div>
      </GroupRowWrapper>
    </div>
  ),
};

export const PlatformDefault: Story = {
  args: {
    row: {
      cells: ['Default access', 'Platform default', 'All users', 'System'],
      isPlatformDefault: true,
      isAdminDefault: false,
    },
  },
  render: (args) => (
    <div>
      <p>
        <strong>Row Properties:</strong>
      </p>
      <ul>
        <li>isPlatformDefault: {String(args.row.isPlatformDefault)}</li>
        <li>isAdminDefault: {String(args.row.isAdminDefault)}</li>
        <li>className: {args.className || 'none'}</li>
      </ul>
      <p>
        <strong>Applied CSS Classes (should include &apos;rbac-c-group-default&apos;):</strong>
      </p>
      <GroupRowWrapper {...args}>
        <div style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#f0f8ff' }}>
          Platform default group - inspect element to see &apos;rbac-c-group-default&apos; class
        </div>
      </GroupRowWrapper>
    </div>
  ),
};

export const AdminDefault: Story = {
  args: {
    row: {
      cells: ['Organization administrators', 'Admin default', 'All org admins', 'System'],
      isPlatformDefault: false,
      isAdminDefault: true,
    },
  },
  render: (args) => (
    <div>
      <p>
        <strong>Row Properties:</strong>
      </p>
      <ul>
        <li>isPlatformDefault: {String(args.row.isPlatformDefault)}</li>
        <li>isAdminDefault: {String(args.row.isAdminDefault)}</li>
        <li>className: {args.className || 'none'}</li>
      </ul>
      <p>
        <strong>Applied CSS Classes (should include &apos;rbac-c-group-default&apos;):</strong>
      </p>
      <GroupRowWrapper {...args}>
        <div style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff0f5' }}>
          Admin default group - inspect element to see &apos;rbac-c-group-default&apos; class
        </div>
      </GroupRowWrapper>
    </div>
  ),
};

export const WithCustomClassName: Story = {
  args: {
    row: {
      cells: ['Custom Group', 'Custom Role', '2 members', 'Today'],
      isPlatformDefault: false,
      isAdminDefault: false,
    },
    className: 'custom-row-class',
  },
  render: (args) => (
    <div>
      <p>
        <strong>Row Properties:</strong>
      </p>
      <ul>
        <li>isPlatformDefault: {String(args.row.isPlatformDefault)}</li>
        <li>isAdminDefault: {String(args.row.isAdminDefault)}</li>
        <li>className: {args.className || 'none'}</li>
      </ul>
      <p>
        <strong>Applied CSS Classes (should include custom class):</strong>
      </p>
      <GroupRowWrapper {...args}>
        <div style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#f5f5f5' }}>
          Custom className example - inspect element to see &apos;custom-row-class&apos;
        </div>
      </GroupRowWrapper>
    </div>
  ),
};

export const InteractiveTest: Story = {
  args: {
    row: {
      cells: ['Test Group', 'Test Role', '1 member', 'Now'],
      isPlatformDefault: false,
      isAdminDefault: false,
    },
    onClick: fn(),
  },
  render: (args) => (
    <div>
      <p>
        <strong>Interactive Test:</strong> Click the element below to test onClick handler
      </p>
      <GroupRowWrapper {...args}>
        <div
          style={{
            padding: '12px',
            border: '2px solid #007bff',
            borderRadius: '4px',
            cursor: 'pointer',
            backgroundColor: '#e3f2fd',
          }}
        >
          Click me to test interaction
        </div>
      </GroupRowWrapper>
    </div>
  ),
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    // Find the clickable element and test interaction
    const clickableElement = await canvas.findByText('Click me to test interaction');
    if (args.onClick) {
      await userEvent.click(clickableElement);
      await expect(args.onClick).toHaveBeenCalled();
    }
  },
};
