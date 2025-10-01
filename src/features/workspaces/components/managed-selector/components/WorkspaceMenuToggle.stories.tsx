import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, userEvent, within } from 'storybook/test';
import { fn } from 'storybook/test';
import { WorkspaceMenuToggle } from './WorkspaceMenuToggle';

const meta: Meta<typeof WorkspaceMenuToggle> = {
  component: WorkspaceMenuToggle,
  tags: ['autodocs', 'workspaces'],
  parameters: {
    docs: {
      description: {
        component: 'A menu toggle component for workspace selection. Displays loading state, selected workspace name, or placeholder text.',
      },
    },
  },
  argTypes: {
    menuToggleRef: {
      description: 'React ref for the menu toggle element',
      table: { disable: true },
    },
    onMenuToggleClick: {
      description: 'Callback when the menu toggle is clicked',
      action: 'clicked',
    },
    isDisabled: {
      description: 'Whether the menu toggle is disabled (loading state)',
      control: { type: 'boolean' },
    },
    isMenuToggleExpanded: {
      description: 'Whether the menu is currently expanded',
      control: { type: 'boolean' },
    },
    selectedWorkspaceName: {
      description: 'The name of the currently selected workspace',
      control: { type: 'text' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof WorkspaceMenuToggle>;

// Default args
const defaultArgs = {
  menuToggleRef: undefined,
  onMenuToggleClick: fn(),
  isDisabled: false,
  isMenuToggleExpanded: false,
  selectedWorkspaceName: undefined,
};

export const Default: Story = {
  args: defaultArgs,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show "Select workspaces" placeholder text
    await expect(canvas.findByText('Select workspaces')).resolves.toBeInTheDocument();

    // Should be enabled and clickable
    const toggle = await canvas.findByRole('button');
    await expect(toggle).toBeEnabled();
    await expect(toggle).not.toHaveAttribute('aria-expanded', 'true');
  },
};

export const WithSelectedWorkspace: Story = {
  args: {
    ...defaultArgs,
    selectedWorkspaceName: 'Production Environment',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show selected workspace name
    await expect(canvas.findByText('Production Environment')).resolves.toBeInTheDocument();

    // Should not show placeholder text
    await expect(canvas.queryByText('Select workspaces')).not.toBeInTheDocument();
  },
};

export const WithLongWorkspaceName: Story = {
  args: {
    ...defaultArgs,
    selectedWorkspaceName: 'Development and Testing Environment with Very Long Name',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show long workspace name
    await expect(canvas.findByText('Development and Testing Environment with Very Long Name')).resolves.toBeInTheDocument();
  },
};

export const Loading: Story = {
  args: {
    ...defaultArgs,
    isDisabled: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show workspace-specific loading text
    await expect(canvas.findByText('Loading workspaces...')).resolves.toBeInTheDocument();

    // Should be disabled
    const toggle = await canvas.findByRole('button');
    await expect(toggle).toBeDisabled();
  },
};

export const LoadingWithWorkspace: Story = {
  args: {
    ...defaultArgs,
    isDisabled: true,
    selectedWorkspaceName: 'Production Environment',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show loading text even when workspace name is provided
    await expect(canvas.findByText('Loading workspaces...')).resolves.toBeInTheDocument();

    // Should not show workspace name when disabled
    await expect(canvas.queryByText('Production Environment')).not.toBeInTheDocument();
  },
};

export const Expanded: Story = {
  args: {
    ...defaultArgs,
    isMenuToggleExpanded: true,
    selectedWorkspaceName: 'Production Environment',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show workspace name
    await expect(canvas.findByText('Production Environment')).resolves.toBeInTheDocument();

    // Should be marked as expanded
    const toggle = await canvas.findByRole('button');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  },
};

export const InteractiveClick: Story = {
  args: {
    ...defaultArgs,
    selectedWorkspaceName: 'Production Environment',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Click the toggle
    const toggle = await canvas.findByRole('button');
    await userEvent.click(toggle);

    // Should call the callback
    await expect(defaultArgs.onMenuToggleClick).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'click',
      }),
    );
  },
};
