import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, within } from 'storybook/test';
import { MemoryRouter } from 'react-router-dom';
import { UserAccessLayout } from './UserAccessLayout';

const meta: Meta<typeof UserAccessLayout> = {
  component: UserAccessLayout,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story: React.ComponentType) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof UserAccessLayout>;

export const Default: Story = {
  args: {
    entitledBundles: [
      ['openshift', { is_entitled: true }],
      ['rhel', { is_entitled: true }],
      ['settings', { is_entitled: true }],
    ],
    title: 'Your permissions in Red Hat Enterprise Linux',
    currentBundle: 'rhel',
    children: (
      <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '4px' }}>
        <p>Table content would go here (AccessTable or RolesTable)</p>
      </div>
    ),
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);

    // Test that layout renders correctly
    expect(await canvas.findByTestId('entitle-section')).toBeInTheDocument();
    expect(await canvas.findByText('Your permissions in Red Hat Enterprise Linux')).toBeInTheDocument();
    expect(await canvas.findByText('Table content would go here (AccessTable or RolesTable)')).toBeInTheDocument();
  },
};
