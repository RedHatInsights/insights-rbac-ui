import type { Meta, StoryFn, StoryObj } from '@storybook/react-webpack5';
import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { MoveWorkspaceDialog } from './MoveWorkspaceDialog';
import { BrowserRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import type { WorkspacesWorkspace } from '../../../data/queries/workspaces';
import { TreeViewWorkspaceItem } from './managed-selector/TreeViewWorkspaceItem';
import { WorkspacesWorkspaceTypes } from '../../../data/api/workspaces';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { workspacesHandlers } from '../../../data/mocks/workspaces.handlers';

// Mock workspace data
const mockWorkspaces: WorkspacesWorkspace[] = [
  {
    id: 'workspace-1',
    name: 'Production Environment',
    description: 'Main production workspace for critical services',
    type: 'root',
    parent_id: undefined,
    created: '2024-01-01T00:00:00Z',
    modified: '2024-01-01T00:00:00Z',
  },
  {
    id: 'workspace-2',
    name: 'Web Services',
    description: 'Frontend web applications and services',
    type: 'standard',
    parent_id: 'workspace-1',
    created: '2024-01-02T00:00:00Z',
    modified: '2024-01-02T00:00:00Z',
  },
  {
    id: 'workspace-3',
    name: 'API Services',
    description: 'Backend API and microservices',
    type: 'standard',
    parent_id: 'workspace-1',
    created: '2024-01-03T00:00:00Z',
    modified: '2024-01-03T00:00:00Z',
  },
  {
    id: 'workspace-4',
    name: 'Development Environment',
    description: 'Development and testing workspace',
    type: 'root',
    parent_id: undefined,
    created: '2024-01-04T00:00:00Z',
    modified: '2024-01-04T00:00:00Z',
  },
];

// Convert workspace to TreeViewWorkspaceItem for testing
const convertToTreeViewItem = (workspace: WorkspacesWorkspace): TreeViewWorkspaceItem => ({
  name: workspace.name,
  id: workspace.id,
  workspace: { ...workspace, type: workspace.type as WorkspacesWorkspaceTypes },
  children: [],
});

// Wrapper component that manages modal state and provides trigger button
const ModalWrapper = ({ ...storyArgs }: React.ComponentProps<typeof MoveWorkspaceDialog>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<string>('');

  const handleSubmit = (destinationWorkspace: TreeViewWorkspaceItem) => {
    // Call the Storybook action for testing
    if (storyArgs.onSubmit) {
      storyArgs.onSubmit(destinationWorkspace);
    }
    setSubmissionResult(`Moved "${storyArgs.workspaceToMove?.name}" to "${destinationWorkspace.name}"`);
    setIsOpen(false);
  };

  const handleClose = () => {
    // Call the Storybook action for testing
    if (storyArgs.onClose) {
      storyArgs.onClose();
    }
    setIsOpen(false);
  };

  return (
    <div style={{ padding: '16px' }}>
      <Button variant="primary" onClick={() => setIsOpen(true)} data-testid="open-modal-button">
        Open Move Workspace Modal
      </Button>
      {submissionResult && (
        <div style={{ marginTop: '8px', color: 'green', fontWeight: 'bold' }} data-testid="submission-result">
          {submissionResult}
        </div>
      )}
      <MoveWorkspaceDialog {...storyArgs} isOpen={isOpen} onClose={handleClose} onSubmit={handleSubmit} />
    </div>
  );
};

// Convert to WorkspacesWorkspace format for factory (created/modified, parent_id undefined for root)
const workspaceDataForHandlers: WorkspacesWorkspace[] = mockWorkspaces.map((ws) => ({
  id: ws.id,
  name: ws.name,
  description: ws.description ?? '',
  parent_id: ws.parent_id || undefined,
  type: ws.type === 'root' ? ('root' as const) : ('standard' as const),
  created: ws.created,
  modified: ws.modified || ws.created,
}));

const workspaceApiHandlers = [...workspacesHandlers(workspaceDataForHandlers)];

// Story decorator to provide necessary context
const withProviders = (Story: StoryFn) => {
  return (
    <BrowserRouter>
      <IntlProvider locale="en" messages={{}}>
        <div style={{ height: '600px' }}>
          <Story />
        </div>
      </IntlProvider>
    </BrowserRouter>
  );
};

const meta: Meta<typeof MoveWorkspaceDialog> = {
  component: MoveWorkspaceDialog,
  tags: ['autodocs'],
  decorators: [withProviders],
  parameters: {
    msw: {
      handlers: workspaceApiHandlers,
    },
    docs: {
      description: {
        component: `
The MoveWorkspaceDialog is a **pure presentational component** for moving workspaces within the organizational hierarchy.

## Key Features
- **Pure UI Component**: No external state dependencies - all data passed via props
- **Controlled Inputs**: All state managed by parent component
- **Callback-based**: Uses callbacks for all user interactions
- **Form Validation**: Submit button disabled until valid selection made
- **Loading States**: Shows loading spinner during submission
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Props Interface
- \`isOpen\`: Controls modal visibility
- \`onClose\`: Callback when modal is closed
- \`onSubmit\`: Callback when form is submitted with selected workspace
- \`workspaceToMove\`: The workspace object to be moved

- \`availableWorkspaces\`: Array of workspaces for context
- \`isSubmitting\`: Whether submission is in progress
- \`initialSelectedWorkspace\`: Default selected workspace

## Testing Benefits
This component can be easily tested in isolation since it has no external dependencies beyond props.
All business logic is handled by the container component.
        `,
      },
    },
  },
  argTypes: {
    isOpen: {
      description: 'Whether the modal is visible',
      control: { type: 'boolean' },
    },
    onClose: {
      description: 'Callback when modal is closed',
      action: 'closed',
    },
    onSubmit: {
      description: 'Callback when form is submitted',
      action: 'submitted',
    },
    workspaceToMove: {
      description: 'The workspace to be moved',
      control: { type: 'object' },
    },

    availableWorkspaces: {
      description: 'Available workspaces for context',
      control: { type: 'object' },
    },
    isSubmitting: {
      description: 'Whether submission is in progress',
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story - modal closed with trigger button
export const Default: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    workspaceToMove: mockWorkspaces[1], // Web Services
    availableWorkspaces: mockWorkspaces,
    isSubmitting: false,
    initialSelectedWorkspace: convertToTreeViewItem(mockWorkspaces[0]), // Production Environment
    onSubmit: fn(),
    onClose: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Default state with modal closed. Click the button to open the modal and test the move workspace functionality.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify trigger button and modal closed', async () => {
      const openButton = await canvas.findByTestId('open-modal-button');
      await expect(openButton).toBeInTheDocument();
      await expect(openButton).toBeEnabled();

      const body = within(document.body);
      await expect(body.queryByRole('dialog')).not.toBeInTheDocument();
    });
  },
};

