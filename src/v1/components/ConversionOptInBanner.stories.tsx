import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ConversionOptInBanner, ConversionOptInBannerNonAdmin, type ConversionOptInBannerProps } from './ConversionOptInBanner';
import messages from '../../Messages';

const meta: Meta<ConversionOptInBannerProps> = {
  component: ConversionOptInBanner,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Prompts org admins to opt-in to Workspace v2. Renders the admin banner when
\`isOrgAdmin\` is true, nothing otherwise. Feature flag and identity gating
live in the parent (OverviewContent), not in this component.

A non-admin variant exists as \`ConversionOptInBannerNonAdmin\` but is out of scope
for this release, so nothing renders it yet.
        `,
      },
    },
  },
  args: {
    isOrgAdmin: true,
    onGetStarted: fn(),
  },
  argTypes: {
    isOrgAdmin: {
      control: 'boolean',
      description: 'Whether the current user is an org admin',
    },
    onGetStarted: {
      description: 'Callback when "Get started now" is clicked',
      table: { category: 'Events' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.findByText(messages.conversionBannerAdminTitle.defaultMessage)).resolves.toBeInTheDocument();
    await expect(canvas.findByText(messages.conversionBannerAdminGetStarted.defaultMessage)).resolves.toBeInTheDocument();
    await expect(canvas.findByText(messages.conversionBannerAdminLearnMore.defaultMessage, { exact: false })).resolves.toBeInTheDocument();
  },
};

export const OnGetStartedCallback: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const getStartedLink = await canvas.findByText(messages.conversionBannerAdminGetStarted.defaultMessage);
    await userEvent.click(getStartedLink);
    await expect(args.onGetStarted).toHaveBeenCalledTimes(1);
  },
};

export const LearnMoreLink: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const learnMoreLink = await canvas.findByText(messages.conversionBannerAdminLearnMore.defaultMessage, { exact: false });
    const anchor = learnMoreLink.closest('a');
    await expect(anchor).toHaveAttribute(
      'href',
      'https://access.redhat.com/system/files/private_announcement_files/Hybrid-Cloud-Console-Access-Management-with-Workspaces.pdf#page=6',
    );
    await expect(anchor).toHaveAttribute('target', '_blank');
    await expect(anchor).toHaveAttribute('rel', 'noopener noreferrer');
  },
};

export const HiddenForNonAdmin: Story = {
  args: {
    isOrgAdmin: false,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('alert')).not.toBeInTheDocument();
    await expect(args.onGetStarted).not.toHaveBeenCalled();
  },
};

/**
 * The parked non-admin variant, rendered directly. Nothing ships it yet — it is out of
 * scope for this release — so this story is what keeps it from rotting in the meantime.
 *
 * It is informational: it explains the change but offers no way to start one. "Request
 * from your admin" stays plain text because there is no request flow behind it; a link or
 * button would promise an action the component cannot perform.
 */
export const NonAdminVariant: StoryObj = {
  render: () => <ConversionOptInBannerNonAdmin />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.findByText(messages.conversionBannerNonAdminTitle.defaultMessage)).resolves.toBeInTheDocument();
    await expect(canvas.findByText(messages.conversionBannerNonAdminBody.defaultMessage)).resolves.toBeInTheDocument();

    const request = await canvas.findByText(messages.conversionBannerNonAdminRequest.defaultMessage);
    await expect(request.closest('a')).toBeNull();
    await expect(request.closest('button')).toBeNull();

    // None of the admin affordances should leak into this variant.
    await expect(canvas.queryByText(messages.conversionBannerAdminTitle.defaultMessage)).not.toBeInTheDocument();
    await expect(canvas.queryByText(messages.conversionBannerAdminGetStarted.defaultMessage)).not.toBeInTheDocument();
    await expect(canvas.queryByText(messages.conversionBannerAdminLearnMore.defaultMessage, { exact: false })).not.toBeInTheDocument();
  },
};
