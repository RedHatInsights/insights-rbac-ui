/**
 * ConversionWizard - Federated Module Stories
 *
 * Smoke tests that validate the federated module renders without Storybook's
 * context providers (noWrapping: true).
 *
 * For the full four-step walkthrough and the success/failure screens, see:
 * the co-located ConversionWizard stories under src/v1/components/conversion-wizard.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { waitForModal } from '../test-utils/interactionHelpers';
import { tenantOptInHandlers } from '../v1/data/mocks/tenant.handlers';
import ConversionWizard, { type ConversionWizardProps } from './ConversionWizard';

const meta: Meta<ConversionWizardProps> = {
  title: 'Federated Modules/ConversionWizard',
  component: ConversionWizard,
  tags: ['autodocs'],
  parameters: {
    noWrapping: true,
    layout: 'fullscreen',
    msw: { handlers: tenantOptInHandlers() },
    docs: {
      description: {
        component: `
## Federated Module Smoke Test

This story validates that \`ConversionWizard\` renders as a federated module with \`noWrapping: true\`.

The wizard renders its own modal and is always open while mounted, so consumers control
visibility by mounting and unmounting it — there is no \`isOpen\` prop.

### External Consumer Usage

Pairs with \`./modules/ConversionOptInBanner\`, whose \`onGetStarted\` callback mounts the wizard:

\`\`\`tsx
const [isWizardOpen, setWizardOpen] = useState(false);

<AsyncComponent
  scope="rbac"
  module="./modules/ConversionOptInBanner"
  isOrgAdmin={isOrgAdmin}
  onGetStarted={() => setWizardOpen(true)}
  fallback={<Skeleton />}
/>
{isWizardOpen && (
  <AsyncComponent
    scope="rbac"
    module="./modules/ConversionWizard"
    onCancel={() => setWizardOpen(false)}
    // Full page load, not setWizardOpen(false) and not a router push.
    onSuccess={() => window.location.assign('/iam/overview')}
  />
)}
\`\`\`

### \`onSuccess\` must be a full page load

By the time \`onSuccess\` fires the tenant is on V2, but the surrounding page is not. The
opt-in status it was built from is cached in two places — this app's tenant query, and
Chrome's \`isKesselOrgOnboarded\` behind the nav (120s, identity-scoped). Closing the wizard
in place strands the user on a V1 page with V1 nav until those lapse, which makes the
breakage intermittent rather than obvious. A full load re-runs both.

\`onSuccess\` is optional on the internal component but **required** on this module: the
success screen's only button is wired straight to it, so omitting it makes that button
silently do nothing.

### Providers Included

- **IntlProvider** - internationalization

The wizard reaches the RBAC tenant API through the shared browser axios client, so no
ServiceProvider or QueryClientProvider is needed.

### Props (ConversionWizardProps)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| \`onCancel\` | \`() => void\` | – | Called when the wizard is dismissed |
| \`onSuccess\` | \`() => void\` | **required** | Called when the user dismisses the success screen; the tenant is on V2 by this point, so this must navigate away with a full page load |
| \`locale\` | \`string\` | \`'en'\` | Locale for the bundled IntlProvider |
        `,
      },
    },
  },
  argTypes: {
    onCancel: {
      description: 'Callback fired when the wizard is dismissed',
      action: 'cancelled',
    },
    onSuccess: {
      description: 'Callback fired when the user dismisses the success screen',
      action: 'succeeded',
    },
  },
};

export default meta;
type Story = StoryObj<ConversionWizardProps>;

/** Smoke test - wizard mounts open, in its own modal, with all providers. */
export const Default: Story = {
  args: {
    onCancel: fn(),
    onSuccess: fn(),
  },
  play: async ({ args, step }) => {
    const wizard = await waitForModal();

    await step('Verify the wizard opens on the introduction step', async () => {
      await expect(wizard.findByRole('heading', { name: 'What changes during conversion' })).resolves.toBeInTheDocument();
      await expect(wizard.findByRole('button', { name: /next/i })).resolves.toBeInTheDocument();
    });

    await step('Verify i18n resolved through the bundled IntlProvider', async () => {
      // A raw message id here would mean IntlMessagesProvider never wrapped the tree.
      await expect(wizard.findByText(/new access management model replaces the legacy User Access feature/)).resolves.toBeInTheDocument();
    });

    await step('Verify Cancel reports back to the consumer', async () => {
      const user = userEvent.setup();
      await user.click(await wizard.findByRole('button', { name: /cancel/i }));
      await expect(args.onCancel).toHaveBeenCalledTimes(1);
    });
  },
};