// Test modal opening and basic functionality
export const ModalOpen: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    workspaceToMove: mockWorkspaces[1], // Web Services
    availableWorkspaces: mockWorkspaces,
    isSubmitting: false,
    initialSelectedWorkspace: convertToTreeViewItem(mockWorkspaces[0]),
    onSubmit: fn(),
    onClose: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Modal in open state with workspace pre-selected, testing UI content and button states.',
      },
    },
  },
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    await step('Open modal and verify content', async () => {
      const openButton = await canvas.findByTestId('open-modal-button');
      await userEvent.click(openButton);

      const body = within(document.body);
      await expect(body.findByRole('dialog')).resolves.toBeInTheDocument();

      await expect(body.findByText('Move "Web Services"')).resolves.toBeInTheDocument();

      await expect(body.findByText(/Moving a workspace may change who is able to access it and their permissions/)).resolves.toBeInTheDocument();

      await expect(body.findByText('Parent workspace')).resolves.toBeInTheDocument();

      await expect(body.findByText('Submit')).resolves.toBeInTheDocument();
      await expect(body.findByText('Cancel')).resolves.toBeInTheDocument();

      const submitButton = await body.findByText('Submit');
      await expect(submitButton).toBeEnabled();

      const cancelButton = await body.findByText('Cancel');
      await userEvent.click(cancelButton);

      await waitFor(
        async () => {
          await expect(args.onClose).toHaveBeenCalledTimes(1);
        },
        { timeout: 2000 },
      );

      await waitFor(
        async () => {
          await expect(body.queryByRole('dialog')).not.toBeInTheDocument();
        },
        { timeout: 3000 },
      );
    });
  },
};

