import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { MemoryRouter } from 'react-router-dom';
import { ServiceAccountsList } from './ServiceAccountsList';
import { serviceAccountsErrorHandlers, serviceAccountsHandlers } from '../../../../../../shared/data/mocks/serviceAccounts.handlers';
import { DEFAULT_SERVICE_ACCOUNTS, SAT_SERVICE_ACCOUNT } from '../../../../../../shared/data/mocks/seed';
import { selectTableRow, toggleCheckboxFilterOption } from '../../../../../../test-utils/interactionHelpers';

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
    featureFlags: { 'platform.service-accounts.sat': true, 'platform.service-accounts.type-filter': true },
    msw: { handlers: serviceAccountsHandlers([FIRST_SA, SAT_SERVICE_ACCOUNT]) },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const MixedServiceAccessTokens: Story = {
  tags: ['ff:platform.service-accounts.sat', 'ff:platform.service-accounts.type-filter'],
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
  tags: ['ff:platform.service-accounts.sat', 'ff:platform.service-accounts.type-filter'],
  play: async ({ canvasElement }) => {
    const user = userEvent.setup();
    const canvas = within(canvasElement);
    // Both types visible initially
    await expect(canvas.findByText(FIRST_SA.name)).resolves.toBeVisible();
    await expect(canvas.findByText(SAT_SERVICE_ACCOUNT.name)).resolves.toBeVisible();
    // Open Type checkbox filter and select "Service account" via portal-aware helper
    await toggleCheckboxFilterOption(user, canvas, 'Filter by type...', 'Service account');
    // Only regular SA visible
    await waitFor(() => expect(canvas.queryByText(SAT_SERVICE_ACCOUNT.name)).not.toBeInTheDocument());
    await expect(canvas.findByText(FIRST_SA.name)).resolves.toBeVisible();
  },
};

export const TypeFilterServiceAccessToken: Story = {
  tags: ['ff:platform.service-accounts.sat', 'ff:platform.service-accounts.type-filter'],
  play: async ({ canvasElement }) => {
    const user = userEvent.setup();
    const canvas = within(canvasElement);
    await expect(canvas.findByText(FIRST_SA.name)).resolves.toBeVisible();
    // Open Type checkbox filter and select "Service Access Token" via portal-aware helper
    await toggleCheckboxFilterOption(user, canvas, 'Filter by type...', 'Service Access Token');
    // Only SAT visible
    await waitFor(() => expect(canvas.queryByText(FIRST_SA.name)).not.toBeInTheDocument());
    await expect(canvas.findByText(SAT_SERVICE_ACCOUNT.name)).resolves.toBeVisible();
  },
};

export const TypeFilterClearPreservesSelection: Story = {
  tags: ['ff:platform.service-accounts.sat', 'ff:platform.service-accounts.type-filter'],
  play: async ({ canvasElement, args }) => {
    const user = userEvent.setup();
    const canvas = within(canvasElement);
    // Select a service account first
    await selectTableRow(user, canvas, FIRST_SA.name);
    await waitFor(() => expect(args.onSelect).toHaveBeenCalledWith([expect.objectContaining({ clientId: FIRST_SA.clientId })]));
    // Apply type filter to hide the selected SA
    await toggleCheckboxFilterOption(user, canvas, 'Filter by type...', 'Service Access Token');
    await waitFor(() => expect(canvas.queryByText(FIRST_SA.name)).not.toBeInTheDocument());
    // Close the checkbox filter dropdown before clicking toolbar buttons
    const filterToggle = await canvas.findByRole('button', { name: 'Filter by type...' });
    await user.click(filterToggle);
    // Clear all filters (DataViewToolbar renders "Clear filters")
    const clearAll = await canvas.findByText('Clear filters');
    await user.click(clearAll);
    // Both types visible again
    await expect(canvas.findByText(FIRST_SA.name)).resolves.toBeVisible();
    await expect(canvas.findByText(SAT_SERVICE_ACCOUNT.name)).resolves.toBeVisible();
    // Verify selection persisted: the checkbox on the previously-selected row should still be checked
    const cell = await canvas.findByText(FIRST_SA.name);
    const row = cell.closest('tr') as HTMLElement;
    const checkbox = within(row).getByRole('checkbox');
    expect(checkbox).toBeChecked();
  },
};

