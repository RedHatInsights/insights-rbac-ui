import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import FormRenderer from '@data-driven-forms/react-form-renderer/form-renderer';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import { MemoryRouter } from 'react-router-dom';
import { expect, fn, within } from 'storybook/test';
import { serviceAccountsHandlers } from '../../../../../../shared/data/mocks/serviceAccounts.handlers';
import { DEFAULT_SERVICE_ACCOUNTS, SAT_SERVICE_ACCOUNT } from '../../../../../../shared/data/mocks/seed';
import { SetServiceAccounts } from './SetServiceAccounts';

const SetServiceAccountsWithForm = () => (
  <MemoryRouter>
    <FormRenderer
      schema={{ fields: [{ component: 'set-service-accounts', name: 'service-accounts-list' }] }}
      componentMapper={{ ...componentMapper, 'set-service-accounts': SetServiceAccounts }}
      FormTemplate={({ formFields }) => <>{formFields}</>}
      onSubmit={fn()}
    />
  </MemoryRouter>
);

const meta: Meta<typeof SetServiceAccountsWithForm> = {
  component: SetServiceAccountsWithForm,
  parameters: {
    featureFlags: { 'platform.service-accounts.sat': true },
    msw: { handlers: serviceAccountsHandlers([DEFAULT_SERVICE_ACCOUNTS[0], SAT_SERVICE_ACCOUNT]) },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const MixedServiceAccessTokens: Story = {
  tags: ['ff:platform.service-accounts.sat'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.findByText('Token')).resolves.toBeVisible();
    await expect(canvas.findByText(`|service-account-${SAT_SERVICE_ACCOUNT.clientId}`)).resolves.toBeVisible();
  },
};
