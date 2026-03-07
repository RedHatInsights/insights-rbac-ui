import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, within } from 'storybook/test';
import { GroupCreationSuccess } from './GroupCreationSuccess';

const meta: Meta<typeof GroupCreationSuccess> = {
  component: GroupCreationSuccess,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A success state component displayed after successfully creating a group. Features:
- Green check icon with localized success message
- Primary action button to exit/close
- Optional secondary action to create another group
- Uses PatternFly EmptyState pattern for consistent UX
- Handles internationalization internally using react-intl
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof GroupCreationSuccess>;

export const Default: Story = {
  args: {
    onClose: fn(),
    onCreateAnother: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Test primary close button
    const exitButton = await canvas.findByRole('button', { name: 'Exit' });
    await userEvent.click(exitButton);
    await expect(args.onClose).toHaveBeenCalled();

    // Test secondary create another button
    const createAnotherButton = await canvas.findByRole('button', { name: 'Create another group' });
    await userEvent.click(createAnotherButton);
    await expect(args.onCreateAnother).toHaveBeenCalled();
  },
};

export const WithoutCreateAnother: Story = {
  args: {
    onClose: fn(),
    onCreateAnother: undefined, // Explicitly set to undefined to override Storybook's automatic actions
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Test that the close button works
    const closeButton = await canvas.findByRole('button', { name: 'Exit' });
    await userEvent.click(closeButton);
    await expect(args.onClose).toHaveBeenCalled();

    // Verify create another button is not present (since onCreateAnother is undefined)
    const linkButtons = canvas.queryAllByRole('button').filter((button) => button.classList.contains('pf-m-link'));
    await expect(linkButtons).toHaveLength(0);
  },
};
