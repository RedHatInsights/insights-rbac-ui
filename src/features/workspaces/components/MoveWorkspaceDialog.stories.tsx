import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { MoveWorkspaceDialog } from './MoveWorkspaceDialog';
import { BrowserRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { Workspace } from '../../../redux/workspaces/reducer';
import { TreeViewWorkspaceItem } from './managed-selector/TreeViewWorkspaceItem';
import WorkspaceType from './managed-selector/WorkspaceType';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { HttpResponse, delay, http } from 'msw';

// Mock workspace data
const mockWorkspaces: Workspace[] = [
  {
    id: 'workspace-1',
    name: 'Production Environment',
    description: 'Main production workspace for critical services',
    type: 'root',
    parent_id: '',
  },
  {
    id: 'workspace-2',
    name: 'Web Services',
    description: 'Frontend web applications and services',
    type: 'standard',
    parent_id: 'workspace-1',
  },
  {
    id: 'workspace-3',
    name: 'API Services',
    description: 'Backend API and microservices',
    type: 'standard',
    parent_id: 'workspace-1',
  },
  {
    id: 'workspace-4',
    name: 'Development Environment',
    description: 'Development and testing workspace',
    type: 'root',
    parent_id: '',
  },
];

// Convert workspace to TreeViewWorkspaceItem for testing
const convertToTreeViewItem = (workspace: Workspace): TreeViewWorkspaceItem => ({
  name: workspace.name,
  id: workspace.id,
  workspace: { ...workspace, type: workspace.type as WorkspaceType },
  children: [],
});

// Wrapper component that manages modal state and provides trigger button
const ModalWrapper = ({ ...storyArgs }: any) => {
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

// MSW handlers for ManagedSelector API calls
const workspaceApiHandlers = [
  http.get('/api/rbac/v2/workspaces/', () => {
    return HttpResponse.json({
      data: mockWorkspaces,
      meta: {
        count: mockWorkspaces.length,
        limit: 9007199254740991,
        offset: 0,
      },
    });
  }),
];

// Story decorator to provide necessary context
const withProviders = (Story: any) => {
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
  tags: ['autodocs', 'workspaces', 'move-workspace-dialog'],
  decorators: [withProviders],
  parameters: {
    layout: 'fullscreen',
    msw: {
      handlers: workspaceApiHandlers,
    },
    docs: {
      description: {
        component: `
The MoveWorkspaceDialog is a **pure presentational component** for moving workspaces within the organizational hierarchy.

## Key Features
- **Pure UI Component**: No Redux dependencies - all data passed via props
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
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Verify the trigger button is present
    const openButton = await canvas.findByTestId('open-modal-button');
    await expect(openButton).toBeInTheDocument();
    await expect(openButton).toBeEnabled();

    // Modal should not be visible initially - check in document.body where modals render
    const body = within(document.body);
    await expect(body.queryByRole('dialog')).not.toBeInTheDocument();
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
  play: async ({ canvasElement, args }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Click the trigger button to open modal
    const openButton = await canvas.findByTestId('open-modal-button');
    await userEvent.click(openButton);

    // Wait for modal to appear - IMPORTANT: Use document.body for modals, not canvas
    const body = within(document.body);
    await expect(body.findByRole('dialog')).resolves.toBeInTheDocument();

    // Verify modal content - use body since modal renders outside canvas
    await expect(body.findByText('Move "Web Services"')).resolves.toBeInTheDocument();

    // Verify warning text about permission changes
    await expect(body.findByText(/Moving a workspace may change who is able to access it and their permissions/)).resolves.toBeInTheDocument();

    // Verify parent workspace section header
    await expect(body.findByText('Parent workspace')).resolves.toBeInTheDocument();

    // Verify action buttons are present
    await expect(body.findByText('Submit')).resolves.toBeInTheDocument();
    await expect(body.findByText('Cancel')).resolves.toBeInTheDocument();

    // Submit should be enabled since a workspace is pre-selected
    const submitButton = await body.findByText('Submit');
    await expect(submitButton).toBeEnabled();

    // Test the Cancel button and onClose action
    const cancelButton = await body.findByText('Cancel');
    await userEvent.click(cancelButton);

    // Verify onClose action was called
    await waitFor(
      async () => {
        await expect(args.onClose).toHaveBeenCalledTimes(1);
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
    await delay(300);
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
        console.log('Found workspace options:', workspaceOptions.length);
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
            parent_id: '',
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
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Open modal
    const openButton = await canvas.findByTestId('open-modal-button');
    await userEvent.click(openButton);

    const body = within(document.body);
    await expect(body.findByRole('dialog')).resolves.toBeInTheDocument();

    // Verify buttons are disabled during loading
    const submitButton = await body.findByText('Submit');
    const cancelButton = await body.findByText('Cancel');

    await expect(submitButton).toBeDisabled();
    await expect(cancelButton).toBeDisabled();

    // Verify loading spinner is present (PatternFly Button with isLoading prop)
    await expect(submitButton).toHaveAttribute('aria-disabled', 'true');
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
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Open modal
    const openButton = await canvas.findByTestId('open-modal-button');
    await userEvent.click(openButton);

    const body = within(document.body);
    await expect(body.findByRole('dialog')).resolves.toBeInTheDocument();

    // Submit should be disabled when no workspace is selected
    const submitButton = await body.findByText('Submit');
    await expect(submitButton).toBeDisabled();

    // Cancel should still be enabled
    const cancelButton = await body.findByText('Cancel');
    await expect(cancelButton).toBeEnabled();

    // No change message should appear
    await expect(body.queryByText(/This will move/)).not.toBeInTheDocument();
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
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Button should be present (managed by wrapper)
    const openButton = await canvas.findByTestId('open-modal-button');
    await expect(openButton).toBeInTheDocument();

    // Click the trigger button
    await userEvent.click(openButton);

    // Verify no dialog appears
    const body = within(document.body);
    await waitFor(async () => {
      await expect(body.queryByRole('dialog')).not.toBeInTheDocument();
    });
  },
};
