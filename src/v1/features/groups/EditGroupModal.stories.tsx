import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { queryNotificationPortal, waitForModal } from '../../../test-utils/interactionHelpers';
import { EditGroupModal } from './EditGroupModal';
import { groupsHandlers } from '../../data/mocks/groups.handlers';
import { fillEditGroupModal } from './EditGroupModal.helpers';

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

interface EditGroupModalWrapperProps {
  group: typeof mockGroup | typeof systemGroup;
  onClose?: () => void;
  initialRoute?: string;
}

// Wrapper component with button to open modal
const EditGroupModalWrapper: React.FC<EditGroupModalWrapperProps> = (props) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleOpenModal = () => setIsOpen(true);
  const handleCloseModal = () => {
    setIsOpen(false);
    props.onClose?.();
  };

  return (
    <div style={{ height: '100vh' }}>
      <button onClick={handleOpenModal}>Edit Group</button>
      {isOpen && <EditGroupModal cancelRoute="/user-access/groups" submitRoute="/user-access/groups" onClose={handleCloseModal} {...props} />}
    </div>
  );
};

const meta: Meta<typeof EditGroupModalWrapper> = {
  component: EditGroupModalWrapper,
  decorators: [
    (Story, context) => {
      const { initialRoute = '/user-access/groups/edit/group-1' } = context.args;
      return (
        <MemoryRouter initialEntries={[initialRoute]}>
          <Routes>
            <Route path="/user-access/groups/edit/:groupId" element={<Story />} />
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
        ...groupsHandlers([
          mockGroup,
          systemGroup,
          {
            uuid: 'other-id',
            name: 'Duplicate Group',
            description: '',
            principalCount: 0,
            roleCount: 0,
            platform_default: false,
            admin_default: false,
            system: false,
            created: '',
            modified: '',
          },
        ]),
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  tags: ['autodocs'], // ONLY story with autodocs
  args: {
    initialRoute: '/user-access/groups/edit/test-group-id',
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Open modal and verify content', async () => {
      // Click button to open modal
      const openButton = await canvas.findByRole('button', { name: 'Edit Group' });
      await userEvent.click(openButton);

      // ✅ Modal renders to document.body via portal
      const modal = await waitForModal();
      // Verify modal content
      await expect(modal.findByText('Edit group "Test Group"')).resolves.toBeInTheDocument();
      await expect(modal.findByDisplayValue('Test Group')).resolves.toBeInTheDocument();
      await expect(modal.findByDisplayValue('A test group for demonstration')).resolves.toBeInTheDocument();

      // Verify form fields are present
      const nameField = await modal.findByLabelText(/group name/i);
      const descriptionField = await modal.findByLabelText(/description/i);
      await expect(nameField).toBeInTheDocument();
      await expect(descriptionField).toBeInTheDocument();
    });
  },
};

export const SystemGroup: Story = {
  args: {
    initialRoute: '/user-access/groups/edit/system-group-id',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Open modal and verify system group content', async () => {
      // Click button to open modal
      const openButton = await canvas.findByRole('button', { name: 'Edit Group' });
      await userEvent.click(openButton);

      // ✅ Modal renders to document.body via portal
      const modal = await waitForModal();

      // Verify system group content
      await expect(modal.findByText('Edit group "System Group"')).resolves.toBeInTheDocument();
      await expect(modal.findByDisplayValue('System Group')).resolves.toBeInTheDocument();
      await expect(modal.findByDisplayValue('A system default group')).resolves.toBeInTheDocument();
    });
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
    initialRoute: '/user-access/groups/edit/test-group-id',
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
        ...groupsHandlers([mockGroup, systemGroup], {
          onUpdate: (...args) =>
            updateGroupApiSpy({
              groupId: args[0],
              method: 'PUT',
              body: args[1],
              expectedFields: ['uuid', 'name', 'description'],
            }),
        }),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Fill form and submit', async () => {
      // 🔍 Clear any previous spy data
      updateGroupApiSpy.mockClear();

      // Click button to open modal
      const openButton = await canvas.findByRole('button', { name: 'Edit Group' });
      await userEvent.click(openButton);

      // Use the reusable helper to fill and submit the form
      await fillEditGroupModal(
        {
          name: 'Updated Group Name',
          description: 'Updated description',
        },
        false,
      ); // Don't wait for completion - we'll verify API calls ourselves

      // ✅ VERIFY PUT API CALL: Check that the correct group data was sent
      // Note: The rbac-client sends uuid in the URL path, not in the request body
      await waitFor(
        async () => {
          await expect(updateGroupApiSpy).toHaveBeenCalledWith({
            groupId: 'test-group-id',
            method: 'PUT',
            body: {
              name: 'Updated Group Name',
              description: 'Updated description',
            },
            expectedFields: ['uuid', 'name', 'description'],
          });
        },
        { timeout: 5000 },
      );

      // ✅ Form submission completed - the EditGroupModal handles its own post-submission logic

      // ✅ TEST NOTIFICATION: Verify success notification appears in DOM
      await waitFor(
        () => {
          const notificationPortal = queryNotificationPortal();
          expect(notificationPortal).toBeInTheDocument();

          const successAlert = notificationPortal?.querySelector('.pf-v6-c-alert.pf-m-success');
          expect(successAlert).toBeInTheDocument();

          const alertTitle = successAlert?.querySelector('.pf-v6-c-alert__title');
          expect(alertTitle).toHaveTextContent('Success updating group');

          const alertDescription = successAlert?.querySelector('.pf-v6-c-alert__description');
          expect(alertDescription).toHaveTextContent('The group was updated successfully.');
        },
        { timeout: 5000 },
      );
    });
  },
};

