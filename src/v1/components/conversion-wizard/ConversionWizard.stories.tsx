import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';
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
};
