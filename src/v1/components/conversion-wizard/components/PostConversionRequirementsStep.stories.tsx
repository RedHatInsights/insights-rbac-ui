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
 * 1. Understand default workspace scope
 * 2. Review Ungrouped hosts workspace
 * 3. Verify critical user access
 * 4. Review root workspace permissions
 * 5. Plan workspace structure
 */
export const Default: Story = {
  tags: ['autodocs'],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify main title and introduction are present', async () => {
      expect(canvas.getByRole('heading', { name: /Post-conversion requirements/i })).toBeInTheDocument();
      expect(canvas.getByText(/After converting to access management, it is critical to review/i)).toBeInTheDocument();
      expect(canvas.getByText(/within one week after conversion/i)).toBeInTheDocument();
    });

    await step('Verify all 5 main list item titles are present', async () => {
      expect(canvas.getByText('Understand default workspace scope')).toBeInTheDocument();
      expect(canvas.getByText('Review Ungrouped hosts workspace')).toBeInTheDocument();
      expect(canvas.getByText('Verify critical user access')).toBeInTheDocument();
      expect(canvas.getByText('Review root workspace permissions')).toBeInTheDocument();
      expect(canvas.getByText('Plan workspace structure')).toBeInTheDocument();
    });

    await step('Verify key content for each item', async () => {
      // Item 1 - Default workspace scope
      expect(canvas.getByText(/Default access and any custom default access groups now only applies/i)).toBeInTheDocument();

      // Item 2 - Ungrouped hosts
      expect(canvas.getByText(/Systems here inherit Default access permissions/i)).toBeInTheDocument();

      // Item 3 - Critical user access (bullet points)
      expect(canvas.getByText(/Confirm that key users in your organization can access their systems/i)).toBeInTheDocument();
      expect(canvas.getByText(/Focus on users in Default Admin Access, Default Access, and custom groups/i)).toBeInTheDocument();

      // Item 4 - Root workspace permissions
      expect(canvas.getByText(/Typically, only Organization Administrators should have access to the root workspace/i)).toBeInTheDocument();

      // Item 5 - Plan workspace structure (sub-bullets)
      expect(canvas.getByText(/Consider creating subworkspaces to the default workspace for:/i)).toBeInTheDocument();
      expect(canvas.getByText('High-security production environments')).toBeInTheDocument();
      expect(canvas.getByText('Compliance-required isolated systems')).toBeInTheDocument();
      expect(canvas.getByText('Environments where Default Admin Access should NOT have access')).toBeInTheDocument();
      expect(canvas.getByText('Sketch your ideal structure before implementing')).toBeInTheDocument();
    });
  },
};
