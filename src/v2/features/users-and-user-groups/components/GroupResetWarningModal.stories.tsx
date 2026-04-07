import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { GroupResetWarningModal } from './GroupResetWarningModal';
import { fn } from 'storybook/test';

const meta = {
  title: 'V2/Users and User Groups/Components/GroupResetWarningModal',
  component: GroupResetWarningModal,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Warning modal shown when user attempts to restore a customized default group to system defaults.',
      },
    },
  },
  args: {
    onClose: fn(),
    onConfirm: fn(),
  },
} satisfies Meta<typeof GroupResetWarningModal>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Modal shown when clicking "Restore to default" on a customized default group.
 * Warns that restoring will delete customizations and recreate the system-managed version.
 */
export const Default: Story = {
  args: {
    isOpen: true,
  },
};

/**
 * Closed state (hidden)
 */
export const Closed: Story = {
  args: {
    isOpen: false,
  },
};
