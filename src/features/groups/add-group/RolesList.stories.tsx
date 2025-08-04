import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { fn } from 'storybook/test';
import { RolesList } from './RolesList';

const RolesListWrapper: React.FC<any> = (props) => (
  <div style={{ height: '600px', padding: '20px' }}>
    <RolesList selectedRoles={[]} setSelectedRoles={fn()} rolesExcluded={false} {...props} />
  </div>
);

const meta: Meta<typeof RolesListWrapper> = {
  title: 'Features/Groups/AddGroup/RolesList',
  component: RolesListWrapper,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
