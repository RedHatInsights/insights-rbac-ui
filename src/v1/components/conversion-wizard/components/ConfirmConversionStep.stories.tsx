import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, within } from 'storybook/test';
import { ConfirmConversionStep } from './ConfirmConversionStep';

const meta = {
  component: ConfirmConversionStep,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof ConfirmConversionStep>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The ConfirmConversionStep is the fourth and final step of the conversion wizard.
 * It displays:
 * - A non-dismissable warning banner about conversion being permanent
 * - Information about what the conversion will do
 * - A confirmation checkbox (rendered by data-driven-forms from the schema)
 */
export const Default: Story = {
  tags: ['autodocs'],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify title is present', async () => {
      expect(canvas.getByRole('heading', { name: /Confirm conversion/i })).toBeInTheDocument();
    });

    await step('Verify warning banner is present and non-dismissable', async () => {
      expect(canvas.getByRole('heading', { name: /Warning alert: Conversion is permanent/i })).toBeInTheDocument();
      expect(canvas.getByText(/Once you convert to workspace-based access management/i)).toBeInTheDocument();

      // Verify no close button (non-dismissable)
      const closeButtons = canvas.queryAllByRole('button', { name: /close/i });
      expect(closeButtons).toHaveLength(0);
    });

    await step('Verify main content is present', async () => {
      expect(canvas.getByText(/You are about to convert your organization from User Access/i)).toBeInTheDocument();
      expect(canvas.getByText(/Create a workspace hierarchy/i)).toBeInTheDocument();
      expect(canvas.getByText(/Convert all existing permissions to role bindings/i)).toBeInTheDocument();
      expect(canvas.getByText(/Preserve all user groups and role assignments/i)).toBeInTheDocument();
      expect(canvas.getByText(/Change the scope of Default Admin Access and Default Access groups/i)).toBeInTheDocument();
    });

    await step('Verify confirmation question is present', async () => {
      expect(canvas.getByText(/Are you sure you wish to move forward with this conversion/i)).toBeInTheDocument();
    });
  },
};
