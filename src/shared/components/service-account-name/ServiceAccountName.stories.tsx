import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { ServiceAccountName } from './ServiceAccountName';
import { SAT_SERVICE_ACCOUNT } from '../../data/mocks/seed';

const meta: Meta<typeof ServiceAccountName> = {
  component: ServiceAccountName,
  args: { name: SAT_SERVICE_ACCOUNT.name, serviceAccountType: SAT_SERVICE_ACCOUNT.type, satEnabled: true },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Token: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.findByText('Token')).resolves.toBeVisible();
    await expect(canvas.findByText(SAT_SERVICE_ACCOUNT.name)).resolves.toBeVisible();
  },
};
export const FlagOff: Story = {
  args: { satEnabled: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.findByText(SAT_SERVICE_ACCOUNT.name)).resolves.toBeVisible();
    await expect(canvas.queryByText('Token')).not.toBeInTheDocument();
  },
};
export const OrdinaryAccount: Story = { ...FlagOff, args: { serviceAccountType: undefined } };
export const UnknownType: Story = { ...FlagOff, args: { serviceAccountType: 'future-type' } };
