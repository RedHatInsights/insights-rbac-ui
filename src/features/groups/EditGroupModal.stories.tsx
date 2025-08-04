import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { delay } from 'msw';
import { HttpResponse, http } from 'msw';
import { EditGroupModal } from './EditGroupModal';

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
      {isOpen && (
        <EditGroupModal
          postMethod={props.postMethod || fn()}
          pagination={{ limit: 20 }}
          cancelRoute="/groups"
          submitRoute="/groups"
          onClose={handleCloseModal}
          {...props}
        />
      )}
    </div>
  );
};

const meta: Meta<typeof EditGroupModalWrapper> = {
  component: EditGroupModalWrapper,
  tags: ['edit-group-modal'], // NO autodocs on meta
  decorators: [
    (Story, context) => {
      const { initialRoute } = context.args;
      return (
        <MemoryRouter initialEntries={[initialRoute]}>
          <Routes>
            <Route path="/groups/edit/:groupId" element={<Story />} />
          </Routes>
        </MemoryRouter>
      );
    },
  ],
  args: {
    postMethod: fn(),
    onClose: fn(),
  },
  argTypes: {
    initialRoute: { description: 'Initial route for the story', control: 'text' },
    postMethod: { description: 'Callback function called after group update' },
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
    const openButton = canvas.getByRole('button', { name: 'Edit Group' });
    await userEvent.click(openButton);

    // ✅ Modal renders to document.body via portal - use screen, not canvas
    await waitFor(
      async () => {
        const modal = screen.getByRole('dialog');
        expect(modal).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    const modal = screen.getByRole('dialog');

    // Verify modal content
    expect(within(modal).getByText('Edit group "Test Group"')).toBeInTheDocument();
    expect(within(modal).getByDisplayValue('Test Group')).toBeInTheDocument();
    expect(within(modal).getByDisplayValue('A test group for demonstration')).toBeInTheDocument();

    // Verify form fields are present
    const nameField = within(modal).getByLabelText(/group name/i);
    const descriptionField = within(modal).getByLabelText(/description/i);
    expect(nameField).toBeInTheDocument();
    expect(descriptionField).toBeInTheDocument();
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
    const openButton = canvas.getByRole('button', { name: 'Edit Group' });
    await userEvent.click(openButton);

    await waitFor(
      async () => {
        const modal = screen.getByRole('dialog');
        expect(modal).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    const modal = screen.getByRole('dialog');

    // Verify system group content
    expect(within(modal).getByText('Edit group "System Group"')).toBeInTheDocument();
    expect(within(modal).getByDisplayValue('System Group')).toBeInTheDocument();
    expect(within(modal).getByDisplayValue('A system default group')).toBeInTheDocument();
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
    postMethod: fn(),
  },
  play: async ({ canvasElement, args }) => {
    await delay(300); // Required for MSW

    const canvas = within(canvasElement);

    // Click button to open modal
    const openButton = canvas.getByRole('button', { name: 'Edit Group' });
    await userEvent.click(openButton);

    await waitFor(
      async () => {
        const modal = screen.getByRole('dialog');
        expect(modal).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    const modal = screen.getByRole('dialog');

    // Wait for form to be fully loaded
    await waitFor(() => {
      expect(within(modal).getByDisplayValue('Test Group')).toBeInTheDocument();
    });

    // Modify form fields
    const nameField = within(modal).getByLabelText(/group name/i);
    const descriptionField = within(modal).getByLabelText(/description/i);

    await userEvent.clear(nameField);
    await userEvent.type(nameField, 'Updated Group Name');

    await userEvent.clear(descriptionField);
    await userEvent.type(descriptionField, 'Updated description');

    // Wait for validation to complete and save button to be enabled
    await waitFor(
      () => {
        const saveButton = within(modal).getByRole('button', { name: /save/i });
        expect(saveButton).toBeEnabled();
      },
      { timeout: 10000 },
    );

    // Submit the form
    const saveButton = within(modal).getByRole('button', { name: /save/i });
    await userEvent.click(saveButton);

    // Verify postMethod was called
    await waitFor(
      () => {
        expect(args.postMethod).toHaveBeenCalled();
      },
      { timeout: 5000 },
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Test form submission with validation and API calls.',
      },
    },
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
    const openButton = canvas.getByRole('button', { name: 'Edit Group' });
    await userEvent.click(openButton);

    await waitFor(
      async () => {
        const modal = screen.getByRole('dialog');
        expect(modal).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    const modal = screen.getByRole('dialog');

    // Wait for form to be loaded
    await waitFor(() => {
      expect(within(modal).getByDisplayValue('Test Group')).toBeInTheDocument();
    });

    const nameField = within(modal).getByLabelText(/group name/i);

    // Test required field validation
    await userEvent.clear(nameField);
    await userEvent.tab(); // Trigger validation

    await waitFor(() => {
      expect(within(modal).getByText(/required/i)).toBeInTheDocument();
    });

    // Test invalid pattern
    await userEvent.clear(nameField);
    await userEvent.type(nameField, '!invalid-name');
    await userEvent.tab(); // Trigger validation

    await waitFor(() => {
      expect(within(modal).getByText(/must start with alphanumeric character/i)).toBeInTheDocument();
    });

    // Verify save button is disabled when there are errors
    const saveButton = within(modal).getByRole('button', { name: /save/i });
    expect(saveButton).toBeDisabled();
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
  play: async ({ canvasElement, args }) => {
    await delay(300); // Required for MSW

    const canvas = within(canvasElement);

    // Click button to open modal
    const openButton = canvas.getByRole('button', { name: 'Edit Group' });
    await userEvent.click(openButton);

    await waitFor(
      async () => {
        const modal = screen.getByRole('dialog');
        expect(modal).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    const modal = screen.getByRole('dialog');

    // Click cancel button
    const cancelButton = within(modal).getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);

    // Verify onClose was called
    await waitFor(() => {
      expect(args.onClose).toHaveBeenCalled();
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
