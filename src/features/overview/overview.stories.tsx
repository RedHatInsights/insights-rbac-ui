import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, within } from 'storybook/test';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import Overview from './overview';
import { EnableWorkspacesAlert } from '../workspaces/overview/components/EnableWorkspacesAlert';

interface OverviewArgs {
  isWorkspacesEnabled: boolean;
  isWorkspacesEligible: boolean;
}

// Custom render component that simulates the Overview feature flag logic
const OverviewWithFeatureFlags: React.FC<OverviewArgs> = ({ isWorkspacesEnabled, isWorkspacesEligible }) => {
  const shouldShowAlert = isWorkspacesEligible && !isWorkspacesEnabled;

  return (
    <React.Fragment>
      {shouldShowAlert && <EnableWorkspacesAlert />}
      <Overview />
    </React.Fragment>
  );
};

const meta: Meta<OverviewArgs> = {
  component: Overview,
  tags: ['autodocs'],
  argTypes: {
    isWorkspacesEnabled: {
      control: 'boolean',
      description: 'Whether workspaces feature is enabled (platform.rbac.workspaces)',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    isWorkspacesEligible: {
      control: 'boolean',
      description: 'Whether user is eligible for workspaces (platform.rbac.workspaces-eligible)',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
  },
  parameters: {
    docs: {
      description: {
        component: `
The Overview container component provides the main landing page for the RBAC application.

## Features
- Displays ContentHeader with title, subtitle, and external documentation link
- Conditionally shows workspace alerts based on feature flags
- Orchestrates three main content sections via presentational components
- Handles feature flag logic for workspace-related functionality

## Container Responsibilities
- Feature flag evaluation (workspaces, workspaces-eligible)
- Layout structure and spacing
- Component composition and orchestration
- No direct PatternFly visual components (delegated to presentational components)

## Feature Flag Logic
- **No Alert**: When \`isWorkspacesEligible = false\` OR \`isWorkspacesEnabled = true\`
- **Show Alert**: When \`isWorkspacesEligible = true\` AND \`isWorkspacesEnabled = false\`
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
type Story = StoryObj<OverviewArgs>;

export const Default: Story = {
  args: {
    isWorkspacesEnabled: false,
    isWorkspacesEligible: false,
  },
  render: (args) => <OverviewWithFeatureFlags {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test container composition - all three main sections should be present
    await expect(canvas.findByLabelText('Get started card')).resolves.toBeInTheDocument();
    await expect(canvas.findByLabelText('Supporting features list')).resolves.toBeInTheDocument();
    await expect(canvas.findByLabelText('Recommended content table')).resolves.toBeInTheDocument();

    // Test that the main page structure is rendered
    await expect(canvas.findByRole('heading', { level: 1 })).resolves.toBeInTheDocument();

    // Verify no workspace alert shown (not eligible)
    await expect(canvas.queryByText('You are qualified to opt into the workspace user access model for your organization.')).not.toBeInTheDocument();
  },
};

export const WithWorkspaceAlert: Story = {
  args: {
    isWorkspacesEnabled: false,
    isWorkspacesEligible: true,
  },
  render: (args) => <OverviewWithFeatureFlags {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test container composition with alert present
    await expect(canvas.findByLabelText('Get started card')).resolves.toBeInTheDocument();
    await expect(canvas.findByLabelText('Supporting features list')).resolves.toBeInTheDocument();
    await expect(canvas.findByLabelText('Recommended content table')).resolves.toBeInTheDocument();

    // Verify workspace alert is shown (eligible but not enabled)
    await expect(
      canvas.findByText('You are qualified to opt into the workspace user access model for your organization.'),
    ).resolves.toBeInTheDocument();
  },
};

export const WithWorkspacesEnabled: Story = {
  args: {
    isWorkspacesEnabled: true,
    isWorkspacesEligible: true,
  },
  render: (args) => <OverviewWithFeatureFlags {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test container composition when workspaces are enabled
    await expect(canvas.findByLabelText('Get started card')).resolves.toBeInTheDocument();
    await expect(canvas.findByLabelText('Supporting features list')).resolves.toBeInTheDocument();
    await expect(canvas.findByLabelText('Recommended content table')).resolves.toBeInTheDocument();

    // Verify core page structure
    await expect(canvas.findByRole('heading', { level: 1 })).resolves.toBeInTheDocument();

    // Verify no workspace alert shown (already enabled)
    await expect(canvas.queryByText('You are qualified to opt into the workspace user access model for your organization.')).not.toBeInTheDocument();
  },
};
