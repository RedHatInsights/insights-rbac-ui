/**
 * ConversionOptInBanner - Federated Module Stories
 *
 * Smoke tests that validate the federated module renders without Storybook's
 * context providers (noWrapping: true).
 *
 * For comprehensive component tests, see:
 * Features/Overview (co-located) and User Journeys/Production/V1/Conversion Banner
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import ConversionOptInBanner, { type ConversionOptInBannerProps } from './ConversionOptInBanner';

const meta: Meta<ConversionOptInBannerProps> = {
  title: 'Federated Modules/ConversionOptInBanner',
  component: ConversionOptInBanner,
  tags: ['autodocs'],
  parameters: {
    noWrapping: true,
    docs: {
      description: {
        component: `
## Federated Module Smoke Test

This story validates that \`ConversionOptInBanner\` renders as a federated module with \`noWrapping: true\`.

### External Consumer Usage

\`\`\`tsx
<AsyncComponent
  scope="rbac"
  module="./modules/ConversionOptInBanner"
  isOrgAdmin={isOrgAdmin}
  onGetStarted={handleGetStarted}
  fallback={<Skeleton />}
/>
\`\`\`

### Providers Included

- **IntlProvider** - internationalization

### Props (ConversionOptInBannerProps)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| \`isOrgAdmin\` | \`boolean\` | – | Whether the current user is an org admin |
| \`onGetStarted\` | \`() => void\` | – | Callback when "Get started now" is clicked |

### Variants

- **Admin** — "Get started now" (fires \`onGetStarted\`) and "Learn more about the benefits"
- **Non-admin** — renders nothing. An informational variant exists in the v1 component as
  \`ConversionOptInBannerNonAdmin\`, but it is out of scope for this release and is not
  reachable through this module.

### Host responsibilities

This module renders unconditionally. It reads no feature flags and no identity beyond the
\`isOrgAdmin\` prop, so the consumer owns the gating:

- **Feature flag** — in-app this is \`platform.conversion.opt-in-banner\`; \`OverviewContent\`
  mounts the banner only when it and \`orgAdmin\` are both true.
- **Org admin** — pass \`isOrgAdmin\`; the module renders nothing when it is false.
- **Tenant eligibility** — the wizard's job, not the host's. It calls
  \`GET /tenant/opt-in/eligibility/\` before converting and names any blocking custom roles and
  groups, so an ineligible org gets an actionable explanation rather than a dead end.
        `,
      },
    },
  },
  argTypes: {
    isOrgAdmin: {
      description: 'Whether the current user is an org admin',
      control: { type: 'boolean' },
    },
    onGetStarted: {
      description: 'Callback fired when "Get started now" is clicked',
      action: 'get-started-clicked',
    },
  },
};

export default meta;
type Story = StoryObj<ConversionOptInBannerProps>;

/** Smoke test - banner renders for org admin with all providers */
export const OrgAdmin: Story = {
  args: {
    isOrgAdmin: true,
    onGetStarted: fn(),
  },
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);

    await step('Verify banner renders with correct content', async () => {
      await expect(canvas.findByText('Elevate your infrastructure with workspace-based access management')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('Get started now')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('Learn more about the benefits', { exact: false })).resolves.toBeInTheDocument();
    });

    await step('Verify Get started fires callback', async () => {
      const getStartedButton = await canvas.findByText('Get started now');
      await userEvent.click(getStartedButton);
      await expect(args.onGetStarted).toHaveBeenCalledTimes(1);
    });

    await step('Verify Learn more link opens in new tab', async () => {
      const learnMoreLink = await canvas.findByText('Learn more about the benefits', { exact: false });
      const anchor = learnMoreLink.closest('a');
      await expect(anchor).toHaveAttribute('target', '_blank');
      await expect(anchor).toHaveAttribute('rel', 'noopener noreferrer');
    });
  },
};

/** Non-admin - banner should not render */
export const NonAdmin: Story = {
  args: {
    isOrgAdmin: false,
    onGetStarted: fn(),
  },
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);

    await step('Verify banner is not rendered for non-admin', async () => {
      expect(canvas.queryByText('Elevate your infrastructure with workspace-based access management')).not.toBeInTheDocument();
      expect(canvas.queryByText('Get started now')).not.toBeInTheDocument();
      expect(args.onGetStarted).not.toHaveBeenCalled();
    });

    await step('Verify the parked non-admin variant does not leak through this module', async () => {
      expect(canvas.queryByText('Ready for a smarter way to organize your work?')).not.toBeInTheDocument();
      expect(canvas.queryByText('Request from your admin')).not.toBeInTheDocument();
    });
  },
};
