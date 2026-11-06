import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { MemoryRouter } from 'react-router-dom';
import { ServiceAccountsList } from './ServiceAccountsList';
import { serviceAccountsErrorHandlers, serviceAccountsHandlers } from '../../../../../../shared/data/mocks/serviceAccounts.handlers';
import { DEFAULT_SERVICE_ACCOUNTS, SAT_SERVICE_ACCOUNT } from '../../../../../../shared/data/mocks/seed';
import { selectTableRow } from '../../../../../../test-utils/interactionHelpers';

const meta: Meta<typeof ServiceAccountsList> = {
  component: ServiceAccountsList,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  args: { initialSelectedServiceAccounts: [], onSelect: fn() },
  parameters: {
    featureFlags: { 'platform.service-accounts.sat': true },
    msw: { handlers: serviceAccountsHandlers([DEFAULT_SERVICE_ACCOUNTS[0], SAT_SERVICE_ACCOUNT]) },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const MixedServiceAccessTokens: Story = {
  tags: ['ff:platform.service-accounts.sat'],
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.findByText('Token')).resolves.toBeVisible();
    await expect(canvas.findByText(DEFAULT_SERVICE_ACCOUNTS[0].clientId)).resolves.toBeVisible();
    await expect(canvas.findByText(`|service-account-${SAT_SERVICE_ACCOUNT.clientId}`)).resolves.toBeVisible();
    await selectTableRow(userEvent.setup(), canvas, SAT_SERVICE_ACCOUNT.name);
    await waitFor(() => expect(args.onSelect).toHaveBeenCalledWith([expect.objectContaining({ clientId: SAT_SERVICE_ACCOUNT.clientId })]));
  },
};
export const FlagOff: Story = {
  parameters: { featureFlags: { 'platform.service-accounts.sat': false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.findByText(SAT_SERVICE_ACCOUNT.clientId)).resolves.toBeVisible();
    await expect(canvas.queryByText('Token')).not.toBeInTheDocument();
  },
};
export const ApiError: Story = {
  parameters: { msw: { handlers: serviceAccountsErrorHandlers(500) } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).findByText('Unable to load data')).resolves.toBeVisible();
  },
};
