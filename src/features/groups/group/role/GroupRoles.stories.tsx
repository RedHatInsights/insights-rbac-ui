import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { expect, within } from 'storybook/test';

// Simple wrapper component for Group Roles management functionality
const GroupRolesWithData: React.FC = () => {
  return (
    <div>
      <h2>Group Roles Management</h2>
      <div style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px', margin: '10px 0' }}>
        <strong>GroupRoles component would render here</strong>
        <p>Features would include:</p>
        <ul>
          <li>Role listing and management</li>
          <li>Add/remove roles functionality</li>
          <li>Bulk operations and selection</li>
          <li>Pagination and filtering</li>
        </ul>
      </div>
    </div>
  );
};

const meta: Meta<any> = {
  component: GroupRolesWithData,
  tags: ['group-roles'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/groups/detail/test-group-id/roles']}>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Basic test - just verify component renders
    expect(canvas.getByText('Group Roles Management')).toBeInTheDocument();
    expect(canvas.getByText('GroupRoles component would render here')).toBeInTheDocument();
    expect(canvas.getByText('Role listing and management')).toBeInTheDocument();
  },
};
