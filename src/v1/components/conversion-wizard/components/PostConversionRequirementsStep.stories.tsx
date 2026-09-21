import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, within } from 'storybook/test';
import { PostConversionRequirementsStep } from './PostConversionRequirementsStep';

const meta = {
  component: PostConversionRequirementsStep,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof PostConversionRequirementsStep>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The PostConversionRequirementsStep is the second step of the conversion wizard.
 * It displays a checklist of 5 critical tasks users should complete within one week after conversion:
 * 1. Know what's fixed
 * 2. Adjust default access roles
 * 3. Review Ungrouped hosts workspace
 * 4. Verify critical user access
 * 5. Plan workspace structure
 */
export const Default: Story = {
  tags: ['autodocs'],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify main title and introduction are present', async () => {
      expect(canvas.getByRole('heading', { name: /Post-conversion requirements/i })).toBeInTheDocument();
      expect(canvas.getByText(/Review your access structure within one week of conversion/i)).toBeInTheDocument();
      expect(canvas.getByText(/Default Admin Access and Default Access are fixed by design/i)).toBeInTheDocument();
    });

    await step('Verify all 5 main list item titles are present', async () => {
      expect(canvas.getByText(/Know what's fixed/i)).toBeInTheDocument();
      expect(canvas.getByText('Adjust default access roles')).toBeInTheDocument();
      expect(canvas.getByText('Review the Ungrouped hosts workspace')).toBeInTheDocument();
      expect(canvas.getByText('Verify critical user access')).toBeInTheDocument();
      expect(canvas.getByText('Plan workspace structure')).toBeInTheDocument();
    });

    await step('Verify key content for each item', async () => {
      // Item 1 - Know what's fixed
      expect(canvas.getByText(/Default Admin Access binds at the root workspace/i)).toBeInTheDocument();

      // Item 2 - Adjust default access roles
      expect(canvas.getByText(/Default Access carries over whatever roles you had configured/i)).toBeInTheDocument();

      // Item 3 - Ungrouped hosts
      expect(canvas.getByText(/Systems here inherit Default Access's bound roles/i)).toBeInTheDocument();

      // Item 4 - Critical user access (bullet points)
      expect(canvas.getByText(/Confirm 3-5 users across your org can reach their systems/i)).toBeInTheDocument();
      expect(canvas.getByText(/Covers Default Admin Access, Default Access, and custom groups/i)).toBeInTheDocument();

      // Item 5 - Plan workspace structure (sub-bullets)
      expect(canvas.getByText(/Create subworkspaces under the Default workspace for:/i)).toBeInTheDocument();
      expect(canvas.getByText('High-security production environments')).toBeInTheDocument();
      expect(canvas.getByText('Compliance-required isolated systems')).toBeInTheDocument();
      expect(canvas.getByText(/Organization Administrators keep access everywhere via Default Admin Access/i)).toBeInTheDocument();
    });
  },
};
