import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { MemoryRouter } from 'react-router-dom';
import { ServiceAccountsList } from './ServiceAccountsList';
import { serviceAccountsErrorHandlers, serviceAccountsHandlers } from '../../../../../../shared/data/mocks/serviceAccounts.handlers';
import { DEFAULT_SERVICE_ACCOUNTS, SAT_SERVICE_ACCOUNT } from '../../../../../../shared/data/mocks/seed';
import { selectTableRow } from '../../../../../../test-utils/interactionHelpers';

const FIRST_SA = DEFAULT_SERVICE_ACCOUNTS[0];

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
    msw: { handlers: serviceAccountsHandlers([FIRST_SA, SAT_SERVICE_ACCOUNT]) },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const MixedServiceAccessTokens: Story = {
  tags: ['ff:platform.service-accounts.sat'],
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.findByText('Token')).resolves.toBeVisible();
    await expect(canvas.findByText(FIRST_SA.clientId)).resolves.toBeVisible();
    await expect(canvas.findByText(`|service-account-${SAT_SERVICE_ACCOUNT.clientId}`)).resolves.toBeVisible();
    await selectTableRow(userEvent.setup(), canvas, SAT_SERVICE_ACCOUNT.name);
    await waitFor(() => expect(args.onSelect).toHaveBeenCalledWith([expect.objectContaining({ clientId: SAT_SERVICE_ACCOUNT.clientId })]));
  },
};

export const TypeFilterServiceAccount: Story = {
  tags: ['ff:platform.service-accounts.sat'],
  play: async ({ canvasElement }) => {
    const user = userEvent.setup();
    const canvas = within(canvasElement);
    // Both types visible initially
    await expect(canvas.findByText(FIRST_SA.name)).resolves.toBeVisible();
    await expect(canvas.findByText(SAT_SERVICE_ACCOUNT.name)).resolves.toBeVisible();
    // Open Type filter and select "Service account"
    const typeToggle = await canvas.findByRole('button', { name: /type/i });
    await user.click(typeToggle);
    const saOption = await canvas.findByRole('option', { name: 'Service account' });
    await user.click(saOption);
    // Only regular SA visible
    await waitFor(() => expect(canvas.queryByText(SAT_SERVICE_ACCOUNT.name)).not.toBeInTheDocument());
    await expect(canvas.findByText(FIRST_SA.name)).resolves.toBeVisible();
  },
};

export const TypeFilterServiceAccessToken: Story = {
  tags: ['ff:platform.service-accounts.sat'],
  play: async ({ canvasElement }) => {
    const user = userEvent.setup();
    const canvas = within(canvasElement);
    await expect(canvas.findByText(FIRST_SA.name)).resolves.toBeVisible();
    // Open Type filter and select "Service Access Token"
    const typeToggle = await canvas.findByRole('button', { name: /type/i });
    await user.click(typeToggle);
    const satOption = await canvas.findByRole('option', { name: 'Service Access Token' });
    await user.click(satOption);
    // Only SAT visible
    await waitFor(() => expect(canvas.queryByText(FIRST_SA.name)).not.toBeInTheDocument());
    await expect(canvas.findByText(SAT_SERVICE_ACCOUNT.name)).resolves.toBeVisible();
  },
};

export const TypeFilterClearPreservesSelection: Story = {
  tags: ['ff:platform.service-accounts.sat'],
  play: async ({ canvasElement, args }) => {
    const user = userEvent.setup();
    const canvas = within(canvasElement);
    // Select a service account first
    await selectTableRow(user, canvas, FIRST_SA.name);
    await waitFor(() => expect(args.onSelect).toHaveBeenCalledWith([expect.objectContaining({ clientId: FIRST_SA.clientId })]));
    // Apply type filter
    const typeToggle = await canvas.findByRole('button', { name: /type/i });
    await user.click(typeToggle);
    const satOption = await canvas.findByRole('option', { name: 'Service Access Token' });
    await user.click(satOption);
    await waitFor(() => expect(canvas.queryByText(FIRST_SA.name)).not.toBeInTheDocument());
    // Clear all filters
    const clearAll = await canvas.findByText('Clear all filters');
    await user.click(clearAll);
    // Both types visible again, selection preserved
    await expect(canvas.findByText(FIRST_SA.name)).resolves.toBeVisible();
    await expect(canvas.findByText(SAT_SERVICE_ACCOUNT.name)).resolves.toBeVisible();
  },
};

export const TypeFilterEmptyResults: Story = {
  tags: ['ff:platform.service-accounts.sat'],
  parameters: {
    msw: { handlers: serviceAccountsHandlers([FIRST_SA]) },
  },
  play: async ({ canvasElement }) => {
    const user = userEvent.setup();
    const canvas = within(canvasElement);
    await expect(canvas.findByText(FIRST_SA.name)).resolves.toBeVisible();
    // Filter by SAT when none exist
    const typeToggle = await canvas.findByRole('button', { name: /type/i });
    await user.click(typeToggle);
    const satOption = await canvas.findByRole('option', { name: 'Service Access Token' });
    await user.click(satOption);
    await expect(canvas.findByText(/no service accounts found/i)).resolves.toBeVisible();
  },
};

export const FlagOff: Story = {
  parameters: { featureFlags: { 'platform.service-accounts.sat': false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.findByText(SAT_SERVICE_ACCOUNT.clientId)).resolves.toBeVisible();
    await expect(canvas.queryByText('Token')).not.toBeInTheDocument();
    // Type filter not visible when flag is off
    await expect(canvas.queryByRole('button', { name: /type/i })).not.toBeInTheDocument();
  },
};

export const ApiError: Story = {
  parameters: { msw: { handlers: serviceAccountsErrorHandlers(500) } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).findByText('Unable to load data')).resolves.toBeVisible();
  },
};
