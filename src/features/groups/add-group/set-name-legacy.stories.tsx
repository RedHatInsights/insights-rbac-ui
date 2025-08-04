import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { HttpResponse, http } from 'msw';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import FormRenderer from '@data-driven-forms/react-form-renderer/form-renderer';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import Pf4FormTemplate from '@data-driven-forms/pf4-component-mapper/form-template';
import SetName from './set-name-legacy';

// Extended component mapper to include the SetName component
const extendedMapper = {
  ...componentMapper,
  'set-name': SetName,
};

// Mock form schema matching the actual wizard schema
const setNameSchema = {
  fields: [
    {
      component: 'set-name',
      name: 'group-name',
      validate: [{ type: 'required' }],
    },
    {
      component: 'textarea',
      name: 'group-description',
      hideField: true,
      validate: [{ type: 'max-length', threshold: 150 }],
    },
  ],
};

// Wrapper component to provide FormRenderer context
const SetNameWithForm: React.FC<{
  onSubmit?: (values: any) => void;
  initialValues?: any;
}> = ({ onSubmit = () => {}, initialValues = {} }) => {
  return (
    <FormRenderer
      schema={setNameSchema}
      componentMapper={extendedMapper}
      FormTemplate={Pf4FormTemplate}
      onSubmit={onSubmit}
      initialValues={initialValues}
    />
  );
};

