import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, userEvent, within } from 'storybook/test';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { GetStartedCard } from './GetStartedCard';

const meta: Meta<typeof GetStartedCard> = {
  component: GetStartedCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The GetStartedCard is a hero card component that provides an introduction to RBAC features and quick access to key functionality.

## Features
- Displays overview title and subtitle with key feature list
- Primary and secondary action buttons for navigation to Groups and Roles
- Responsive layout with optional cover image
- Proper ARIA labels and OUIA test attributes
- Uses PatternFly Card, Grid, and ActionList components

## Interactive Elements
- "View groups" primary button links to groups page
- "View roles" secondary button links to roles page
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
type Story = StoryObj<typeof GetStartedCard>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify the card renders with proper title
    await expect(canvas.findByRole('heading', { level: 2 })).resolves.toBeInTheDocument();

    // Check for action buttons
    const viewGroupsButton = await canvas.findByRole('button', { name: /view groups/i });
    const viewRolesButton = await canvas.findByRole('button', { name: /view roles/i });

    await expect(viewGroupsButton).toBeInTheDocument();
    await expect(viewRolesButton).toBeInTheDocument();

    // Verify button variants
    await expect(viewGroupsButton).toHaveClass('pf-m-primary');
    await expect(viewRolesButton).toHaveClass('pf-m-secondary');
  },
};

export const NavigationTest: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const viewGroupsButton = await canvas.findByRole('button', { name: /view groups/i });
    const viewRolesButton = await canvas.findByRole('button', { name: /view roles/i });

    // Verify the buttons exist and have correct navigation paths
    const groupsLink = viewGroupsButton.closest('a');
    const rolesLink = viewRolesButton.closest('a');

    await expect(groupsLink).toHaveAttribute('href', '/iam/user-access/groups');
    await expect(rolesLink).toHaveAttribute('href', '/iam/user-access/roles');

    // Test button clicks (navigation will be simulated)
    await userEvent.click(viewGroupsButton);
    await userEvent.click(viewRolesButton);

    // Verify OUIA attributes for testing
    await expect(viewGroupsButton).toHaveAttribute('data-ouia-component-id', 'getstarted-view-groups-button');
    await expect(viewRolesButton).toHaveAttribute('data-ouia-component-id', 'getstarted-view-roles-button');
  },
};
