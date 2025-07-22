import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { EditWorkspaceModal } from './EditWorkspaceModal';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Button } from '@patternfly/react-core';
import { createStore } from 'redux';
import { HttpResponse, http } from 'msw';

// Mock workspace data
const mockWorkspace = {
  id: 'workspace-1',
  name: 'Production Environment',
  description: 'Main production workspace for critical services',
  type: 'root',
  parent_id: '',
};

const mockWorkspaces = [
  mockWorkspace,
  {
    id: 'workspace-2',
    name: 'Development Environment',
    description: 'Development and testing workspace',
    type: 'root',
    parent_id: '',
  },
  {
    id: 'workspace-3',
    name: 'QA Environment',
    description: 'Quality assurance testing workspace',
    type: 'standard',
    parent_id: 'workspace-1',
  },
];

// Create mock Redux store (using classic Redux, not Redux Toolkit)
const createMockStore = (initialState = {}) => {
  const mockReducer = (state = initialState) => state;
  return createStore(mockReducer);
};

// Modal wrapper component following project patterns for modal testing
const ModalWrapper = ({ storyArgs, storeState }: { storyArgs: any; storeState: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  const workspaceId = 'workspace-1';
  const route = `/iam/access-management/workspaces/edit/${workspaceId}`;
  const store = createMockStore(storeState);

  return (
    <Provider store={store}>
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
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

const meta: Meta<typeof EditWorkspaceModal> = {
  component: EditWorkspaceModal,
  tags: ['autodocs', 'workspaces', 'workspace-edit-modal'],
  parameters: {
    docs: {
      description: {
        component: `
**EditWorkspaceModal** allows users to modify workspace details including name and description.

This component demonstrates:
- **Modal Pattern**: Renders outside story canvas in document.body
- **Form Management**: Uses React Final Form for validation and submission
- **Redux Integration**: Loads workspace data from Redux store
- **API Integration**: Handles workspace update requests
- **Validation**: Prevents duplicate names and empty fields
- **User Experience**: Provides feedback during form submission

### Testing Note
Since modals break autodocs, these stories use a button wrapper pattern where you click a button to open the modal for testing.
        `,
      },
    },
  },
  render: (args, { parameters }) => <ModalWrapper storyArgs={args} storeState={parameters.storeState} />,
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
          'Default edit modal with workspace data loaded from Redux. Users should see the workspace name and description pre-populated in the form fields. Tests the complete edit workflow with form validation and submission.',
      },
    },
    storeState: {
      workspacesReducer: {
        isLoading: false,
        selectedWorkspace: mockWorkspace,
        workspaces: mockWorkspaces,
        error: '',
      },
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v2/workspaces/', () => {
          return HttpResponse.json({
            data: mockWorkspaces,
            meta: { count: mockWorkspaces.length, limit: 10000, offset: 0 },
          });
        }),
        http.get('/api/rbac/v2/workspaces/workspace-1/', () => {
          return HttpResponse.json(mockWorkspace);
        }),
        http.patch('/api/rbac/v2/workspaces/workspace-1/', async ({ request }) => {
          const body = (await request.json()) as Record<string, any>;
          return HttpResponse.json({
            ...mockWorkspace,
            ...body,
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Click button to open modal
    const openButton = canvas.getByTestId('open-modal-button');
    await user.click(openButton);

    // Wait for modal in document.body and check for specific modal title
    await waitFor(
      async () => {
        const body = within(document.body);
        await expect(body.getByText('Edit workspace information')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Test within document.body where modal renders
    const body = within(document.body);

    // Verify form is populated with workspace data
    await expect(body.getByDisplayValue('Production Environment')).toBeInTheDocument();
    await expect(body.getByDisplayValue('Main production workspace for critical services')).toBeInTheDocument();

    // Test form interaction
    const nameField = body.getByDisplayValue('Production Environment');
    await user.clear(nameField);
    await user.type(nameField, 'Updated Production Environment');

    // Submit form
    const saveButton = body.getByRole('button', { name: 'Save' });
    await user.click(saveButton);

    // Verify callback was called
    await expect(args.afterSubmit).toHaveBeenCalled();
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
    storeState: {
      workspacesReducer: {
        isLoading: false,
        selectedWorkspace: mockWorkspace,
        workspaces: mockWorkspaces,
        error: '',
      },
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v2/workspaces/', () => {
          return HttpResponse.json({
            data: mockWorkspaces,
            meta: { count: mockWorkspaces.length, limit: 10000, offset: 0 },
          });
        }),
        http.get('/api/rbac/v2/workspaces/workspace-1/', () => {
          return HttpResponse.json(mockWorkspace);
        }),
      ],
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Click button to open modal
    const openButton = canvas.getByTestId('open-modal-button');
    await user.click(openButton);

    // Wait for modal in document.body
    await waitFor(
      async () => {
        const body = within(document.body);
        await expect(body.getByText('Edit workspace information')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    const body = within(document.body);

    // Make some changes to test dirty form cancellation
    const nameField = body.getByDisplayValue('Production Environment');
    await user.clear(nameField);
    await user.type(nameField, 'Modified Name');

    // Click cancel
    const cancelButton = body.getByRole('button', { name: 'Cancel' });
    await user.click(cancelButton);

    // Verify cancel was called, submit was not
    await expect(args.onCancel).toHaveBeenCalled();
    await expect(args.afterSubmit).not.toHaveBeenCalled();
  },
};
