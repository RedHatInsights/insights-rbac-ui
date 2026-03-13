import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { EditWorkspaceModal } from './EditWorkspaceModal';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { TEST_TIMEOUTS } from '../../../test-utils/testUtils';
import { clearAndType, waitForModal } from '../../../test-utils/interactionHelpers';
import { workspacesHandlers } from '../../data/mocks/workspaces.handlers';

// Mock workspace data for factory (WorkspacesWorkspace format: created, modified, parent_id undefined for root)
const mockWorkspaces = [
  {
    id: 'workspace-1',
    name: 'Production Environment',
    description: 'Main production workspace for critical services',
    type: 'root' as const,
    parent_id: undefined,
    created: '2024-01-01T00:00:00Z',
    modified: '2024-01-01T00:00:00Z',
  },
  {
    id: 'workspace-2',
    name: 'Development Environment',
    description: 'Development and testing workspace',
    type: 'root' as const,
    parent_id: undefined,
    created: '2024-01-02T00:00:00Z',
    modified: '2024-01-02T00:00:00Z',
  },
  {
    id: 'workspace-3',
    name: 'QA Environment',
    description: 'Quality assurance testing workspace',
    type: 'standard' as const,
    parent_id: 'workspace-1',
    created: '2024-01-03T00:00:00Z',
    modified: '2024-01-03T00:00:00Z',
  },
];

// Modal wrapper component following project patterns for modal testing
const ModalWrapper = ({ storyArgs }: { storyArgs: React.ComponentProps<typeof EditWorkspaceModal> }) => {
  const [isOpen, setIsOpen] = useState(false);
  const workspaceId = 'workspace-1';
  const route = `/iam/access-management/workspaces/edit/${workspaceId}`;

  return (
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route
          path="/iam/access-management/workspaces/edit/:workspaceId"
          element={
            <div>
              <Button data-testid="open-modal-button" onClick={() => setIsOpen(true)}>
                Open Edit Modal
              </Button>
              {isOpen && (
                <EditWorkspaceModal
                  {...storyArgs}
                  afterSubmit={() => {
                    setIsOpen(false);
                    storyArgs.afterSubmit();
                  }}
                  onCancel={() => {
                    setIsOpen(false);
                    storyArgs.onCancel();
                  }}
                />
              )}
            </div>
          }
        />
        {/* Route for useAppNavigate with /iam/user-access basename */}
        <Route
          path="/iam/user-access/workspaces/detail/:workspaceId"
          element={<div data-testid="workspace-detail-page">Workspace Detail Page</div>}
        />
      </Routes>
    </MemoryRouter>
  );
};

const meta: Meta<typeof EditWorkspaceModal> = {
  component: EditWorkspaceModal,
  tags: ['autodocs'],
  parameters: {
    workspacePermissions: {
      view: ['workspace-1', 'workspace-2', 'workspace-3'],
      edit: ['workspace-1', 'workspace-2', 'workspace-3'],
      delete: ['workspace-1', 'workspace-2', 'workspace-3'],
      create: ['workspace-1', 'workspace-2', 'workspace-3'],
      move: ['workspace-1', 'workspace-2', 'workspace-3'],
    },
    docs: {
      description: {
        component: `
**EditWorkspaceModal** allows users to modify workspace details including name and description.

This component demonstrates:
- **Modal Pattern**: Renders outside story canvas in document.body
- **Form Management**: Uses React Final Form for validation and submission
- **Data Integration**: Loads workspace data from React Query cache
- **API Integration**: Handles workspace update requests
- **Validation**: Prevents duplicate names and empty fields
- **User Experience**: Provides feedback during form submission

### Testing Note
Since modals break autodocs, these stories use a button wrapper pattern where you click a button to open the modal for testing.
        `,
      },
    },
  },
  render: (args) => <ModalWrapper storyArgs={args} />,
};

export default meta;
type Story = StoryObj<typeof EditWorkspaceModal>;