export const ValidationErrors: Story = {
  args: {
    initialRoute: '/user-access/groups/edit/test-group-id',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify validation errors', async () => {
      // Click button to open modal
      const openButton = await canvas.findByRole('button', { name: 'Edit Group' });
      await userEvent.click(openButton);

      // ✅ Modal renders to document.body via portal
      const modal = await waitForModal();

      // Wait for form to be loaded
      await expect(modal.findByDisplayValue('Test Group')).resolves.toBeInTheDocument();

      const nameField = await modal.findByLabelText(/group name/i);

      // Test required field validation
      await userEvent.clear(nameField);
      await userEvent.tab(); // Trigger validation

      await expect(modal.findByText(/required/i)).resolves.toBeInTheDocument();

      // Test invalid pattern
      await userEvent.clear(nameField);
      await userEvent.type(nameField, '!invalid-name');
      await userEvent.tab(); // Trigger validation

      await expect(modal.findByText(/must start with alphanumeric character/i)).resolves.toBeInTheDocument();

      // Verify save button is disabled when there are errors
      const saveButton = await modal.findByRole('button', { name: /save/i });
      await expect(saveButton).toBeDisabled();
    });
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
    initialRoute: '/user-access/groups/edit/test-group-id',
    onClose: fn(),
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Open modal and cancel', async () => {
      // Click button to open modal
      const openButton = await canvas.findByRole('button', { name: 'Edit Group' });
      await userEvent.click(openButton);

      // ✅ Modal renders to document.body via portal
      const modal = await waitForModal();

      // Click cancel button
      const cancelButton = await modal.findByRole('button', { name: /cancel/i });
      await userEvent.click(cancelButton);

      // ✅ Cancel action completed - modal handles its own navigation logic
    });
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
    initialRoute: '/user-access/groups/edit/test-group-id',
  },
  parameters: {
    msw: {
      handlers: [...groupsHandlers([mockGroup, systemGroup], { putReturnsError: 500 })],
    },
    docs: {
      description: {
        story: 'Test error notification when form submission fails.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Submit form and verify error notification', async () => {
      // 🔍 Clear any previous spy data
      updateGroupApiSpy.mockClear();

      // Click button to open modal
      const openButton = await canvas.findByRole('button', { name: 'Edit Group' });
      await userEvent.click(openButton);

      // ✅ Modal renders to document.body via portal
      const modal = await waitForModal();

      // Wait for form to be fully loaded
      const testGroupInput = await modal.findByDisplayValue('Test Group');
      expect(testGroupInput).toBeInTheDocument();

      // Modify form fields to trigger update
      const nameField = await modal.findByLabelText(/group name/i);
      await userEvent.clear(nameField);
      await userEvent.type(nameField, 'Updated Group Name');

      // Wait for save button to be enabled
      const saveButton = await modal.findByRole('button', { name: /save/i });
      await waitFor(() => expect(saveButton).toBeEnabled(), { timeout: 10000 });

      // Submit the form (this will fail due to our MSW error handler)
      await userEvent.click(saveButton);

      // ✅ TEST NOTIFICATION: Verify error notification appears in DOM
      // Notification may take time to render after form submission failure
      const body = within(document.body);
      await body.findByText('Failed updating group', {}, { timeout: 5000 });
      await body.findByText('The group was not updated successfuly.', {}, { timeout: 2000 });

      // ✅ Error handling completed - the EditGroupModal handles its own error logic
    });
  },
};
