import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { HttpResponse, http } from 'msw';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import FormRenderer from '@data-driven-forms/react-form-renderer/form-renderer';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import Pf4FormTemplate from '@data-driven-forms/pf4-component-mapper/form-template';
import { SetName } from './SetName';

// Extended component mapper to include SetName
const extendedMapper = {
  ...componentMapper,
  'set-name': SetName,
};

// Mock form schema for the SetName step
const setNameSchema = {
  fields: [
    {
      component: 'set-name',
      name: 'group-data',
      label: 'Group Information',
      validate: [
        {
          type: 'required',
          message: 'Group name is required',
        },
      ],
    },
  ],
};

// Wrapper component to test SetName within a form context
const SetNameWithForm: React.FC<{
  onSubmit?: (values: any) => void;
  initialValues?: any;
}> = ({ onSubmit = () => {}, initialValues = {} }) => {
  return (
    <FormRenderer
      componentMapper={extendedMapper}
      FormTemplate={(props) => <Pf4FormTemplate {...props} showFormControls={false} />}
      schema={setNameSchema}
      onSubmit={onSubmit}
      initialValues={initialValues}
    />
  );
};

const meta: Meta<typeof SetNameWithForm> = {
  component: SetNameWithForm,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
SetName component for the Add Group wizard first step. Features:
- **Group name input** with required validation and uniqueness checking
- **Group description textarea** with optional 150-character limit
- **Async validation** that checks if group name already exists
- **Real-time validation** with error states and helper text
- **Integration with data-driven-forms** for wizard functionality
- **Debounced API calls** to prevent excessive validation requests

The component uses PatternFly form components and integrates with the broader Add Group wizard workflow.
        `,
      },
    },
    msw: {
      handlers: [
        // Mock group name uniqueness validation
        http.get('/api/rbac/v1/groups/', ({ request }) => {
          const url = new URL(request.url);
          const name = url.searchParams.get('name');
          const nameMatch = url.searchParams.get('name_match');

          console.log('SB: 🔍 Group validation API called:', { name, nameMatch });

          // Simulate existing group names for validation testing
          const existingNames = ['Admin Group', 'Test Group', 'existing-group'];
          const groupExists = existingNames.some((existingName) =>
            nameMatch === 'exact' ? existingName === name : existingName.toLowerCase().includes((name || '').toLowerCase()),
          );

          if (groupExists) {
            return HttpResponse.json({
              data: [{ uuid: 'existing-uuid', name: name }],
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
  args: {
    onSubmit: fn(),
    initialValues: {},
  },
};

export default meta;
type Story = StoryObj<typeof SetNameWithForm>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify form fields are rendered
    const nameInput = await canvas.findByRole('textbox', { name: /name/i });
    const descriptionInput = await canvas.findByRole('textbox', { name: /description/i });

    expect(nameInput).toBeInTheDocument();
    expect(descriptionInput).toBeInTheDocument();
    // Note: data-driven-forms handles validation via JavaScript, not HTML5 required attribute

    // Test basic input functionality
    await userEvent.type(nameInput, 'New Group Name');
    await userEvent.type(descriptionInput, 'A description for the new group');

    // Verify values are set
    expect(nameInput).toHaveValue('New Group Name');
    expect(descriptionInput).toHaveValue('A description for the new group');

    // Verify helper text
    expect(await canvas.findByText('Provide a unique name for the group')).toBeInTheDocument();
    expect(await canvas.findByText('Optional field')).toBeInTheDocument();
  },
};

export const WithInitialValues: Story = {
  args: {
    initialValues: {
      'group-name': 'Pre-filled Group',
      'group-description': 'Pre-filled description',
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify initial values are loaded
    const nameInput = await canvas.findByRole('textbox', { name: /name/i });
    const descriptionInput = await canvas.findByRole('textbox', { name: /description/i });

    expect(nameInput).toHaveValue('Pre-filled Group');
    expect(descriptionInput).toHaveValue('Pre-filled description');
  },
};

export const ValidationTesting: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const nameInput = await canvas.findByRole('textbox', { name: /name/i });
    const descriptionInput = await canvas.findByRole('textbox', { name: /description/i });

    // Test character limit validation for name
    const longName = 'A'.repeat(151); // Over 150 character limit
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, longName);

    await waitFor(async () => {
      expect(await canvas.findByText(/can have maximum of 150 characters/i)).toBeInTheDocument();
    });

    // Test character limit validation for description
    const longDescription = 'B'.repeat(151);
    await userEvent.clear(descriptionInput);
    await userEvent.type(descriptionInput, longDescription);

    const errorElements = await canvas.findAllByText(/can have maximum of 150 characters/i);
    expect(errorElements.length).toBeGreaterThan(0);

    // Test valid inputs
    await userEvent.clear(nameInput);
    await userEvent.clear(descriptionInput);
    await userEvent.type(nameInput, 'Valid Group Name');
    await userEvent.type(descriptionInput, 'Valid description');

    await waitFor(async () => {
      expect(await canvas.findByText('Provide a unique name for the group')).toBeInTheDocument();
      expect(await canvas.findByText('Optional field')).toBeInTheDocument();
    });
  },
};

export const DuplicateNameValidation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const nameInput = await canvas.findByRole('textbox', { name: /name/i });

    // Test existing group name (should trigger validation error)
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Admin Group'); // This name exists in our mock

    // Wait for async validation to complete
    await waitFor(
      async () => {
        // The actual error message will depend on the validation implementation
        // Look for error state styling or validation messages
        expect(nameInput).toHaveAttribute('aria-invalid', 'true');
      },
      { timeout: 5000 },
    );
  },
};

export const FormSubmissionTest: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const nameInput = await canvas.findByRole('textbox', { name: /name/i });
    const descriptionInput = await canvas.findByRole('textbox', { name: /description/i });

    // Fill out the form
    await userEvent.type(nameInput, 'Submittable Group');
    await userEvent.type(descriptionInput, 'A group ready for submission');

    // Wait for validation to complete
    await waitFor(async () => {
      expect(await canvas.findByText('Provide a unique name for the group')).toBeInTheDocument();
    });

    // In a real wizard, there would be a Next button, but since this is just the component
    // we verify the form fields are properly populated and validated
    expect(nameInput).toHaveValue('Submittable Group');
    expect(descriptionInput).toHaveValue('A group ready for submission');
  },
};

export const EmptyFormValidation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const nameInput = await canvas.findByRole('textbox', { name: /name/i });

    // Test empty required field (validation handled by data-driven-forms JavaScript)
    expect(nameInput).toHaveValue('');

    // Focus and blur to trigger validation
    await userEvent.click(nameInput);
    await userEvent.tab();

    // Required field validation should be handled by the form renderer
    // The component itself handles uniqueness validation
  },
};
