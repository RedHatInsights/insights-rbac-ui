import type { Meta, StoryFn, StoryObj } from '@storybook/react-webpack5';
import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { MoveWorkspaceDialog } from './MoveWorkspaceDialog';
import { BrowserRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import type { WorkspacesWorkspace } from '../../../data/queries/workspaces';
import { TreeViewWorkspaceItem } from './managed-selector/TreeViewWorkspaceItem';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { workspacesHandlers } from '../../../data/mocks/workspaces.handlers';

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
    name: 'Dev Cluster',
    description: 'Development and testing workspace',
    type: 'standard',
    parent_id: 'workspace-2',
    created: '2024-01-04T00:00:00Z',
    modified: '2024-01-04T00:00:00Z',
  },
];

const ModalWrapper = ({ ...storyArgs }: React.ComponentProps<typeof MoveWorkspaceDialog>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<string>('');

  const handleSubmit = (destinationWorkspace: TreeViewWorkspaceItem) => {
    storyArgs.onSubmit?.(destinationWorkspace);
    setSubmissionResult(`Moved "${storyArgs.workspaceToMove?.name}" to "${destinationWorkspace.name}"`);
    setIsOpen(false);
  };

  const handleClose = () => {
    storyArgs.onClose?.();
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

const withProviders = (Story: StoryFn) => (
  <BrowserRouter>
    <IntlProvider locale="en" messages={{}}>
      <div style={{ height: '600px' }}>
        <Story />
      </div>
    </IntlProvider>
  </BrowserRouter>
);

const ALL_IDS = mockWorkspaces.map((w) => w.id);

const meta: Meta<typeof MoveWorkspaceDialog> = {
  component: MoveWorkspaceDialog,
  tags: ['autodocs'],
  decorators: [withProviders],
  parameters: {
    workspacePermissions: {
      view: ALL_IDS,
      edit: ALL_IDS,
      delete: ALL_IDS,
      create: ALL_IDS,
      move: ALL_IDS,
    },
    msw: {
      handlers: [...workspacesHandlers(mockWorkspaces)],
    },
    docs: {
      description: {
        component: `
The MoveWorkspaceDialog shows a full-width inline workspace tree for selecting a new parent.
The workspace being moved and its descendants are shown as disabled with explanatory tooltips.
Workspaces where the user lacks \`move\` permission are also disabled.
        `,
      },
    },
  },
  argTypes: {
    isOpen: { control: { type: 'boolean' } },
    onClose: { action: 'closed' },
    onSubmit: { action: 'submitted' },
    workspaceToMove: { control: { type: 'object' } },
    allWorkspaces: { control: { type: 'object' } },
    isSubmitting: { control: { type: 'boolean' } },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    workspaceToMove: mockWorkspaces[1],
    allWorkspaces: mockWorkspaces,
    isSubmitting: false,
    onSubmit: fn(),
    onClose: fn(),
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify trigger button and modal closed', async () => {
      const openButton = await canvas.findByTestId('open-modal-button');
      await expect(openButton).toBeInTheDocument();
      const body = within(document.body);
      await expect(body.queryByRole('dialog')).not.toBeInTheDocument();
    });
  },
};

export const ModalOpen: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    workspaceToMove: mockWorkspaces[1],
    allWorkspaces: mockWorkspaces,
    isSubmitting: false,
    onSubmit: fn(),
    onClose: fn(),
  },
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    await step('Open modal and verify inline tree', async () => {
      await userEvent.click(await canvas.findByTestId('open-modal-button'));

      const body = within(document.body);
      await expect(body.findByRole('dialog')).resolves.toBeInTheDocument();
      await expect(body.findByLabelText(/search workspaces/i)).resolves.toBeInTheDocument();

      // The workspace being moved should be visible but disabled
      const tree = await body.findByRole('tree');
      await expect(within(tree).findByText(mockWorkspaces[1].name)).resolves.toBeInTheDocument();

      // Cancel closes the modal
      await userEvent.click(await body.findByRole('button', { name: /cancel/i }));
      await waitFor(async () => {
        await expect(args.onClose).toHaveBeenCalledTimes(1);
      });
    });
  },
};

export const DisabledSourceWorkspace: Story = {
  name: 'Source workspace and descendants are disabled',
  render: (args) => <ModalWrapper {...args} />,
  args: {
    workspaceToMove: mockWorkspaces[1],
    allWorkspaces: mockWorkspaces,
    isSubmitting: false,
    onSubmit: fn(),
    onClose: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'The workspace being moved ("Web Services") and its descendant ("Dev Cluster") appear in the tree but are disabled with explanatory tooltips.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify disabled state on source and descendants', async () => {
      await userEvent.click(await canvas.findByTestId('open-modal-button'));

      const body = within(document.body);
      const tree = await body.findByRole('tree');
      const treeScope = within(tree);

      // Source workspace text should be wrapped in a disabled span
      const sourceText = await treeScope.findByText(mockWorkspaces[1].name);
      const disabledSpan = sourceText.closest('span[style]');
      await expect(disabledSpan).not.toBeNull();

      // Descendant should also be disabled
      const descendantText = await treeScope.findByText(mockWorkspaces[3].name);
      const descendantSpan = descendantText.closest('span[style]');
      await expect(descendantSpan).not.toBeNull();

      // A non-source workspace should NOT be disabled
      const apiServicesText = await treeScope.findByText(mockWorkspaces[2].name);
      const apiServicesSpan = apiServicesText.closest('span[style]');
      await expect(apiServicesSpan).toBeNull();
    });
  },
};

export const SubmissionWorkflow: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    workspaceToMove: mockWorkspaces[1],
    allWorkspaces: mockWorkspaces,
    isSubmitting: false,
    onSubmit: fn(),
    onClose: fn(),
  },
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Select a workspace and submit', async () => {
      await user.click(await canvas.findByTestId('open-modal-button'));

      const body = within(document.body);
      const tree = await body.findByRole('tree');
      const treeScope = within(tree);

      // Select API Services as the new parent
      const target = await treeScope.findByText(mockWorkspaces[2].name);
      await user.click(target);

      const submitButton = await body.findByRole('button', { name: /submit/i });
      await expect(submitButton).toBeEnabled();
      await user.click(submitButton);

      await waitFor(async () => {
        await expect(args.onSubmit).toHaveBeenCalledTimes(1);
      });
    });
  },
};

export const LoadingState: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    workspaceToMove: mockWorkspaces[1],
    allWorkspaces: mockWorkspaces,
    isSubmitting: true,
    onSubmit: fn(),
    onClose: fn(),
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify submit disabled during submission', async () => {
      await userEvent.click(await canvas.findByTestId('open-modal-button'));

      const body = within(document.body);
      await expect(body.findByRole('dialog')).resolves.toBeInTheDocument();

      const submitButton = await body.findByRole('button', { name: /submit/i });
      await expect(submitButton).toBeDisabled();
    });
  },
};

export const NoSelection: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    workspaceToMove: mockWorkspaces[1],
    allWorkspaces: mockWorkspaces,
    isSubmitting: false,
    onSubmit: fn(),
    onClose: fn(),
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify submit disabled with no selection', async () => {
      await userEvent.click(await canvas.findByTestId('open-modal-button'));

      const body = within(document.body);
      await expect(body.findByRole('dialog')).resolves.toBeInTheDocument();

      const submitButton = await body.findByRole('button', { name: /submit/i });
      await expect(submitButton).toBeDisabled();
    });
  },
};
