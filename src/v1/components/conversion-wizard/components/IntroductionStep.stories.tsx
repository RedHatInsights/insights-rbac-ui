import type { Meta, StoryObj } from '@storybook/react-webpack5';
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
};
