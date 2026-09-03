import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, userEvent, within } from 'storybook/test';
import { IntroductionStep } from './IntroductionStep';

const meta = {
  component: IntroductionStep,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof IntroductionStep>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The IntroductionStep is the first step of the conversion wizard.
 * It explains what changes during conversion, including:
 * - Workspace hierarchy creation
 * - How permissions change
 * - How role bindings work
 * - Legacy remediation plans deletion
 */
export const Default: Story = {
  tags: ['autodocs'],
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Verify external links are present and functional', async () => {
      // Find the "Getting Started with Access Management" link
      const gettingStartedLink = await canvas.findByRole('link', { name: /Getting Started with Access Management/i });
      expect(gettingStartedLink).toBeInTheDocument();
      expect(gettingStartedLink).toHaveAttribute('target', '_blank');
      expect(gettingStartedLink).toHaveAttribute('rel', 'noopener noreferrer');
      expect(gettingStartedLink).toHaveAttribute(
        'href',
        expect.stringContaining('Hybrid-Cloud-Console-Access-Management-with-Workspaces.pdf#page=1'),
      );

      // Find the "How role bindings work" link
      const roleBindingsLink = await canvas.findByRole('link', { name: /How role bindings work/i });
      expect(roleBindingsLink).toBeInTheDocument();
      expect(roleBindingsLink).toHaveAttribute('target', '_blank');
      expect(roleBindingsLink).toHaveAttribute('rel', 'noopener noreferrer');
      expect(roleBindingsLink).toHaveAttribute('href', expect.stringContaining('Hybrid-Cloud-Console-Access-Management-with-Workspaces.pdf#page=21'));
    });

    await step('Verify diagrams are rendered', async () => {
      const diagrams = canvas.getAllByRole('img');
      expect(diagrams).toHaveLength(3);
      expect(diagrams[0]).toHaveAttribute('alt', 'Workspace hierarchy diagram');
      expect(diagrams[1]).toHaveAttribute('alt', 'Permissions and workspace hierarchy diagram');
      expect(diagrams[2]).toHaveAttribute('alt', 'Role bindings example diagram');
    });

    await step('Test keyboard navigation to links', async () => {
      // Tab to the first link
      await user.tab();
      const gettingStartedLink = await canvas.findByRole('link', { name: /Getting Started with Access Management/i });
      expect(gettingStartedLink).toHaveFocus();

      // Tab to the second link
      await user.tab();
      const roleBindingsLink = await canvas.findByRole('link', { name: /How role bindings work/i });
      expect(roleBindingsLink).toHaveFocus();
    });
  },
};
