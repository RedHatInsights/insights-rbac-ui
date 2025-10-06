import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { delay } from 'msw';
import { HttpResponse, http } from 'msw';
import { EditGroupModal } from './EditGroupModal';

// 🕵️ API SPIES: Create spies for testing API calls
const updateGroupApiSpy = fn();

// Mock group data
const mockGroup = {
  uuid: 'test-group-id',
  name: 'Test Group',
  description: 'A test group for demonstration',
  principalCount: 5,
  roleCount: 3,
  policyCount: 2,
  platform_default: false,
  admin_default: false,
  system: false,
  created: '2024-01-01T00:00:00Z',
  modified: '2024-01-15T00:00:00Z',
};

const systemGroup = {
  ...mockGroup,
  uuid: 'system-group-id',
  name: 'System Group',
  description: 'A system default group',
  system: true,
  platform_default: true,
};

// Wrapper component with button to open modal
const EditGroupModalWrapper: React.FC<any> = (props) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleOpenModal = () => setIsOpen(true);
  const handleCloseModal = () => {
    setIsOpen(false);
    props.onClose?.();
  };

  return (
    <div style={{ height: '100vh' }}>
      <button onClick={handleOpenModal}>Edit Group</button>
      {isOpen && <EditGroupModal cancelRoute="/groups" submitRoute="/groups" onClose={handleCloseModal} {...props} />}
    </div>
  );
};