// Test submission workflow
export const SubmissionWorkflow: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    workspaceToMove: mockWorkspaces[1], // Web Services
    availableWorkspaces: mockWorkspaces,
    isSubmitting: false,
    initialSelectedWorkspace: convertToTreeViewItem(mockWorkspaces[0]), // Production Environment
    onSubmit: fn(),
    onClose: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests the complete submission workflow including callback verification.',
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Open modal
    const openButton = await canvas.findByTestId('open-modal-button');
    await userEvent.click(openButton);

    const body = within(document.body);
    await expect(body.findByRole('dialog')).resolves.toBeInTheDocument();

    // Wait for ManagedSelector to load workspaces
    await waitFor(
      async () => {
        // Check if we can find any workspace options (ManagedSelector should load the API data)
        const workspaceOptions = body.queryAllByText(/Environment/);
        await expect(workspaceOptions.length).toBeGreaterThan(0);
      },
      { timeout: 5000 },
    );

    // Modal should have the ManagedSelector component rendered
    await expect(body.findByText('Parent workspace')).resolves.toBeInTheDocument();

    // Submit the form
    const submitButton = await body.findByText('Submit');
    await expect(submitButton).toBeEnabled();
    await userEvent.click(submitButton);

    // Verify onSubmit action was called with the initial selection (Production Environment)
    // This is correct behavior - modal started with current parent selected and user submitted without changing
    await waitFor(
      async () => {
        await expect(args.onSubmit).toHaveBeenCalledTimes(1);
        await expect(args.onSubmit).toHaveBeenCalledWith({
          name: 'Production Environment',
          id: 'workspace-1',
          workspace: {
            id: 'workspace-1',
            name: 'Production Environment',
            description: 'Main production workspace for critical services',
            type: 'root',
            parent_id: undefined,
            created: '2024-01-01T00:00:00Z',
            modified: '2024-01-01T00:00:00Z',
          },
          children: [],
        });
      },
      { timeout: 2000 },
    );

    // Modal should close
    await waitFor(
      async () => {
        await expect(body.queryByRole('dialog')).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Verify submission result appears
    const resultMessage = await canvas.findByTestId('submission-result');
    await expect(resultMessage).toHaveTextContent('Moved "Web Services" to "Production Environment"');
  },
};

// Test loading state
export const LoadingState: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    workspaceToMove: mockWorkspaces[1], // Web Services
    availableWorkspaces: mockWorkspaces,
    isSubmitting: true, // Loading state
    initialSelectedWorkspace: convertToTreeViewItem(mockWorkspaces[0]),
    onSubmit: fn(),
    onClose: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Modal in loading state during submission, showing disabled buttons and loading spinner.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify loading state buttons disabled', async () => {
      const openButton = await canvas.findByTestId('open-modal-button');
      await userEvent.click(openButton);

      const body = within(document.body);
      await expect(body.findByRole('dialog')).resolves.toBeInTheDocument();

      const submitButton = await body.findByRole('button', { name: /submit/i });
      const cancelButton = await body.findByRole('button', { name: /cancel/i });

      const submitDisabled = submitButton.hasAttribute('disabled') || submitButton.getAttribute('aria-disabled') === 'true';
      const cancelDisabled = cancelButton.hasAttribute('disabled') || cancelButton.getAttribute('aria-disabled') === 'true';
      await expect(submitDisabled).toBe(true);
      await expect(cancelDisabled).toBe(true);
    });
  },
};

// Test with no workspace selected
export const NoSelection: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    workspaceToMove: mockWorkspaces[1], // Web Services
    availableWorkspaces: mockWorkspaces,
    isSubmitting: false,
    initialSelectedWorkspace: undefined,
    onSubmit: fn(),
    onClose: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Modal with no workspace selected, testing disabled submit button state.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify no selection submit disabled', async () => {
      const openButton = await canvas.findByTestId('open-modal-button');
      await userEvent.click(openButton);

      const body = within(document.body);
      await expect(body.findByRole('dialog')).resolves.toBeInTheDocument();

      const submitButton = await body.findByRole('button', { name: /submit/i });
      const submitDisabled = submitButton.hasAttribute('disabled') || submitButton.getAttribute('aria-disabled') === 'true';
      await expect(submitDisabled).toBe(true);

      const cancelButton = await body.findByRole('button', { name: /cancel/i });
      const cancelDisabled = cancelButton.hasAttribute('disabled') || cancelButton.getAttribute('aria-disabled') === 'true';
      await expect(cancelDisabled).toBe(false);

      await expect(body.queryByText(/This will move/)).not.toBeInTheDocument();
    });
  },
};

// Edge case: No workspace to move
export const NoWorkspaceToMove: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    workspaceToMove: null, // No workspace
    availableWorkspaces: mockWorkspaces,
    isSubmitting: false,
    onSubmit: fn(),
    onClose: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Edge case where no workspace is provided to move. Component should not render.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify no dialog when no workspace to move', async () => {
      const openButton = await canvas.findByTestId('open-modal-button');
      await expect(openButton).toBeInTheDocument();

      await userEvent.click(openButton);

      const body = within(document.body);
      await waitFor(async () => {
        await expect(body.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  },
};
