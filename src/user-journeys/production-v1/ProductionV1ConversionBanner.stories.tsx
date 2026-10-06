import { expect, within } from 'storybook/test';
import { waitForContentReady } from '../../test-utils/interactionHelpers';
import messages from '../../Messages';
import { Story, meta } from './_v1OrgAdminSetup';

export default {
  ...meta,
  title: 'User Journeys/Production/V1 (Current)/Org Admin/Conversion Banner',
  tags: ['prod-org-admin', 'ff:platform-conversion.opt-in-banner'],
};

export const BannerVisibleForOrgAdmin: Story = {
  name: 'Banner visible on overview for org admin',
  args: {
    initialRoute: '/iam/user-access/overview',
  },
  parameters: {
    featureFlags: {
      ...meta.parameters.featureFlags,
      'platform-conversion.opt-in-banner': true,
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Verify banner is visible with correct content', async () => {
      await expect(canvas.findByText(messages.conversionBannerAdminTitle.defaultMessage)).resolves.toBeInTheDocument();
      await expect(canvas.findByText(messages.conversionBannerAdminGetStarted.defaultMessage)).resolves.toBeInTheDocument();
      await expect(canvas.findByText(messages.conversionBannerAdminLearnMore.defaultMessage, { exact: false })).resolves.toBeInTheDocument();
    });

    await step('Verify learn more link opens in new tab', async () => {
      const learnMoreLink = await canvas.findByText(messages.conversionBannerAdminLearnMore.defaultMessage, { exact: false });
      const anchor = learnMoreLink.closest('a');
      await expect(anchor).toHaveAttribute('target', '_blank');
      await expect(anchor).toHaveAttribute('rel', 'noopener noreferrer');
    });
  },
};

export const BannerHiddenWhenFlagDisabled: Story = {
  name: 'Banner hidden when feature flag disabled',
  args: {
    initialRoute: '/iam/user-access/overview',
  },
  parameters: {
    featureFlags: {
      ...meta.parameters.featureFlags,
      'platform-conversion.opt-in-banner': false,
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Verify overview loads but banner is absent', async () => {
      await expect(canvas.findByRole('heading', { name: messages.overview.defaultMessage })).resolves.toBeInTheDocument();
      await expect(canvas.queryByText(messages.conversionBannerAdminTitle.defaultMessage)).not.toBeInTheDocument();
    });
  },
};
