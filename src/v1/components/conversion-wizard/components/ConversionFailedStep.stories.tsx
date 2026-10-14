import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, within } from 'storybook/test';
import { ConversionFailedStep } from './ConversionFailedStep';

const meta = {
  component: ConversionFailedStep,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof ConversionFailedStep>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The ConversionFailedStep replaces the wizard when the conversion request fails.
 * It explains that the conversion did not complete and links to the troubleshooting guide.
 */
export const Default: Story = {
  tags: ['autodocs'],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify failure title and message', async () => {
      expect(canvas.getByRole('heading', { name: /conversion failed/i })).toBeInTheDocument();
      expect(canvas.getByText(/check the troubleshooting documentation or contact support for help/i)).toBeInTheDocument();
    });

    await step('Verify troubleshooting link is present and external', async () => {
      const link = canvas.getByRole('link', { name: /troubleshooting with access management/i });
      expect(link).toHaveAttribute(
        'href',
        'https://access.redhat.com/system/files/private_announcement_files/Hybrid-Cloud-Console-Access-Management-with-Workspaces.pdf#page=1',
      );
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    await step('Verify no detail line is shown without a detail prop', async () => {
      expect(canvas.queryByText(/organization administrator/i)).not.toBeInTheDocument();
    });
  },
};

/**
 * When the API tells us why the conversion was rejected, the reason is shown
 * beneath the generic message so the user knows what to do next.
 */
export const WithErrorDetail: Story = {
  args: {
    detail: 'You must be an Organization Administrator to convert to workspace-based access management.',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify the detail appears alongside the generic message', async () => {
      expect(canvas.getByText(/check the troubleshooting documentation or contact support for help/i)).toBeInTheDocument();
      expect(canvas.getByText(/you must be an organization administrator/i)).toBeInTheDocument();
    });
  },
};