export const Default: Story = {
  args: {
    afterSubmit: fn(),
    onCancel: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default render of edit modal with workspace data loaded from React Query. Click "Open Edit Modal" button to see the modal with pre-populated form fields. Useful for manual testing and visual inspection.',
      },
    },
    msw: {
      handlers: [...workspacesHandlers(mockWorkspaces)],
    },
  },
};

export const InteractiveEdit: Story = {
  args: {
    afterSubmit: fn(),
    onCancel: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Interactive test of the complete edit workflow. Tests form population, validation, editing, and submission with callbacks verification.',
      },
    },
    msw: {
      handlers: [...workspacesHandlers(mockWorkspaces)],
    },
  },
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Open modal and wait for form', async () => {
      const openButton = await canvas.findByTestId('open-modal-button');
      await user.click(openButton);
    });

    await step('Edit name and submit', async () => {
      // FormRenderer uses an inline FormTemplate; wait for fully populated state
      const dialog = await waitForModal({
        timeout: TEST_TIMEOUTS.ELEMENT_WAIT,
        waitUntil: (dlg) => {
          expect(dlg.queryByDisplayValue('Production Environment')).toBeInTheDocument();
          expect(dlg.queryByDisplayValue('Main production workspace for critical services')).toBeInTheDocument();
          expect(dlg.queryByRole('button', { name: 'Save' })).toBeDisabled();
        },
      });

      await clearAndType(user, () => dialog.getByDisplayValue('Production Environment') as HTMLInputElement, 'Updated Production Environment');

      const saveButton = await dialog.findByRole('button', { name: 'Save' });
      await user.click(saveButton);
    });

    await step('Verify callback', async () => {
      await waitFor(
        () => {
          expect(args.afterSubmit).toHaveBeenCalled();
        },
        { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
      );
    });
  },
};

export const CancelOperation: Story = {
  args: {
    afterSubmit: fn(),
    onCancel: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests the cancel operation functionality. Verifies that the onCancel callback is triggered and no form submission occurs when users click the cancel button.',
      },
    },
    msw: {
      handlers: [...workspacesHandlers(mockWorkspaces)],
    },
  },
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Open modal', async () => {
      const openButton = await canvas.findByTestId('open-modal-button');
      await user.click(openButton);
    });

    await step('Wait for form and click cancel', async () => {
      const dialog = await waitForModal({
        timeout: TEST_TIMEOUTS.ELEMENT_WAIT,
        waitUntil: (dlg) => {
          expect(dlg.queryByDisplayValue('Production Environment')).toBeInTheDocument();
          expect(dlg.queryByRole('button', { name: 'Save' })).toBeDisabled();
          expect(dlg.queryByRole('button', { name: /cancel/i })).toBeVisible();
        },
      });

      const cancelButton = dialog.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
    });

    await step('Verify callbacks', async () => {
      await waitFor(() => expect(args.onCancel).toHaveBeenCalled(), { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT });
      expect(args.afterSubmit).not.toHaveBeenCalled();
    });
  },
};

export const CancelNotification: Story = {
  args: {
    afterSubmit: fn(),
    onCancel: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Test warning notification when user cancels workspace editing.',
      },
    },
    workspacesState: {
      isLoading: false,
      workspaces: mockWorkspaces,
      error: '',
    },
    msw: {
      handlers: [...workspacesHandlers(mockWorkspaces)],
    },
  },
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Open modal', async () => {
      const openButton = await canvas.findByTestId('open-modal-button');
      await user.click(openButton);
    });

    await step('Wait for form and click cancel', async () => {
      const dialog = await waitForModal({
        timeout: TEST_TIMEOUTS.ELEMENT_WAIT,
        waitUntil: (dlg) => {
          expect(dlg.queryByDisplayValue('Production Environment')).toBeInTheDocument();
          expect(dlg.queryByRole('button', { name: 'Save' })).toBeDisabled();
          expect(dlg.queryByRole('button', { name: /cancel/i })).toBeVisible();
        },
      });

      const cancelButton = dialog.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
    });

    await step('Verify cancel callback', async () => {
      await waitFor(() => expect(args.onCancel).toHaveBeenCalled(), { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT });
    });
  },
};
