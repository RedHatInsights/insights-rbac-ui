import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { waitForModal, waitForModalClose } from '../../../test-utils/interactionHelpers';
import { waitForWizardStep, wizardCancelButton } from '../../components/conversion-wizard/ConversionWizard.helpers';
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

/**
 * Watches the document from before the story mounts and records whether a string ever entered it,
 * even for a single frame.
 *
 * `useIdentity` resolves from a Chrome promise that has already settled by the time `play` runs,
 * so a play function cannot see the window in which identity is still unknown. Recording from
 * `beforeEach` can: anything rendered during that window shows up here and nowhere else.
 */
function recordEverAppeared(text: string): { seen: () => boolean; stop: () => void } {
  let seen = document.body.textContent?.includes(text) ?? false;
  const observer = new MutationObserver(() => {
    seen = seen || (document.body.textContent?.includes(text) ?? false);
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });

  return { seen: () => seen, stop: () => observer.disconnect() };
}

let adminBannerRecorder: ReturnType<typeof recordEverAppeared>;

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
    featureFlags: { 'platform.conversion.opt-in-banner': true },
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

/**
 * A9 — "Get started now" mounts the wizard, rather than merely firing its callback.
 *
 * The banner's own story already covers the callback; this one covers the wiring between the
 * banner and the wizard that makes the conversion reachable at all from the Overview page.
 */
export const ConversionBannerOpensWizard: Story = {
  name: 'Conversion banner opens the wizard',
  parameters: {
    orgAdmin: true,
    featureFlags: { 'platform.conversion.opt-in-banner': true },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('"Get started now" opens the wizard on its Introduction step', async () => {
      await user.click(await canvas.findByText(messages.conversionBannerAdminGetStarted.defaultMessage));

      const wizard = await waitForModal();
      await waitForWizardStep(wizard, 'introduction');
    });

    await step('Cancelling leaves the Overview page intact', async () => {
      const wizard = await waitForModal();
      await user.click(wizardCancelButton(wizard));

      await waitForModalClose();
      expect(canvas.getByText(messages.conversionBannerAdminTitle.defaultMessage)).toBeInTheDocument();
    });
  },
};

export const ConversionBannerHiddenNonAdmin: Story = {
  name: 'Conversion banner hidden for non-admin',
  parameters: {
    orgAdmin: false,
    featureFlags: { 'platform.conversion.opt-in-banner': true },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify overview loads but banner is absent', async () => {
      await expect(canvas.findByRole('heading', { level: 1 })).resolves.toBeInTheDocument();
      expect(canvas.queryByText(messages.conversionBannerAdminTitle.defaultMessage)).not.toBeInTheDocument();
    });
  },
};

/**
 * A4 — the admin banner must never flash, not even for one render, at a user who turns out not to
 * be an org admin.
 *
 * `useIdentity` initialises `orgAdmin: false` and only ever settles to `false` here, so this
 * cannot currently fail. It is a regression guard: rendering the banner optimistically, or
 * defaulting the flag the other way while Chrome is still answering, would show an admin-only
 * call to action to everyone for the duration of the round trip. The end-state assertion in
 * {@link ConversionBannerHiddenNonAdmin} would stay green through that; this one would not.
 *
 * Layout shift and reserved space are deliberately not asserted — neither is observable in a
 * story interaction test.
 */
export const NoBannerFlashBeforeIdentityResolves: Story = {
  name: 'No banner flashes before identity resolves',
  parameters: {
    orgAdmin: false,
    featureFlags: { 'platform.conversion.opt-in-banner': true },
  },
  beforeEach: () => {
    adminBannerRecorder = recordEverAppeared(messages.conversionBannerAdminTitle.defaultMessage);
    return () => adminBannerRecorder.stop();
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('The page mounts rather than suspending on identity', async () => {
      await expect(canvas.findByRole('heading', { level: 1 })).resolves.toBeInTheDocument();
      await expect(canvas.findByLabelText('Get started card')).resolves.toBeInTheDocument();
    });

    await step('The admin banner was never in the document at any point', async () => {
      expect(canvas.queryByText(messages.conversionBannerAdminTitle.defaultMessage)).not.toBeInTheDocument();
      expect(adminBannerRecorder.seen()).toBe(false);
    });
  },
};
