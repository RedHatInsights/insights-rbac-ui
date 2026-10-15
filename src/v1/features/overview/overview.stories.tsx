import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, within } from 'storybook/test';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import Overview from './overview';
import messages from '../../../Messages';

const meta: Meta<typeof Overview> = {
  component: Overview,
  tags: ['autodocs', 'custom-css'],
  parameters: {
    docs: {
      description: {
        component: `
V1 Overview page — thin wrapper that passes V1 pathnames to the shared Overview component.

Links point to V1 routes: \`/user-access/groups\`, \`/user-access/roles\`.
`,
      },
    },
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Overview>;

export const Default: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify overview page elements', async () => {
      await expect(canvas.findByLabelText('Get started card')).resolves.toBeInTheDocument();
      await expect(canvas.findByLabelText('Supporting features list')).resolves.toBeInTheDocument();
      await expect(canvas.findByLabelText('Recommended content table')).resolves.toBeInTheDocument();
      await expect(canvas.findByRole('heading', { level: 1 })).resolves.toBeInTheDocument();
    });
  },
};

export const WithConversionBanner: Story = {
  name: 'With conversion opt-in banner (org admin)',
  parameters: {
    orgAdmin: true,
    featureFlags: { 'platform-conversion.opt-in-banner': true },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify banner is visible for org admin', async () => {
      await expect(canvas.findByText(messages.conversionBannerAdminTitle.defaultMessage)).resolves.toBeInTheDocument();
      await expect(canvas.findByText(messages.conversionBannerAdminGetStarted.defaultMessage)).resolves.toBeInTheDocument();
      await expect(canvas.findByText(messages.conversionBannerAdminLearnMore.defaultMessage, { exact: false })).resolves.toBeInTheDocument();
    });
  },
};

export const ConversionBannerHiddenNonAdmin: Story = {
  name: 'Conversion banner hidden for non-admin',
  parameters: {
    orgAdmin: false,
    featureFlags: { 'platform-conversion.opt-in-banner': true },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify overview loads but banner is absent', async () => {
      await expect(canvas.findByRole('heading', { level: 1 })).resolves.toBeInTheDocument();
      expect(canvas.queryByText(messages.conversionBannerAdminTitle.defaultMessage)).not.toBeInTheDocument();
    });
  },
};
