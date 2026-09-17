import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, userEvent, within } from 'storybook/test';
import FormRenderer from '@data-driven-forms/react-form-renderer/form-renderer';
import Pf4FormTemplate from '@data-driven-forms/pf4-component-mapper/form-template';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import { PreConversionChecklistStep } from './PreConversionChecklistStep';

const mapperExtension = {
  PreConversionChecklistStep,
};

const WrapperComponent = () => {
  const schema = {
    fields: [
      {
        component: 'PreConversionChecklistStep',
        name: 'checklist',
      },
    ],
  };

  return (
    <FormRenderer
      schema={schema}
      componentMapper={{ ...componentMapper, ...mapperExtension }}
      FormTemplate={Pf4FormTemplate}
      onSubmit={() => Promise.resolve()}
    />
  );
};

const meta = {
  component: WrapperComponent,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof WrapperComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The PreConversionChecklistStep is the third step of the conversion wizard.
 * It presents a checklist that users must acknowledge before proceeding with conversion:
 * - Review of current configuration
 * - Understanding that conversion is permanent
 * - Commitment to post-conversion tasks
 * - Understanding of remediation plans deletion
 */
export const Default: Story = {
  tags: ['autodocs'],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify title and description are present', async () => {
      expect(canvas.getByRole('heading', { name: /Pre-conversion checklist/i })).toBeInTheDocument();
      expect(canvas.getByText(/Please complete the checklist to confirm you understand the changes that will be made/i)).toBeInTheDocument();
    });

    await step('Verify info popover button is present', async () => {
      const popoverButton = canvas.getByRole('button', { name: /More info for checklist/i });
      expect(popoverButton).toBeInTheDocument();
    });

    await step('Verify all checkboxes are present and unchecked', async () => {
      const checkboxes = canvas.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(4);

      checkboxes.forEach((checkbox) => {
        expect(checkbox).not.toBeChecked();
      });

      // Verify specific checkbox labels
      expect(canvas.getByLabelText(/I have reviewed the current user and group configuration and understand what will change/i)).toBeInTheDocument();
      expect(canvas.getByLabelText(/I understand that conversion is permanent/i)).toBeInTheDocument();
      expect(canvas.getByLabelText(/I will complete post-conversion organization tasks/i)).toBeInTheDocument();
      expect(canvas.getByLabelText(/I understand that all existing legacy remediation plans/i)).toBeInTheDocument();
    });
  },
};

/**
 * Story demonstrating the checklist with all items checked
 */
export const AllChecked: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Check all checkboxes', async () => {
      const checkboxes = canvas.getAllByRole('checkbox');

      for (const checkbox of checkboxes) {
        await userEvent.click(checkbox);
      }
    });

    await step('Verify all checkboxes are checked', async () => {
      const checkboxes = canvas.getAllByRole('checkbox');

      checkboxes.forEach((checkbox) => {
        expect(checkbox).toBeChecked();
      });
    });
  },
};

/**
 * Story demonstrating the info popover interaction
 */
export const PopoverInteraction: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Click info button to show popover', async () => {
      const popoverButton = canvas.getByRole('button', { name: /More info for checklist/i });
      await userEvent.click(popoverButton);
    });

    await step('Verify popover content is visible', async () => {
      // Wait for popover to appear
      const popoverContent = await canvas.findByText(/These items must be acknowledged before proceeding/i);
      expect(popoverContent).toBeInTheDocument();
    });
  },
};
