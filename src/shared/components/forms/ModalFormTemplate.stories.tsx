import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { ModalFormTemplate } from './ModalFormTemplate';
import FormRenderer from '@data-driven-forms/react-form-renderer/form-renderer';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';

const meta: Meta<typeof ModalFormTemplate> = {
  component: ModalFormTemplate,
  parameters: {
    docs: {
      description: {
        component: 'A reusable modal form template that provides standardized save/cancel buttons and form layout.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock form schema for testing
const mockSchema = {
  fields: [
    {
      component: 'text-field',
      name: 'name',
      label: 'Name',
      placeholder: 'Enter name',
      isRequired: true,
      validate: [{ type: 'required' }],
    },
    {
      component: 'text-field',
      name: 'description',
      label: 'Description',
      placeholder: 'Enter description',
    },
  ],
};

const mockOnSubmit = fn();

const ModalWrapper = ({
  modalTitle = 'Modal',
  modalVariant = 'small',
  saveLabel,
  cancelLabel,
  alert,
}: {
  modalTitle?: string;
  modalVariant?: 'small' | 'medium' | 'large' | 'default';
  saveLabel?: React.ReactNode;
  cancelLabel?: React.ReactNode;
  alert?: () => React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      <FormRenderer
        schema={mockSchema}
        onSubmit={mockOnSubmit}
        onCancel={() => setIsOpen(false)}
        FormTemplate={(props) => (
          <ModalFormTemplate
            {...props}
            ModalProps={{
              isOpen,
              title: modalTitle,
              variant: modalVariant,
              onClose: () => setIsOpen(false),
            }}
            saveLabel={saveLabel}
            cancelLabel={cancelLabel}
            alert={alert}
          />
        )}
        componentMapper={componentMapper}
      />
    </>
  );
};

export const Default: Story = {
  render: () => <ModalWrapper modalTitle="Edit Information" modalVariant="small" />,
  play: async ({ canvasElement }) => {
    const canvas = within(document.body);

    // Click trigger button to open modal
    await userEvent.click(within(canvasElement).getByText('Open Modal'));

    // Check that modal is rendered with title
    await expect(canvas.getByText('Edit Information')).toBeInTheDocument();

    // Check that form fields are present
    await expect(canvas.getByLabelText(/name/i)).toBeInTheDocument();
    await expect(canvas.getByLabelText(/description/i)).toBeInTheDocument();

    // Check that buttons are present
    await expect(canvas.getByRole('button', { name: /save/i })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: /cancel/i })).toBeInTheDocument();

    // Check that save button is initially disabled (form is pristine)
    await expect(canvas.getByRole('button', { name: /save/i })).toBeDisabled();
  },
};

export const WithCustomLabels: Story = {
  render: () => <ModalWrapper modalTitle="Create New Item" modalVariant="medium" saveLabel="Create" cancelLabel="Discard" />,
  play: async ({ canvasElement }) => {
    const canvas = within(document.body);

    // Click trigger button to open modal
    await userEvent.click(within(canvasElement).getByText('Open Modal'));

    // Check custom button labels
    await expect(canvas.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    await expect(canvas.getByRole('button', { name: 'Discard' })).toBeInTheDocument();
  },
};

export const WithAlert: Story = {
  render: () => (
    <ModalWrapper
      modalTitle="Warning Required"
      modalVariant="large"
      alert={() => (
        <div className="pf-v6-c-alert pf-m-warning pf-v6-u-mb-md" role="alert">
          <div className="pf-v6-c-alert__icon">⚠️</div>
          <div className="pf-v6-c-alert__title">Please review your changes carefully</div>
        </div>
      )}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(document.body);

    // Click trigger button to open modal
    await userEvent.click(within(canvasElement).getByText('Open Modal'));

    // Check that alert is displayed
    await expect(canvas.getByText('Please review your changes carefully')).toBeInTheDocument();
  },
};

export const InteractiveForm: Story = {
  render: () => <ModalWrapper modalTitle="Interactive Form" modalVariant="small" />,
  play: async ({ canvasElement }) => {
    const canvas = within(document.body);

    // Click trigger button to open modal
    await userEvent.click(within(canvasElement).getByText('Open Modal'));

    const nameInput = canvas.getByLabelText(/name/i);
    const descriptionInput = canvas.getByLabelText(/description/i);
    const saveButton = canvas.getByRole('button', { name: /save/i });
    const cancelButton = canvas.getByRole('button', { name: /cancel/i });

    // Initially save button should be disabled
    await expect(saveButton).toBeDisabled();

    // Fill in required field
    await userEvent.type(nameInput, 'Test Name');

    // Save button should be enabled after filling required field
    await expect(saveButton).toBeEnabled();

    // Fill in optional field
    await userEvent.type(descriptionInput, 'Test Description');

    // Save button should still be enabled
    await expect(saveButton).toBeEnabled();

    // Test cancel button functionality
    await userEvent.click(cancelButton);
    // Note: Modal should close when cancel is clicked (handled by ModalWrapper)
  },
};