export const TypeFilterSwitchPreservesSelection: Story = {
  tags: ['ff:platform.service-accounts.sat', 'ff:platform.service-accounts.type-filter'],
  play: async ({ canvasElement, args }) => {
    const user = userEvent.setup();
    const canvas = within(canvasElement);
    // Select a regular service account first
    await selectTableRow(user, canvas, FIRST_SA.name);
    await waitFor(() => expect(args.onSelect).toHaveBeenCalledWith([expect.objectContaining({ clientId: FIRST_SA.clientId })]));
    // Filter by "Service account" — only regular SA shown
    await toggleCheckboxFilterOption(user, canvas, 'Filter by type...', 'Service account');
    await waitFor(() => expect(canvas.queryByText(SAT_SERVICE_ACCOUNT.name)).not.toBeInTheDocument());
    await expect(canvas.findByText(FIRST_SA.name)).resolves.toBeVisible();
    // Switch to "Service Access Token" — single-choice enforced, previous value replaced
    await toggleCheckboxFilterOption(user, canvas, 'Filter by type...', 'Service Access Token');
    await waitFor(() => expect(canvas.queryByText(FIRST_SA.name)).not.toBeInTheDocument());
    await expect(canvas.findByText(SAT_SERVICE_ACCOUNT.name)).resolves.toBeVisible();
    // Close the filter dropdown before clearing
    const filterToggle = await canvas.findByRole('button', { name: 'Filter by type...' });
    await user.click(filterToggle);
    // Clear all filters — both types visible again
    const clearAll = await canvas.findByText('Clear filters');
    await user.click(clearAll);
    await expect(canvas.findByText(FIRST_SA.name)).resolves.toBeVisible();
    await expect(canvas.findByText(SAT_SERVICE_ACCOUNT.name)).resolves.toBeVisible();
    // Verify selection persisted through the filter round-trip
    const cell = await canvas.findByText(FIRST_SA.name);
    const row = cell.closest('tr') as HTMLElement;
    const checkbox = within(row).getByRole('checkbox');
    expect(checkbox).toBeChecked();
  },
};

export const TypeFilterFlagOff: Story = {
  parameters: {
    featureFlags: { 'platform.service-accounts.sat': true, 'platform.service-accounts.type-filter': false },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // SAT display features still work (Token badge, combined clientId column)
    await expect(canvas.findByText('Token')).resolves.toBeVisible();
    // But the Type filter is not available
    await expect(canvas.queryByRole('button', { name: /filter by type/i })).not.toBeInTheDocument();
  },
};

export const TypeFilterEmptyResults: Story = {
  tags: ['ff:platform.service-accounts.sat', 'ff:platform.service-accounts.type-filter'],
  parameters: {
    msw: { handlers: serviceAccountsHandlers([FIRST_SA]) },
  },
  play: async ({ canvasElement }) => {
    const user = userEvent.setup();
    const canvas = within(canvasElement);
    await expect(canvas.findByText(FIRST_SA.name)).resolves.toBeVisible();
    // Filter by SAT when none exist
    await toggleCheckboxFilterOption(user, canvas, 'Filter by type...', 'Service Access Token');
    await expect(canvas.findByText(/no service accounts found/i)).resolves.toBeVisible();
  },
};

export const FlagOff: Story = {
  parameters: { featureFlags: { 'platform.service-accounts.sat': false, 'platform.service-accounts.type-filter': false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.findByText(SAT_SERVICE_ACCOUNT.clientId)).resolves.toBeVisible();
    await expect(canvas.queryByText('Token')).not.toBeInTheDocument();
    // Type filter not visible when both flags are off
    await expect(canvas.queryByRole('button', { name: /filter by type/i })).not.toBeInTheDocument();
  },
};

export const ApiError: Story = {
  parameters: { msw: { handlers: serviceAccountsErrorHandlers(500) } },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).findByText('Unable to load data')).resolves.toBeVisible();
  },
};