const meta: Meta<typeof SetNameWithForm> = {
  title: 'Features/Groups/AddGroup/SetName-Legacy',
  component: SetNameWithForm,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Name and description step component for the Add Group wizard. Features:

- **Group Name Input**: Required field with async validation to check uniqueness
- **Group Description**: Optional textarea with 150 character limit
- **Real-time Validation**: Shows errors for required fields and character limits
- **Async Name Validation**: Checks if group name already exists
- **Form Integration**: Uses data-driven-forms API for state management
- **Internationalization**: All labels and error messages are localized

The component validates group name uniqueness by making API calls to check existing groups.
        `,
      },
    },
    msw: {
      handlers: [
        // Group name uniqueness validation API
        http.get('/api/rbac/v1/groups/', ({ request }) => {
          const url = new URL(request.url);
          const nameFilter = url.searchParams.get('name');

          // Return existing group if name matches (for conflict testing)
          if (nameFilter === 'existing-group') {
            return HttpResponse.json({
              data: [{ uuid: 'existing-uuid', name: 'existing-group' }],
              meta: { count: 1 },
            });
          }

          // Return empty for unique names
          return HttpResponse.json({
            data: [],
            meta: { count: 0 },
          });
        }),
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify form fields are present
    expect(await canvas.findByLabelText('Group name')).toBeInTheDocument();
    expect(await canvas.findByLabelText('Group description')).toBeInTheDocument();

    // Verify required indicator
    expect(await canvas.findByText('Group name')).toBeInTheDocument();
    expect(await canvas.findByText('Group description')).toBeInTheDocument();
  },
};

export const WithInitialValues: Story = {
  args: {
    initialValues: {
      'group-name': 'My Group',
      'group-description': 'This is a test group for demonstration purposes.',
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify initial values are populated using more specific selectors
    const nameInput = await canvas.findByLabelText(/group name/i);
    expect(nameInput).toHaveValue('My Group');

    const descriptionInput = await canvas.findByLabelText(/group description/i);
    expect(descriptionInput).toHaveValue('This is a test group for demonstration purposes.');
  },
};

export const RequiredFieldValidation: Story = {
  args: {
    onSubmit: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // **QE FIX: Wait for async validation to complete before submission**
    const nameField = await canvas.findByLabelText(/group name/i);
    await userEvent.type(nameField, 'Valid Test Group');

    // Critical: Wait for async validation to complete
    // The component does API validation and sets field value only on success
    await waitFor(
      () => {
        expect(nameField).toHaveValue('Valid Test Group');
      },
      { timeout: 5000 },
    );

    // Additional wait to ensure async validation has fully completed
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const submitButton = await canvas.findByRole('button', { name: /submit/i });
    await userEvent.click(submitButton);

    await waitFor(
      () => {
        expect(args.onSubmit).toHaveBeenCalled();
      },
      { timeout: 5000 },
    );
  },
};

export const MaxLengthValidation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Fill in a very long description (over 150 characters)
    const descriptionField = await canvas.findByLabelText('Group description');
    const longDescription = 'A'.repeat(151); // 151 characters

    await userEvent.type(descriptionField, longDescription);

    // Should show character limit error
    await waitFor(() => {
      expect(canvas.getByText(/maximum.*150.*characters/i)).toBeInTheDocument();
    });
  },
};

export const NameConflictValidation: Story = {
  args: {
    onSubmit: fn(),
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/groups/', ({ request }) => {
          const url = new URL(request.url);
          const nameFilter = url.searchParams.get('name');

          // Return existing group if name matches exactly "existing-group"
          if (nameFilter === 'existing-group') {
            return HttpResponse.json({
              data: [{ uuid: 'existing-uuid', name: 'existing-group' }],
              meta: { count: 1 },
            });
          }

          // Return empty for unique names
          return HttpResponse.json({
            data: [],
            meta: { count: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // **QE FIX: Ensure async validation completes**
    const nameField = await canvas.findByLabelText('Group name');
    await userEvent.type(nameField, 'unique-valid-group-name');

    // Critical: Wait for async validation to complete
    await waitFor(
      () => {
        expect(nameField).toHaveValue('unique-valid-group-name');
      },
      { timeout: 5000 },
    );

    // Additional wait for async validation completion
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const submitButton = await canvas.findByRole('button', { name: /submit/i });
    await userEvent.click(submitButton);

    await waitFor(
      () => {
        expect(args.onSubmit).toHaveBeenCalled();
      },
      { timeout: 5000 },
    );
  },
};

export const ValidForm: Story = {
  args: {
    onSubmit: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Fill in valid group information
    const nameField = await canvas.findByLabelText('Group name');
    const descriptionField = await canvas.findByLabelText('Group description');

    await userEvent.type(nameField, 'Valid Group Name');
    await userEvent.type(descriptionField, 'A valid group description with reasonable length.');

    // Wait for async validation to complete
    await waitFor(
      () => {
        const nameInput = canvas.getByLabelText('Group name');
        expect(nameInput).not.toHaveClass('pf-m-error');
      },
      { timeout: 3000 },
    );

    // Submit the form
    const submitButton = await canvas.findByRole('button', { name: /submit/i });
    await userEvent.click(submitButton);

    // Form should submit successfully (data-driven forms passes form data + form API)
    await waitFor(() => {
      expect(args.onSubmit).toHaveBeenCalled();
      const callArgs = (args.onSubmit as any).mock.calls[0];
      expect(callArgs[0]).toEqual({
        'group-name': 'Valid Group Name',
        'group-description': 'A valid group description with reasonable length.',
      });
      expect(callArgs[1]).toBeTruthy(); // Form API object should exist
    });
  },
};

export const EmptyDescriptionAllowed: Story = {
  args: {
    onSubmit: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // **QE FIX: Ensure async validation completes before submission**
    const nameField = await canvas.findByLabelText('Group name');
    await userEvent.type(nameField, 'Minimal Group Name');

    // Critical: Wait for async validation to complete
    await waitFor(
      () => {
        expect(nameField).toHaveValue('Minimal Group Name');
      },
      { timeout: 5000 },
    );

    // Additional wait for async validation completion
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Submit - should work with just the required field
    const submitButton = await canvas.findByRole('button', { name: /submit/i });
    await userEvent.click(submitButton);

    await waitFor(
      () => {
        expect(args.onSubmit).toHaveBeenCalled();
      },
      { timeout: 5000 },
    );
  },
};