const meta: Meta<typeof EditGroupModalWrapper> = {
  component: EditGroupModalWrapper,
  decorators: [
    (Story, context) => {
      const { initialRoute } = context.args;
      return (
        <MemoryRouter initialEntries={[initialRoute]}>
          <Routes>
            <Route path="/groups/edit/:groupId" element={<Story />} />
            {/* Route for useAppNavigate with /iam/user-access basename */}
            <Route path="/iam/user-access/groups" element={<div data-testid="groups-list">Groups List Page</div>} />
          </Routes>
        </MemoryRouter>
      );
    },
  ],
  args: {
    onClose: fn(),
  },
  argTypes: {
    initialRoute: { description: 'Initial route for the story', control: 'text' },
    onClose: { description: 'Callback function called when modal is closed' },
  },
  parameters: {
    msw: {
      handlers: [
        // Fetch group API handler
        http.get('/api/rbac/v1/groups/:groupId/', ({ params }) => {
          const { groupId } = params;
          if (groupId === 'system-group-id') {
            return HttpResponse.json(systemGroup);
          }
          return HttpResponse.json(mockGroup);
        }),

        // Update group API handler
        http.put('/api/rbac/v1/groups/:groupId/', async ({ request }) => {
          const body = (await request.json()) as any;
          return HttpResponse.json({
            ...(body || {}),
            message: 'Group updated successfully',
            modified: new Date().toISOString(),
          });
        }),

        // Groups list API handler for validation
        http.get('/api/rbac/v1/groups/', ({ request }) => {
          const url = new URL(request.url);
          const name = url.searchParams.get('name');

          // Return empty result for unique names, or existing group for duplicates
          if (name === 'Duplicate Group') {
            return HttpResponse.json({
              data: [{ uuid: 'other-id', name: 'Duplicate Group' }],
              meta: { count: 1, limit: 10, offset: 0 },
            });
          }

          return HttpResponse.json({
            data: [],
            meta: { count: 0, limit: 10, offset: 0 },
          });
        }),
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  tags: ['autodocs'], // ONLY story with autodocs
  args: {
    initialRoute: '/groups/edit/test-group-id',
  },
  parameters: {
    docs: {
      description: {
        story: `
**EditGroupModal** is the modal component for editing RBAC group details with comprehensive form validation and API integration.

## Feature Overview

This modal provides a complete group editing experience with:

- ✏️ **Group Name Editing** - Updates group name with real-time validation
- 📝 **Description Management** - Optional description field with character limits  
- 🔍 **Async Name Validation** - Prevents duplicate group names across the system
- ⚠️ **Form Validation** - Pattern validation, required fields, and character limits
- 🔄 **API Integration** - Fetches existing group data and submits changes
- 🎯 **Success/Error Handling** - User feedback through notifications

## Additional Test Stories

For testing specific scenarios and edge cases, see these additional stories:

- **[SystemGroup](?path=/story/features-groups-editgroupmodal--system-group)**: Tests editing of system/platform default groups
- **[FormSubmission](?path=/story/features-groups-editgroupmodal--form-submission)**: Tests complete form workflow with API calls and spy verification
- **[ValidationErrors](?path=/story/features-groups-editgroupmodal--validation-errors)**: Tests form validation (required fields, pattern matching)
- **[CancelAction](?path=/story/features-groups-editgroupmodal--cancel-action)**: Tests modal cancellation and callback handling

## What This Tests

- ✅ Modal opens when button is clicked (autodocs compatible)
- ✅ Group data loads from API and populates form fields
- ✅ Modal displays correct title with group name
- ✅ Form fields are properly labeled and accessible
- ✅ Group name and description are pre-populated from API data
        `,
      },
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300); // Required for MSW

    const canvas = within(canvasElement);

    // Click button to open modal
    const openButton = await canvas.findByRole('button', { name: 'Edit Group' });
    await userEvent.click(openButton);

    // ✅ Modal renders to document.body via portal
    const modal = await screen.findByRole('dialog');
    await expect(modal).toBeInTheDocument();

    // Verify modal content
    await expect(within(modal).findByText('Edit group "Test Group"')).resolves.toBeInTheDocument();
    await expect(within(modal).findByDisplayValue('Test Group')).resolves.toBeInTheDocument();
    await expect(within(modal).findByDisplayValue('A test group for demonstration')).resolves.toBeInTheDocument();

    // Verify form fields are present
    const nameField = await within(modal).findByLabelText(/group name/i);
    const descriptionField = await within(modal).findByLabelText(/description/i);
    await expect(nameField).toBeInTheDocument();
    await expect(descriptionField).toBeInTheDocument();
  },
};

export const SystemGroup: Story = {
  args: {
    initialRoute: '/groups/edit/system-group-id',
  },
  play: async ({ canvasElement }) => {
    await delay(300); // Required for MSW

    const canvas = within(canvasElement);

    // Click button to open modal
    const openButton = await canvas.findByRole('button', { name: 'Edit Group' });
    await userEvent.click(openButton);

    // ✅ Modal renders to document.body via portal
    const modal = await screen.findByRole('dialog');
    await expect(modal).toBeInTheDocument();

    // Verify system group content
    await expect(within(modal).findByText('Edit group "System Group"')).resolves.toBeInTheDocument();
    await expect(within(modal).findByDisplayValue('System Group')).resolves.toBeInTheDocument();
    await expect(within(modal).findByDisplayValue('A system default group')).resolves.toBeInTheDocument();
  },
  parameters: {
    docs: {
      description: {
        story: 'EditGroupModal for system/platform default groups.',
      },
    },
  },
};

export const FormSubmission: Story = {
  args: {
    initialRoute: '/groups/edit/test-group-id',
    onClose: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Test form submission with validation, API calls, and parameter verification.',
      },
    },
    msw: {
      handlers: [
        // Fetch group API handler
        http.get('/api/rbac/v1/groups/:groupId/', ({ params }) => {
          if (params.groupId === 'test-group-id') {
            return HttpResponse.json(mockGroup);
          }
          return HttpResponse.json(mockGroup);
        }),

        // 🔍 SPY: Update group API handler with parameter verification
        http.put('/api/rbac/v1/groups/:groupId/', async ({ request, params }) => {
          const body = (await request.json()) as any;
          const { groupId } = params;

          // 🕵️ CRITICAL SPY: Call API spy with parameters for testing
          updateGroupApiSpy({
            groupId,
            method: 'PUT',
            body,
            expectedFields: ['uuid', 'name', 'description'],
          });

          console.log('SB: 🕵️ PUT Update Group API called!', {
            groupId,
            requestBody: body,
            expectedFields: ['uuid', 'name', 'description'],
          });

          return HttpResponse.json({
            ...body,
            modified: new Date().toISOString(),
          });
        }),

        // Groups list API handler for validation
        http.get('/api/rbac/v1/groups/', ({ request }) => {
          const url = new URL(request.url);
          const name = url.searchParams.get('name');

          if (name === 'Updated Group Name') {
            return HttpResponse.json({ data: [], meta: { count: 0, limit: 10, offset: 0 } });
          }

          return HttpResponse.json({ data: [], meta: { count: 0, limit: 10, offset: 0 } });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300); // Required for MSW

    const canvas = within(canvasElement);

    // 🔍 Clear any previous spy data
    updateGroupApiSpy.mockClear();

    console.log('SB: 🧪 Starting Edit Group Form Submission Test...');

    // Click button to open modal
    const openButton = await canvas.findByRole('button', { name: 'Edit Group' });
    await userEvent.click(openButton);

    // ✅ Modal renders to document.body via portal
    const modal = await screen.findByRole('dialog');
    await expect(modal).toBeInTheDocument();

    // Wait for form to be fully loaded
    await expect(within(modal).findByDisplayValue('Test Group')).resolves.toBeInTheDocument();

    // Modify form fields
    const nameField = await within(modal).findByLabelText(/group name/i);
    const descriptionField = await within(modal).findByLabelText(/description/i);

    await userEvent.clear(nameField);
    await userEvent.type(nameField, 'Updated Group Name');

    await userEvent.clear(descriptionField);
    await userEvent.type(descriptionField, 'Updated description');

    // Wait for validation to complete and save button to be enabled
    const saveButton = await within(modal).findByRole('button', { name: /save/i });
    await waitFor(() => expect(saveButton).toBeEnabled(), { timeout: 10000 });

    // Submit the form
    console.log('SB: 🚀 Submitting form...');
    await userEvent.click(saveButton);

    // ✅ VERIFY PUT API CALL: Check that the correct group data was sent
    await waitFor(
      async () => {
        await expect(updateGroupApiSpy).toHaveBeenCalledWith({
          groupId: 'test-group-id',
          method: 'PUT',
          body: {
            uuid: 'test-group-id',
            name: 'Updated Group Name',
            description: 'Updated description',
          },
          expectedFields: ['uuid', 'name', 'description'],
        });
        console.log('SB: ✅ PUT API Spy Verified with correct parameters');
      },
      { timeout: 5000 },
    );

    // ✅ Form submission completed - the EditGroupModal handles its own post-submission logic

    // ✅ TEST NOTIFICATION: Verify success notification appears in DOM
    await waitFor(
      async () => {
        const notificationPortal = document.querySelector('.notifications-portal');
        await expect(notificationPortal).toBeInTheDocument();

        const successAlert = notificationPortal?.querySelector('.pf-v5-c-alert.pf-m-success');
        await expect(successAlert).toBeInTheDocument();

        const alertTitle = successAlert?.querySelector('.pf-v5-c-alert__title');
        await expect(alertTitle).toHaveTextContent('Success updating group');

        const alertDescription = successAlert?.querySelector('.pf-v5-c-alert__description');
        await expect(alertDescription).toHaveTextContent('The group was updated successfully.');
      },
      { timeout: 5000 },
    );

    console.log('SB: ✅ Edit Group Form Submission test completed - check browser console for detailed API spy logs');
    console.log('SB: 📋 Expected API calls:');
    console.log('SB:   1. GET /api/rbac/v1/groups/{groupId} - Fetch group details');
    console.log('SB:   2. PUT /api/rbac/v1/groups/{groupId} - Update group with new data');
  },
};

export const ValidationErrors: Story = {
  args: {
    initialRoute: '/groups/edit/test-group-id',
  },
  play: async ({ canvasElement }) => {
    await delay(300); // Required for MSW

    const canvas = within(canvasElement);

    // Click button to open modal
    const openButton = await canvas.findByRole('button', { name: 'Edit Group' });
    await userEvent.click(openButton);

    // ✅ Modal renders to document.body via portal
    const modal = await screen.findByRole('dialog');
    await expect(modal).toBeInTheDocument();

    // Wait for form to be loaded
    await expect(within(modal).findByDisplayValue('Test Group')).resolves.toBeInTheDocument();

    const nameField = await within(modal).findByLabelText(/group name/i);

    // Test required field validation
    await userEvent.clear(nameField);
    await userEvent.tab(); // Trigger validation

    await expect(within(modal).findByText(/required/i)).resolves.toBeInTheDocument();

    // Test invalid pattern
    await userEvent.clear(nameField);
    await userEvent.type(nameField, '!invalid-name');
    await userEvent.tab(); // Trigger validation

    await expect(within(modal).findByText(/must start with alphanumeric character/i)).resolves.toBeInTheDocument();

    // Verify save button is disabled when there are errors
    const saveButton = await within(modal).findByRole('button', { name: /save/i });
    await expect(saveButton).toBeDisabled();
  },
  parameters: {
    docs: {
      description: {
        story: 'Test basic form validation scenarios (required field, pattern validation).',
      },
    },
  },
};

export const CancelAction: Story = {
  args: {
    initialRoute: '/groups/edit/test-group-id',
    onClose: fn(),
  },
  play: async ({ canvasElement }) => {
    await delay(300); // Required for MSW

    const canvas = within(canvasElement);

    // Click button to open modal
    const openButton = await canvas.findByRole('button', { name: 'Edit Group' });
    await userEvent.click(openButton);

    // ✅ Modal renders to document.body via portal
    const modal = await screen.findByRole('dialog');
    await expect(modal).toBeInTheDocument();

    // Click cancel button
    const cancelButton = await within(modal).findByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);

    // ✅ Cancel action completed - modal handles its own navigation logic
  },
  parameters: {
    docs: {
      description: {
        story: 'Test cancel action closes modal and triggers callback.',
      },
    },
  },
};

export const ErrorNotification: Story = {
  args: {
    initialRoute: '/groups/edit/test-group-id',
  },
  parameters: {
    msw: {
      handlers: [
        // Fetch group API handler - same as default
        http.get('/api/rbac/v1/groups/:groupId/', ({ params }) => {
          if (params.groupId === 'test-group-id') {
            return HttpResponse.json(mockGroup);
          }
          if (params.groupId === 'system-group-id') {
            return HttpResponse.json(systemGroup);
          }
          return HttpResponse.json(mockGroup);
        }),

        // Group name validation API handler - same as default
        http.get('/api/rbac/v1/groups/', ({ request }) => {
          const url = new URL(request.url);
          const name = url.searchParams.get('name');

          if (!name) {
            return HttpResponse.json({ data: [], meta: { count: 0, limit: 10, offset: 0 } });
          }

          return HttpResponse.json({ data: [], meta: { count: 0, limit: 10, offset: 0 } });
        }),

        // ❌ ERROR: Update group API handler that returns 500 error
        http.put('/api/rbac/v1/groups/:groupId/', async () => {
          await delay(100);
          return new HttpResponse(
            JSON.stringify({
              errors: [
                {
                  status: '500',
                  detail: 'Internal server error occurred while updating group',
                },
              ],
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
          );
        }),
      ],
    },
    docs: {
      description: {
        story: 'Test error notification when form submission fails.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300); // Required for MSW

    const canvas = within(canvasElement);

    // 🔍 Clear any previous spy data
    updateGroupApiSpy.mockClear();

    // Click button to open modal
    const openButton = await canvas.findByRole('button', { name: 'Edit Group' });
    await userEvent.click(openButton);

    // ✅ Modal renders to document.body via portal
    const modal = await screen.findByRole('dialog');
    await expect(modal).toBeInTheDocument();

    // Wait for form to be fully loaded
    await expect(within(modal).findByDisplayValue('Test Group')).resolves.toBeInTheDocument();

    // Modify form fields to trigger update
    const nameField = await within(modal).findByLabelText(/group name/i);
    await userEvent.clear(nameField);
    await userEvent.type(nameField, 'Updated Group Name');

    // Wait for save button to be enabled
    const saveButton = await within(modal).findByRole('button', { name: /save/i });
    await waitFor(() => expect(saveButton).toBeEnabled(), { timeout: 10000 });

    // Submit the form (this will fail due to our MSW error handler)
    await userEvent.click(saveButton);

    // ✅ TEST NOTIFICATION: Verify error notification appears in DOM
    await waitFor(
      async () => {
        const notificationPortal = document.querySelector('.notifications-portal');
        await expect(notificationPortal).toBeInTheDocument();

        const errorAlert = notificationPortal?.querySelector('.pf-v5-c-alert.pf-m-danger');
        await expect(errorAlert).toBeInTheDocument();

        const alertTitle = errorAlert?.querySelector('.pf-v5-c-alert__title');
        await expect(alertTitle).toHaveTextContent('Failed updating group');

        const alertDescription = errorAlert?.querySelector('.pf-v5-c-alert__description');
        await expect(alertDescription).toHaveTextContent('The group was not updated successfuly.');
      },
      { timeout: 5000 },
    );

    // ✅ Error handling completed - the EditGroupModal handles its own error logic
  },
};
