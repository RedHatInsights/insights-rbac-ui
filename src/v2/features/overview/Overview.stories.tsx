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
V2 Overview page — thin wrapper that renders \`WorkspacesOverview\` (Access Management landing page).

Service cards link to V2 routes: \`/access-management/workspaces\`, \`/access-management/users-and-user-groups\`, \`/access-management/roles\`.
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
      await expect(await canvas.findByRole('heading', { level: 1 })).toHaveTextContent('Access Management');
      await expect(canvas.findByText('Understanding access')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('Recommended content')).resolves.toBeInTheDocument();
      await expect(canvas.findByRole('link', { name: 'View groups' })).resolves.toBeInTheDocument();
      await expect(canvas.findByRole('link', { name: 'View roles' })).resolves.toBeInTheDocument();
    });
  },
};
