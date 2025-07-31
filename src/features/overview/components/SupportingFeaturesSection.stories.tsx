import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, userEvent, within } from 'storybook/test';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { SupportingFeaturesSection } from './SupportingFeaturesSection';

const meta: Meta<typeof SupportingFeaturesSection> = {
  component: SupportingFeaturesSection,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The SupportingFeaturesSection component provides an expandable information section about RBAC supporting features.

## Features
- Expandable DataList with toggle functionality
- Icon and title display with visual divider
- Collapsible content area with detailed information
- Link to view default groups
- Configurable initial expanded state
- Proper ARIA labels and OUIA test attributes

## Interactive Elements
- Toggle button to expand/collapse content
- Link button to navigate to groups page
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
type Story = StoryObj<typeof SupportingFeaturesSection>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify the section renders with proper title
    await expect(canvas.findByRole('heading', { level: 4 })).resolves.toBeInTheDocument();

    // Check for the toggle button (it's labeled "Details")
    const toggleButton = await canvas.findByRole('button', { name: /details/i });
    await expect(toggleButton).toBeInTheDocument();

    // Verify initial expanded state (default is true)
    const content = await canvas.findByLabelText('About default groups - detailed explanation');
    await expect(content).toBeVisible();

    // Check for the view groups link
    const viewGroupsLink = await canvas.findByRole('button', { name: /view your default groups/i });
    await expect(viewGroupsLink).toBeInTheDocument();
  },
};

export const InitiallyCollapsed: Story = {
  args: {
    initialExpanded: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify content is initially hidden
    const content = await canvas.findByLabelText('About default groups - detailed explanation');
    await expect(content).not.toBeVisible();

    // Find and click the toggle button
    const toggleButton = await canvas.findByRole('button', { name: /details/i });
    await userEvent.click(toggleButton);

    // Verify content becomes visible after clicking
    await expect(content).toBeVisible();
  },
};

export const NavigationAndToggleTest: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const toggleButton = await canvas.findByRole('button', { name: /details/i });
    const content = await canvas.findByLabelText('About default groups - detailed explanation');

    // Verify initial state (expanded)
    await expect(content).toBeVisible();

    // Click to collapse
    await userEvent.click(toggleButton);
    await expect(content).not.toBeVisible();

    // Click to expand again
    await userEvent.click(toggleButton);
    await expect(content).toBeVisible();

    // Test the navigation link
    const viewGroupsLink = await canvas.findByRole('button', { name: /view your default groups/i });
    const groupsLinkElement = viewGroupsLink.closest('a');

    // Verify the link points to groups page
    await expect(groupsLinkElement).toHaveAttribute('href', '/iam/user-access/groups');

    // Test clicking the navigation link
    await userEvent.click(viewGroupsLink);
  },
};
