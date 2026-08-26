import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent } from 'storybook/test';
import { waitForModal, waitForModalClose, clickWizardNext, queryWizardStepTitle } from '../../../test-utils/interactionHelpers';
import { ConversionWizard } from './ConversionWizard';

const meta = {
  title: 'v1/components/ConversionWizard',
  component: ConversionWizard,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    onCancel: fn(),
    onSuccess: fn(),
  },
} satisfies Meta<typeof ConversionWizard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default ConversionWizard story showing the 4-step wizard skeleton:
 * 1. Introduction
 * 2. Post-conversion requirements
 * 3. Pre-conversion checklist
 * 4. Confirm conversion
 */
export const Default: Story = {
  tags: ['autodocs'],
  args: {},
  play: async ({ args }) => {
    const user = userEvent.setup();

    // Wait for wizard modal to appear
    const wizard = await waitForModal();

    // Verify we're on step 1: Introduction
    await expect(wizard.findByText('Introduction')).resolves.toBeInTheDocument();
    let stepTitle = queryWizardStepTitle();
    expect(stepTitle).toHaveTextContent('Introduction');

    // Navigate to step 2: Post-conversion requirements
    await clickWizardNext(user, wizard);
    await expect(wizard.findByText('Post-conversion requirements')).resolves.toBeInTheDocument();
    stepTitle = queryWizardStepTitle();
    expect(stepTitle).toHaveTextContent('Post-conversion requirements');

    // Navigate to step 3: Pre-conversion checklist
    await clickWizardNext(user, wizard);
    await expect(wizard.findByText('Pre-conversion checklist')).resolves.toBeInTheDocument();
    stepTitle = queryWizardStepTitle();
    expect(stepTitle).toHaveTextContent('Pre-conversion checklist');

    // Navigate to step 4: Confirm conversion
    await clickWizardNext(user, wizard);
    await expect(wizard.findByText('Confirm conversion')).resolves.toBeInTheDocument();
    stepTitle = queryWizardStepTitle();
    expect(stepTitle).toHaveTextContent('Confirm conversion');

    // Click Cancel button to close wizard
    const cancelButton = await wizard.findByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    // Verify onCancel callback was called
    await expect(args.onCancel).toHaveBeenCalled();

    // Wait for modal to close
    await waitForModalClose();
  },
};
