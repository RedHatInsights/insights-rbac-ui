import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, within } from 'storybook/test';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import Overview from './Overview';

const meta: Meta<typeof Overview> = {
  component: Overview,
  tags: ['autodocs', 'custom-css'],
  parameters: {
    docs: {
      description: {
        component: `
V2 Overview page — thin wrapper that passes V2 pathnames to the shared Overview component.

Links point to V2 routes: \`/access-management/users-and-user-groups/user-groups\`, \`/access-management/roles\`.
`,
      },
    },
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Overview>;

export const Default: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify default overview', async () => {
      await expect(canvas.findByLabelText('Get started card')).resolves.toBeInTheDocument();
      await expect(canvas.findByLabelText('Supporting features list')).resolves.toBeInTheDocument();
      await expect(canvas.findByLabelText('Recommended content table')).resolves.toBeInTheDocument();
      await expect(canvas.findByRole('heading', { level: 1 })).resolves.toBeInTheDocument();
    });
  },
};
