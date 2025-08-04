import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { GroupsEmptyState } from './GroupsEmptyState';

const meta: Meta<typeof GroupsEmptyState> = {
  title: 'Features/Groups/Components/GroupsEmptyState',
  component: GroupsEmptyState,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  argTypes: {
    hasActiveFilters: {
      control: 'boolean',
      description: 'Whether there are active filters applied',
    },
    isAdmin: {
      control: 'boolean',
      description: 'Whether the user has admin permissions',
    },
    titleText: {
      control: 'text',
      description: 'Custom title text for the empty state',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// GroupsEmptyState now includes its own table structure

export const NoDataAdminUser: Story = {
  args: {
    hasActiveFilters: false,
    isAdmin: true,
  },
};

export const NoDataNonAdminUser: Story = {
  args: {
    hasActiveFilters: false,
    isAdmin: false,
  },
};

export const NoResultsWithFilters: Story = {
  args: {
    hasActiveFilters: true,
    isAdmin: true,
  },
};

export const CustomTitle: Story = {
  args: {
    hasActiveFilters: false,
    isAdmin: true,
    titleText: 'Custom empty state title',
  },
};
