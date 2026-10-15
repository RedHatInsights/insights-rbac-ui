import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, within } from 'storybook/test';
import { RoleCreationSuccess } from './RoleCreationSuccess';

const onCloseSpy = fn();
const onCreateAnotherSpy = fn();
const onAddToGroupSpy = fn();

const meta: Meta<typeof RoleCreationSuccess> = {
  component: RoleCreationSuccess,
};

export default meta;
type Story = StoryObj<typeof RoleCreationSuccess>;

export const Default: Story = {
  args: {
    onClose: onCloseSpy,
    onCreateAnother: onCreateAnotherSpy,
    onAddToGroup: onAddToGroupSpy,
  },
  play: async ({ canvasElement, step }) => {
    onCloseSpy.mockClear();
    onCreateAnotherSpy.mockClear();
    onAddToGroupSpy.mockClear();

    await step('Verify role creation success', async () => {
      const canvas = within(canvasElement);

      // Verify success heading (intl defaultMessage)
      await expect(canvas.findByText('You have successfully created a new role')).resolves.toBeInTheDocument();

      // Verify all 3 buttons render
      const exitButton = await canvas.findByRole('button', { name: 'Exit' });
      const createAnotherButton = await canvas.findByRole('button', { name: 'Create another role' });
      const addToGroupButton = await canvas.findByRole('button', { name: 'Add role to group' });

      await expect(exitButton).toBeInTheDocument();
      await expect(createAnotherButton).toBeInTheDocument();
      await expect(addToGroupButton).toBeInTheDocument();

      // Click each button and verify its spy fires
      await userEvent.click(exitButton);
      await expect(onCloseSpy).toHaveBeenCalledTimes(1);

      await userEvent.click(createAnotherButton);
      await expect(onCreateAnotherSpy).toHaveBeenCalledTimes(1);

      await userEvent.click(addToGroupButton);
      await expect(onAddToGroupSpy).toHaveBeenCalledTimes(1);
    });
  },
};

export const CloseOnly: Story = {
  render: () => <RoleCreationSuccess onClose={onCloseSpy} />,
  play: async ({ canvasElement, step }) => {
    onCloseSpy.mockClear();
    const canvas = within(canvasElement);
    await step('Verify close only', async () => {
      await expect(canvas.findByText('You have successfully created a new role')).resolves.toBeInTheDocument();

      // Only exit button should be present
      const exitButton = await canvas.findByRole('button', { name: 'Exit' });
      await expect(exitButton).toBeInTheDocument();

      // Optional buttons should NOT be present
      await expect(canvas.queryByRole('button', { name: 'Create another role' })).not.toBeInTheDocument();
      await expect(canvas.queryByRole('button', { name: 'Add role to group' })).not.toBeInTheDocument();

      await userEvent.click(exitButton);
      await expect(onCloseSpy).toHaveBeenCalledTimes(1);
    });
  },
};
