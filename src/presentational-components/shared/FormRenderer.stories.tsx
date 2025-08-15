import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { componentTypes, validatorTypes } from '@data-driven-forms/react-form-renderer';
import { expect, fn, userEvent, within } from 'storybook/test';
import FormRenderer from './FormRenderer';

const meta: Meta<typeof FormRenderer> = {
  component: FormRenderer,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
FormRenderer component that provides a complete form solution with integrated FormButtons.
- Wraps data-driven-forms FormRenderer with custom component mapper
- Automatically injects FormButtons into the form template
- Provides Save and Cancel actions with form state awareness
- Save button is disabled when no changes are made
- Cancel button always enabled for form reset
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '20px', maxWidth: '600px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FormRenderer>;

const createFormSchema = () => ({
  fields: [
    {
      name: 'name',
      label: 'Name',
      component: componentTypes.TEXT_FIELD,
      validate: [{ type: validatorTypes.REQUIRED }],
    },
    {
      name: 'description',
      label: 'Description',
      component: componentTypes.TEXTAREA,
    },
  ],
});

export const Default: Story = {
  args: {
    onSubmit: fn(),
    onCancel: fn(),
  },
  render: ({ onSubmit, onCancel }) => <FormRenderer schema={createFormSchema()} onSubmit={onSubmit} onCancel={onCancel} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Check that form fields are present
    const nameInput = canvas.getByLabelText(/name/i);
    const descriptionInput = canvas.getByLabelText(/description/i);

    expect(nameInput).toBeInTheDocument();
    expect(descriptionInput).toBeInTheDocument();

    // Check that buttons are present
    const saveButton = canvas.getByRole('button', { name: /save/i });
    const cancelButton = canvas.getByRole('button', { name: /cancel/i });

    expect(saveButton).toBeInTheDocument();
    expect(cancelButton).toBeInTheDocument();

    // Initially, save button should be disabled (form is pristine)
    expect(saveButton).toBeDisabled();

    // Test form interaction to change button state
    await userEvent.type(nameInput, 'Test Name');

    // Wait a moment for form state to update
    await new Promise((resolve) => setTimeout(resolve, 100));

    // After typing, the save button should be enabled (form has changes)
    expect(saveButton).not.toBeDisabled();

    // Test button interactions
    await userEvent.click(saveButton);
    await userEvent.click(cancelButton);

    expect(args.onSubmit).toHaveBeenCalled();
    expect(args.onCancel).toHaveBeenCalled();
  },
};

export const WithInitialValues: Story = {
  args: {
    onSubmit: fn(),
    onCancel: fn(),
  },
  render: ({ onSubmit, onCancel }) => (
    <FormRenderer
      schema={createFormSchema()}
      onSubmit={onSubmit}
      onCancel={onCancel}
      initialValues={{
        name: 'Initial Name',
        description: 'Initial description text',
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Check that initial values are populated
    const nameInput = canvas.getByLabelText(/name/i) as HTMLInputElement;
    const descriptionInput = canvas.getByLabelText(/description/i) as HTMLTextAreaElement;

    expect(nameInput.value).toBe('Initial Name');
    expect(descriptionInput.value).toBe('Initial description text');

    // With initial values, save button should be disabled (no changes yet)
    const saveButton = canvas.getByRole('button', { name: /save/i });
    expect(saveButton).toBeDisabled();

    // Test making changes
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Modified Name');

    // Wait for form state to update
    await new Promise((resolve) => setTimeout(resolve, 100));

    // After changes, save button should be enabled
    expect(saveButton).not.toBeDisabled();
  },
};

export const WithValidation: Story = {
  args: {
    onSubmit: fn(),
    onCancel: fn(),
  },
  render: ({ onSubmit, onCancel }) => <FormRenderer schema={createFormSchema()} onSubmit={onSubmit} onCancel={onCancel} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    const saveButton = canvas.getByRole('button', { name: /save/i });
    const nameInput = canvas.getByLabelText(/name/i);

    // Initially, save button should be disabled (no changes and required field empty)
    expect(saveButton).toBeDisabled();

    // Try to submit without filling required field - button should be disabled
    // We can't click a disabled button, so we just verify it's disabled
    expect(args.onSubmit).not.toHaveBeenCalled();

    // Fill required field
    await userEvent.type(nameInput, 'Valid Name');

    // Wait for validation to clear and form state to update
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Now the save button should be enabled
    expect(saveButton).not.toBeDisabled();

    // Now submit should work
    await userEvent.click(saveButton);
    expect(args.onSubmit).toHaveBeenCalled();
  },
};

export const FormButtonsSubcomponent: Story = {
  parameters: {
    docs: {
      description: {
        story: `
This story demonstrates how FormButtons is automatically injected as a subcomponent into the form template.
The FormRenderer component handles this injection internally, so users don't need to manage FormButtons directly.
        `,
      },
    },
  },
  render: () => (
    <div>
      <h3>FormRenderer with Integrated FormButtons</h3>
      <p>
        The FormRenderer component automatically injects the FormButtons component into the form template. Users interact with FormRenderer, and
        FormButtons is handled internally.
      </p>
      <FormRenderer schema={createFormSchema()} onSubmit={() => console.log('Form submitted')} onCancel={() => console.log('Form cancelled')} />
    </div>
  ),
};
